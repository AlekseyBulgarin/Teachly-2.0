import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { DatabaseService } from '../../infrastructure/database/database';
import { attempts, results, submissions } from '../../infrastructure/database/schema';
import { DomainError } from '../../common/errors';
import { EducationService } from '../education/education.service';
import { LearningService } from '../learning/learning.service';
import { evaluateSingleChoice, assertSingleChoiceContent } from '../tasks/single-choice.evaluator';
import { AuditService } from '../audit/audit.service';
import { TeachingService } from '../teaching/teaching.service';
import type { TenantContext } from '../core/core.types';
import type { AttemptResult, AttemptView, LearnerAttemptSummary, ResultView, StartedAttempt, SubmittedAttempt } from './attempts.types';

@Injectable()
export class AttemptsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly education: EducationService,
    private readonly audit: AuditService,
    private readonly teaching: TeachingService,
    private readonly learning: LearningService,
  ) {}

  async start(studentId: string, taskVersionId: string, assignmentId: string, context?: TenantContext): Promise<StartedAttempt> {
    if (!assignmentId) throw new ForbiddenException('An assignment is required');
    const assignment = await this.teaching.findAssignmentForStudent(studentId, assignmentId, context);
    const task = await this.education.findPublishedTaskVersion(taskVersionId, context);
    if (!assignment || assignment.taskVersionId !== taskVersionId || !task) {
      throw new ForbiddenException('Assignment does not grant access to this task');
    }
    return this.database.transaction(async () => {
      const currentAssignment = await this.teaching.findAssignmentForStudent(studentId, assignmentId, context);
      const currentTask = await this.education.findPublishedTaskVersion(taskVersionId, context);
      if (!currentAssignment || currentAssignment.taskVersionId !== taskVersionId || !currentTask) {
        throw new ForbiddenException('Assignment does not grant access to this task');
      }
      const [created] = await this.database.db.insert(attempts).values({
        studentId,
        taskVersionId,
        assignmentId,
        workspaceId: context?.workspaceId ?? currentTask.workspaceId,
        integrationId: context?.integrationId,
      })
        .onConflictDoNothing({ target: attempts.assignmentId }).returning();
      const attempt = created ?? (await this.database.db.select().from(attempts).where(and(
        eq(attempts.assignmentId, assignmentId),
        eq(attempts.studentId, studentId),
        context ? eq(attempts.workspaceId, context.workspaceId) : undefined,
        context ? eq(attempts.integrationId, context.integrationId) : undefined,
      )).limit(1))[0];
      if (!attempt) throw new Error('Attempt creation failed');
      if (created) await this.audit.record(studentId, 'attempt_started', 'attempt', attempt.id, { taskVersionId }, context?.workspaceId);
      return { attempt: this.toAttemptView(attempt), task: this.education.toPublicTaskVersion(currentTask.taskVersion) };
    });
  }

  async startTrainer(learnerId: string, taskVersionId: string, context: TenantContext): Promise<StartedAttempt> {
    const task = await this.education.getPublishedTaskVersion(taskVersionId, context);
    if (task.workspaceId !== context.workspaceId) throw new NotFoundException('Published task version not found');
    const [attempt] = await this.database.db.insert(attempts).values({
      studentId: learnerId,
      taskVersionId,
      workspaceId: context.workspaceId,
      integrationId: context.integrationId,
    }).returning();
    if (!attempt) throw new Error('Trainer attempt creation failed');
    await this.audit.record(learnerId, 'trainer_attempt_started', 'attempt', attempt.id, { taskVersionId }, context.workspaceId);
    return { attempt: this.toAttemptView(attempt), task: this.education.toPublicTaskVersion(task.taskVersion) };
  }

  async submit(studentId: string, attemptId: string, idempotencyKey: string, answer: unknown, context?: TenantContext): Promise<SubmittedAttempt> {
    return this.database.transaction(async () => {
      const [attempt] = await this.database.db.select()
        .from(attempts)
        .where(and(
          eq(attempts.id, attemptId),
          eq(attempts.studentId, studentId),
          context ? eq(attempts.workspaceId, context.workspaceId) : undefined,
          context ? eq(attempts.integrationId, context.integrationId) : undefined,
        ))
        .for('update', { of: attempts }).limit(1);
      if (!attempt) throw new NotFoundException('Attempt not found');
      const task = await this.education.findPublishedTaskVersion(attempt.taskVersionId, context);
      if (!task) throw new DomainError('INVALID_TASK_VERSION', 'Task version is not published', 422);
      const [existingSubmission] = await this.database.db.select().from(submissions).where(and(
        eq(submissions.attemptId, attemptId),
        context ? eq(submissions.workspaceId, context.workspaceId) : undefined,
      )).limit(1);
      if (existingSubmission) {
        if (existingSubmission.idempotencyKey !== idempotencyKey) throw new DomainError('ATTEMPT_ALREADY_SUBMITTED', 'Attempt has already been submitted', 409);
        if (JSON.stringify(answer) !== JSON.stringify(existingSubmission.answer)) {
          throw new DomainError('IDEMPOTENCY_CONFLICT', 'Idempotency key was used for a different answer', 409);
        }
        if (existingSubmission.reviewStatus === 'pending_manual_review') {
          return { attempt: this.toAttemptView(attempt), result: null as unknown as ResultView, manualReviewStatus: 'pending', idempotentReplay: true };
        }
        const [existingResult] = await this.database.db.select().from(results).where(eq(results.submissionId, existingSubmission.id)).limit(1);
        if (!existingResult) throw new DomainError('RESULT_NOT_READY', 'Submission exists without a result', 409);
        return { attempt: this.toAttemptView(attempt), result: this.toResultView(existingResult), manualReviewStatus: null, idempotentReplay: true };
      }
      if (attempt.status !== 'started') throw new DomainError('ATTEMPT_ALREADY_SUBMITTED', 'Attempt has already been submitted', 409);
      if (task.taskVersion.taskType !== 'single-choice' || task.taskVersion.evaluationRule !== 'single-choice.v1') {
        const [submission] = await this.database.db.insert(submissions).values({
          attemptId,
          workspaceId: attempt.workspaceId,
          idempotencyKey,
          answer: answer as Record<string, unknown>,
          reviewStatus: 'pending_manual_review',
        }).returning();
        if (!submission) throw new Error('Manual review submission creation failed');
        await this.database.db.update(attempts).set({ status: 'submitted', submittedAt: new Date() }).where(eq(attempts.id, attemptId));
        await this.audit.record(studentId, 'attempt_submitted_for_manual_review', 'attempt', attemptId, { submissionId: submission.id, taskVersionId: task.taskVersion.id }, context?.workspaceId);
        return { attempt: this.toAttemptView({ ...attempt, status: 'submitted', submittedAt: new Date() }), result: null as unknown as ResultView, manualReviewStatus: 'pending', idempotentReplay: false };
      }
      assertSingleChoiceContent(task.taskVersion.content);
      const evaluation = evaluateSingleChoice(task.taskVersion.content, answer);
      if (evaluation.outcome === 'invalid') throw new DomainError('INVALID_ANSWER', 'Answer must select one available option', 422);
      const [submission] = await this.database.db.insert(submissions).values({
        attemptId,
        workspaceId: attempt.workspaceId,
        idempotencyKey,
        answer: answer as Record<string, unknown>,
        reviewStatus: 'evaluated',
      }).returning();
      if (!submission) throw new Error('Submission creation failed');
      await this.database.db.update(attempts).set({ status: 'submitted', submittedAt: new Date() }).where(eq(attempts.id, attemptId));
      const learningHandoff = task.task.skillId && task.task.courseId ? 'recorded' : 'skipped_skill_unmapped';
      const [result] = await this.database.db.insert(results).values({
        attemptId,
        submissionId: submission.id,
        workspaceId: attempt.workspaceId,
        evaluationRule: task.taskVersion.evaluationRule,
        outcome: evaluation.outcome,
        isCorrect: evaluation.isCorrect,
        score: evaluation.score,
        details: { ...evaluation.details, learningHandoff },
      }).returning();
      if (!result) throw new Error('Result creation failed');
      await this.learning.recordResultFacts({
        workspaceId: attempt.workspaceId,
        integrationId: attempt.integrationId,
        learnerId: studentId,
        taskVersionId: attempt.taskVersionId,
        courseId: task.task.courseId,
        skillId: task.task.skillId,
        submissionId: submission.id,
        resultId: result.id,
        outcome: evaluation.outcome,
        evaluationRule: task.taskVersion.evaluationRule,
        occurredAt: result.evaluatedAt,
      });
      await this.audit.record(studentId, 'attempt_submitted', 'attempt', attemptId, { resultId: result.id, submissionId: submission.id, taskVersionId: task.taskVersion.id }, context?.workspaceId);
      return {
        attempt: this.toAttemptView({ ...attempt, status: 'submitted', submittedAt: new Date() }),
        result: this.toResultView(result),
        manualReviewStatus: null,
        idempotentReplay: false,
      };
    });
  }

  async getResult(studentId: string, attemptId: string, context?: TenantContext): Promise<AttemptResult> {
    const [attempt] = await this.database.db.select().from(attempts).where(and(
      eq(attempts.id, attemptId), eq(attempts.studentId, studentId), context ? eq(attempts.workspaceId, context.workspaceId) : undefined,
      context ? eq(attempts.integrationId, context.integrationId) : undefined,
    )).limit(1);
    if (!attempt) throw new NotFoundException('Result not found');
    const [submission] = await this.database.db.select().from(submissions).where(and(
      eq(submissions.attemptId, attemptId), context ? eq(submissions.workspaceId, context.workspaceId) : undefined,
    )).limit(1);
    if (submission?.reviewStatus === 'pending_manual_review') return { attempt: this.toAttemptView(attempt), result: null as unknown as ResultView, manualReviewStatus: 'pending' };
    const [result] = await this.database.db.select().from(results).where(eq(results.attemptId, attemptId)).limit(1);
    if (!result) throw new NotFoundException('Result not found');
    return { attempt: this.toAttemptView(attempt), result: this.toResultView(result), manualReviewStatus: null };
  }

  async findIntegrationResult(resultId: string, context: TenantContext): Promise<ResultView | null> {
    const [row] = await this.database.db.select({ result: results }).from(results)
      .innerJoin(attempts, and(
        eq(attempts.id, results.attemptId),
        eq(attempts.workspaceId, results.workspaceId),
      ))
      .where(and(
        eq(results.id, resultId),
        eq(results.workspaceId, context.workspaceId),
        eq(attempts.integrationId, context.integrationId),
      )).limit(1);
    return row ? this.toResultView(row.result) : null;
  }

  async listResultsForTeacher(teacherId: string, studentId: string, context?: TenantContext): Promise<AttemptResult[]> {
    await this.teaching.assertManagesStudent(teacherId, studentId, context);
    const rows = await this.database.db.select({ result: results, attempt: attempts })
      .from(results).innerJoin(attempts, eq(attempts.id, results.attemptId))
      .where(and(
        eq(attempts.studentId, studentId),
        context ? eq(attempts.workspaceId, context.workspaceId) : undefined,
        context ? eq(attempts.integrationId, context.integrationId) : undefined,
      ))
      .orderBy(desc(results.evaluatedAt));
    return rows.map((row) => ({ attempt: this.toAttemptView(row.attempt), result: this.toResultView(row.result), manualReviewStatus: null }));
  }

  async getLearnerIntelligenceSummary(
    context: TenantContext,
    learnerId: string,
    range?: { from: Date; to: Date },
  ): Promise<LearnerAttemptSummary> {
    const startedInRange = range
      ? and(gte(attempts.startedAt, range.from), lte(attempts.startedAt, range.to))!
      : sql`true`;
    const submittedInRange = range
      ? and(gte(attempts.submittedAt, range.from), lte(attempts.submittedAt, range.to))!
      : sql`true`;
    const evaluatedInRange = range
      ? and(gte(results.evaluatedAt, range.from), lte(results.evaluatedAt, range.to))!
      : sql`true`;
    const [row] = await this.database.db.select({
      started: sql<number>`count(${attempts.id}) filter (where ${startedInRange})::int`,
      submitted: sql<number>`count(*) filter (where ${attempts.status} = 'submitted' and ${submittedInRange})::int`,
      evaluated: sql<number>`count(${results.id}) filter (where ${evaluatedInRange})::int`,
      correct: sql<number>`count(*) filter (where ${results.outcome} = 'correct' and ${evaluatedInRange})::int`,
      incorrect: sql<number>`count(*) filter (where ${results.outcome} = 'incorrect' and ${evaluatedInRange})::int`,
      invalid: sql<number>`count(*) filter (where ${results.outcome} = 'invalid' and ${evaluatedInRange})::int`,
      mappedResults: sql<number>`count(*) filter (where ${results.details}->>'learningHandoff' = 'recorded' and ${evaluatedInRange})::int`,
      firstStartedAt: sql<Date | null>`min(${attempts.startedAt}) filter (where ${startedInRange})`,
      lastActivityAt: sql<Date | null>`greatest(
        max(${attempts.startedAt}) filter (where ${startedInRange}),
        max(${attempts.submittedAt}) filter (where ${submittedInRange}),
        max(${results.evaluatedAt}) filter (where ${evaluatedInRange})
      )`,
    }).from(attempts).leftJoin(results, and(
      eq(results.attemptId, attempts.id),
      eq(results.workspaceId, attempts.workspaceId),
    )).where(and(
      eq(attempts.workspaceId, context.workspaceId),
      eq(attempts.integrationId, context.integrationId),
      eq(attempts.studentId, learnerId),
    ));
    if (!row) return {
      started: 0, submitted: 0, evaluated: 0, correct: 0, incorrect: 0, invalid: 0,
      mappedResults: 0, firstStartedAt: null, lastActivityAt: null,
    };
    return {
      ...row,
      firstStartedAt: row.firstStartedAt ? new Date(String(row.firstStartedAt)) : null,
      lastActivityAt: row.lastActivityAt ? new Date(String(row.lastActivityAt)) : null,
    };
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
      learningHandoff: result.details?.learningHandoff,
    };
  }
}
