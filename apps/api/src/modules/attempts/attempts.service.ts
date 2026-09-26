import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { DatabaseService } from '../../infrastructure/database/database';
import { attempts, results, submissions } from '../../infrastructure/database/schema';
import { DomainError } from '../../common/errors';
import { EducationService } from '../education/education.service';
import { evaluateSingleChoice, assertSingleChoiceContent } from '../tasks/single-choice.evaluator';
import { AuditService } from '../audit/audit.service';
import { TeachingService } from '../teaching/teaching.service';
import type { AttemptResult, AttemptView, ResultView, StartedAttempt, SubmittedAttempt } from './attempts.types';

@Injectable()
export class AttemptsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly education: EducationService,
    private readonly audit: AuditService,
    private readonly teaching: TeachingService,
  ) {}

  async start(studentId: string, taskVersionId: string, assignmentId: string): Promise<StartedAttempt> {
    if (!assignmentId) throw new ForbiddenException('An assignment is required');
    const assignment = await this.teaching.findAssignmentForStudent(studentId, assignmentId);
    const task = await this.education.findPublishedTaskVersion(taskVersionId);
    if (!assignment || assignment.taskVersionId !== taskVersionId || !task) {
      throw new ForbiddenException('Assignment does not grant access to this task');
    }
    return this.database.transaction(async () => {
      const currentAssignment = await this.teaching.findAssignmentForStudent(studentId, assignmentId);
      const currentTask = await this.education.findPublishedTaskVersion(taskVersionId);
      if (!currentAssignment || currentAssignment.taskVersionId !== taskVersionId || !currentTask) {
        throw new ForbiddenException('Assignment does not grant access to this task');
      }
      const [created] = await this.database.db.insert(attempts).values({ studentId, taskVersionId, assignmentId })
        .onConflictDoNothing({ target: attempts.assignmentId }).returning();
      const attempt = created ?? (await this.database.db.select().from(attempts).where(and(eq(attempts.assignmentId, assignmentId), eq(attempts.studentId, studentId))).limit(1))[0];
      if (!attempt) throw new Error('Attempt creation failed');
      if (created) await this.audit.record(studentId, 'attempt_started', 'attempt', attempt.id, { taskVersionId });
      return { attempt: this.toAttemptView(attempt), task: this.education.toPublicTaskVersion(currentTask.taskVersion) };
    });
  }

  async submit(studentId: string, attemptId: string, idempotencyKey: string, answer: unknown): Promise<SubmittedAttempt> {
    return this.database.transaction(async () => {
      const [attempt] = await this.database.db.select()
        .from(attempts)
        .where(and(eq(attempts.id, attemptId), eq(attempts.studentId, studentId)))
        .for('update', { of: attempts }).limit(1);
      if (!attempt) throw new NotFoundException('Attempt not found');
      const task = await this.education.findPublishedTaskVersion(attempt.taskVersionId);
      if (!task) throw new DomainError('INVALID_TASK_VERSION', 'Task version is not published', 422);
      const [existingSubmission] = await this.database.db.select().from(submissions).where(eq(submissions.attemptId, attemptId)).limit(1);
      if (existingSubmission) {
        if (existingSubmission.idempotencyKey !== idempotencyKey) throw new DomainError('ATTEMPT_ALREADY_SUBMITTED', 'Attempt has already been submitted', 409);
        if (!answer || typeof answer !== 'object' || Array.isArray(answer) || Object.keys(answer).length !== 1 ||
          !('optionId' in answer) || answer.optionId !== existingSubmission.answer.optionId) {
          throw new DomainError('IDEMPOTENCY_CONFLICT', 'Idempotency key was used for a different answer', 409);
        }
        const [existingResult] = await this.database.db.select().from(results).where(eq(results.submissionId, existingSubmission.id)).limit(1);
        if (!existingResult) throw new DomainError('RESULT_NOT_READY', 'Submission exists without a result', 409);
        return { attempt: this.toAttemptView(attempt), result: this.toResultView(existingResult), idempotentReplay: true };
      }
      if (attempt.status !== 'started') throw new DomainError('ATTEMPT_ALREADY_SUBMITTED', 'Attempt has already been submitted', 409);
      if (task.taskVersion.taskType !== 'single-choice' || task.taskVersion.evaluationRule !== 'single-choice.v1') throw new DomainError('UNSUPPORTED_EVALUATOR', 'Task evaluator is not supported', 422);
      assertSingleChoiceContent(task.taskVersion.content);
      const evaluation = evaluateSingleChoice(task.taskVersion.content, answer);
      if (evaluation.outcome === 'invalid') throw new DomainError('INVALID_ANSWER', 'Answer must select one available option', 422);
      const [submission] = await this.database.db.insert(submissions).values({ attemptId, idempotencyKey, answer: answer as { optionId: string } }).returning();
      if (!submission) throw new Error('Submission creation failed');
      await this.database.db.update(attempts).set({ status: 'submitted', submittedAt: new Date() }).where(eq(attempts.id, attemptId));
      const [result] = await this.database.db.insert(results).values({ attemptId, submissionId: submission.id, evaluationRule: task.taskVersion.evaluationRule, outcome: evaluation.outcome, isCorrect: evaluation.isCorrect, score: evaluation.score, details: evaluation.details }).returning();
      if (!result) throw new Error('Result creation failed');
      await this.audit.record(studentId, 'attempt_submitted', 'attempt', attemptId, { resultId: result.id, submissionId: submission.id, taskVersionId: task.taskVersion.id });
      return {
        attempt: this.toAttemptView({ ...attempt, status: 'submitted', submittedAt: new Date() }),
        result: this.toResultView(result),
        idempotentReplay: false,
      };
    });
  }

  async getResult(studentId: string, attemptId: string): Promise<AttemptResult> {
    const rows = await this.database.db.select({ result: results, attempt: attempts }).from(results).innerJoin(attempts, eq(attempts.id, results.attemptId)).where(and(eq(results.attemptId, attemptId), eq(attempts.studentId, studentId))).limit(1);
    if (!rows[0]) throw new NotFoundException('Result not found');
    return { attempt: this.toAttemptView(rows[0].attempt), result: this.toResultView(rows[0].result) };
  }

  async listResultsForTeacher(teacherId: string, studentId: string): Promise<AttemptResult[]> {
    await this.teaching.assertManagesStudent(teacherId, studentId);
    const rows = await this.database.db.select({ result: results, attempt: attempts })
      .from(results).innerJoin(attempts, eq(attempts.id, results.attemptId))
      .where(eq(attempts.studentId, studentId))
      .orderBy(desc(results.evaluatedAt));
    return rows.map((row) => ({ attempt: this.toAttemptView(row.attempt), result: this.toResultView(row.result) }));
  }

  private toAttemptView(attempt: typeof attempts.$inferSelect): AttemptView {
    return {
      id: attempt.id,
      taskVersionId: attempt.taskVersionId,
      assignmentId: attempt.assignmentId,
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
    };
  }

  private toResultView(result: typeof results.$inferSelect): ResultView {
    return {
      id: result.id,
      attemptId: result.attemptId,
      submissionId: result.submissionId,
      evaluationRule: result.evaluationRule,
      outcome: result.outcome,
      isCorrect: result.isCorrect,
      score: result.score,
      evaluatedAt: result.evaluatedAt,
    };
  }
}
