import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DatabaseService } from '../../infrastructure/database/database';
import { assignments, attempts, results, submissions, taskVersions } from '../../infrastructure/database/schema';
import { DomainError } from '../../common/errors';
import { EducationService } from '../education/education.service';
import { evaluateSingleChoice, assertSingleChoiceContent } from '../tasks/single-choice.evaluator';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AttemptsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly education: EducationService,
    private readonly audit: AuditService,
  ) {}

  async start(studentId: string, taskVersionId: string, assignmentId: string) {
    if (!assignmentId) throw new ForbiddenException('An assignment is required');
    return this.database.db.transaction(async (tx) => {
      const [assignment] = await tx.select({ assignment: assignments, version: taskVersions })
        .from(assignments).innerJoin(taskVersions, eq(taskVersions.id, assignments.taskVersionId))
        .where(and(eq(assignments.id, assignmentId), eq(assignments.studentId, studentId))).limit(1);
      if (!assignment || assignment.assignment.taskVersionId !== taskVersionId || assignment.version.status !== 'published') {
        throw new ForbiddenException('Assignment does not grant access to this task');
      }
      const [created] = await tx.insert(attempts).values({ studentId, taskVersionId, assignmentId })
        .onConflictDoNothing({ target: attempts.assignmentId }).returning();
      const attempt = created ?? (await tx.select().from(attempts).where(and(eq(attempts.assignmentId, assignmentId), eq(attempts.studentId, studentId))).limit(1))[0];
      if (!attempt) throw new Error('Attempt creation failed');
      if (created) await this.audit.recordIn(tx, studentId, 'attempt_started', 'attempt', attempt.id, { taskVersionId });
      return { attempt, task: this.education.toPublicTaskVersion(assignment.version) };
    });
  }

  async submit(studentId: string, attemptId: string, idempotencyKey: string, answer: unknown) {
    return this.database.db.transaction(async (tx) => {
      const [row] = await tx.select({ attempt: attempts, taskVersion: taskVersions })
        .from(attempts).innerJoin(taskVersions, eq(taskVersions.id, attempts.taskVersionId))
        .where(and(eq(attempts.id, attemptId), eq(attempts.studentId, studentId)))
        .for('update', { of: attempts }).limit(1);
      if (!row) throw new NotFoundException('Attempt not found');
      const [existingSubmission] = await tx.select().from(submissions).where(eq(submissions.attemptId, attemptId)).limit(1);
      if (existingSubmission) {
        if (existingSubmission.idempotencyKey !== idempotencyKey) throw new DomainError('ATTEMPT_ALREADY_SUBMITTED', 'Attempt has already been submitted', 409);
        if (!answer || typeof answer !== 'object' || Array.isArray(answer) || Object.keys(answer).length !== 1 ||
          !('optionId' in answer) || answer.optionId !== existingSubmission.answer.optionId) {
          throw new DomainError('IDEMPOTENCY_CONFLICT', 'Idempotency key was used for a different answer', 409);
        }
        const [existingResult] = await tx.select().from(results).where(eq(results.submissionId, existingSubmission.id)).limit(1);
        if (!existingResult) throw new DomainError('RESULT_NOT_READY', 'Submission exists without a result', 409);
        return { attempt: row.attempt, result: existingResult, idempotentReplay: true };
      }
      if (row.attempt.status !== 'started') throw new DomainError('ATTEMPT_ALREADY_SUBMITTED', 'Attempt has already been submitted', 409);
      if (row.taskVersion.status !== 'published') throw new DomainError('INVALID_TASK_VERSION', 'Task version is not published', 422);
      if (row.taskVersion.taskType !== 'single-choice' || row.taskVersion.evaluationRule !== 'single-choice.v1') throw new DomainError('UNSUPPORTED_EVALUATOR', 'Task evaluator is not supported', 422);
      assertSingleChoiceContent(row.taskVersion.content);
      const evaluation = evaluateSingleChoice(row.taskVersion.content, answer);
      if (evaluation.outcome === 'invalid') throw new DomainError('INVALID_ANSWER', 'Answer must select one available option', 422);
      const [submission] = await tx.insert(submissions).values({ attemptId, idempotencyKey, answer: answer as { optionId: string } }).returning();
      if (!submission) throw new Error('Submission creation failed');
      await tx.update(attempts).set({ status: 'submitted', submittedAt: new Date() }).where(eq(attempts.id, attemptId));
      const [result] = await tx.insert(results).values({ attemptId, submissionId: submission.id, evaluationRule: row.taskVersion.evaluationRule, outcome: evaluation.outcome, isCorrect: evaluation.isCorrect, score: evaluation.score, details: evaluation.details }).returning();
      if (!result) throw new Error('Result creation failed');
      await this.audit.recordIn(tx, studentId, 'attempt_submitted', 'attempt', attemptId, { resultId: result.id, submissionId: submission.id, taskVersionId: row.taskVersion.id });
      return { attempt: { ...row.attempt, status: 'submitted' as const }, result, idempotentReplay: false };
    });
  }

  async getResult(studentId: string, attemptId: string) {
    const rows = await this.database.db.select({ result: results, attempt: attempts }).from(results).innerJoin(attempts, eq(attempts.id, results.attemptId)).where(and(eq(results.attemptId, attemptId), eq(attempts.studentId, studentId))).limit(1);
    if (!rows[0]) throw new NotFoundException('Result not found');
    return rows[0];
  }
}
