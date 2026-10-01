import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, ne } from 'drizzle-orm';
import { DomainError } from '../../common/errors';
import { DatabaseService } from '../../infrastructure/database/database';
import { results, trainerSessionItems, trainerSessions } from '../../infrastructure/database/schema';
import { AuditService } from '../audit/audit.service';
import { AttemptsService } from '../attempts/attempts.service';
import { EducationService } from '../education/education.service';
import { ExternalUsersService } from '../external-users/external-users.service';
import type { TenantContext } from '../core/core.types';
import { LearningService } from '../learning/learning.service';
import { TheoryService } from '../theory/theory.service';
import type { CreateTrainerSessionDto, SubmitTrainerAnswerDto } from './trainer.dto';
import type { TrainerSessionItemView } from './trainer.types';

@Injectable()
export class TrainerService {
  constructor(
    private readonly database: DatabaseService,
    private readonly externalUsers: ExternalUsersService,
    private readonly education: EducationService,
    private readonly attempts: AttemptsService,
    private readonly learning: LearningService,
    private readonly theory: TheoryService,
    private readonly audit: AuditService,
  ) {}

  async create(tenant: TenantContext, input: CreateTrainerSessionDto) {
    const learner = await this.externalUsers.resolveActiveLearner(tenant, input.externalLearnerId);
    const existing = await this.findIdempotent(tenant, learner.id, input.idempotencyKey);
    if (existing) return { ...(await this.sessionView(tenant, existing)), idempotentReplay: true };
    const tasks = await this.selectTasks(tenant, input);
    return this.database.transaction(async () => {
      const replay = await this.findIdempotent(tenant, learner.id, input.idempotencyKey);
      if (replay) return { ...(await this.sessionView(tenant, replay)), idempotentReplay: true };
      const [session] = await this.database.db.insert(trainerSessions).values({
        organizationId: tenant.organizationId,
        workspaceId: tenant.workspaceId,
        integrationId: tenant.integrationId,
        externalUserId: learner.id,
        learnerId: learner.learnerId,
        subjectId: input.subjectId,
        courseId: input.courseId,
        topicId: input.topicId,
        skillId: input.skillId,
        idempotencyKey: input.idempotencyKey,
      }).returning();
      if (!session) throw new Error('Trainer session creation failed');
      await this.database.db.insert(trainerSessionItems).values(tasks.map((task, index) => ({
        sessionId: session.id,
        workspaceId: tenant.workspaceId,
        position: index + 1,
        taskVersionId: task.taskVersion.id,
      })));
      await this.audit.record(null, 'trainer_session_created', 'trainer_session', session.id, {
        externalLearnerId: input.externalLearnerId,
        taskCount: tasks.length,
      }, tenant.workspaceId);
      return { ...(await this.sessionView(tenant, session)), idempotentReplay: false };
    });
  }

  async get(tenant: TenantContext, sessionId: string) {
    return { ...(await this.sessionView(tenant, await this.requireSession(tenant, sessionId))), idempotentReplay: false };
  }

  async current(tenant: TenantContext, sessionId: string) {
    const session = await this.requireSession(tenant, sessionId);
    if (session.status === 'completed') return { ...(await this.sessionView(tenant, session)), idempotentReplay: false };
    await this.ensureCurrentAttempt(tenant, session);
    return { ...(await this.sessionView(tenant, await this.requireSession(tenant, sessionId))), idempotentReplay: false };
  }

  async submit(tenant: TenantContext, sessionId: string, input: SubmitTrainerAnswerDto) {
    const session = await this.requireSession(tenant, sessionId);
    if (session.status === 'completed') throw new ConflictException('Trainer session is completed');
    const [item] = await this.database.db.select().from(trainerSessionItems).where(and(
      eq(trainerSessionItems.id, input.itemId),
      eq(trainerSessionItems.sessionId, session.id),
      eq(trainerSessionItems.workspaceId, tenant.workspaceId),
    )).limit(1);
    if (!item?.attemptId) throw new ConflictException('Trainer item has not been started');
    const submitted = await this.attempts.submit(session.learnerId, item.attemptId, input.idempotencyKey, input.answer, tenant);
    if (!submitted.result) throw new ConflictException('Trainer requires a deterministically evaluated task');
    await this.database.db.update(trainerSessionItems).set({
      status: 'submitted', resultId: submitted.result.id, updatedAt: new Date(),
    }).where(and(eq(trainerSessionItems.id, item.id), eq(trainerSessionItems.workspaceId, tenant.workspaceId)));
    const theory = submitted.result.outcome === 'incorrect'
      ? await this.relevantTheory(tenant, item.taskVersionId)
      : [];
    const teacherSignal = submitted.result.outcome === 'incorrect'
      ? await this.teacherSignal(tenant, session.learnerId, item.taskVersionId)
      : null;
    return {
      submitted,
      theory,
      teacherSignal,
      session: await this.sessionView(tenant, await this.requireSession(tenant, sessionId)),
    };
  }

  async next(tenant: TenantContext, sessionId: string) {
    const session = await this.requireSession(tenant, sessionId);
    if (session.status === 'completed') throw new ConflictException('Trainer session is completed');
    const current = await this.firstUnsubmittedItem(session.id, tenant.workspaceId);
    if (current?.status === 'started') throw new ConflictException('Submit the current trainer task before continuing');
    if (current?.status === 'pending') await this.ensureCurrentAttempt(tenant, session);
    return { ...(await this.sessionView(tenant, await this.requireSession(tenant, sessionId))), idempotentReplay: false };
  }

  async complete(tenant: TenantContext, sessionId: string) {
    const session = await this.requireSession(tenant, sessionId);
    if (session.status === 'completed') return { ...(await this.sessionView(tenant, session)), idempotentReplay: true };
    const current = await this.firstUnsubmittedItem(session.id, tenant.workspaceId);
    if (current) throw new ConflictException('All trainer tasks must be submitted before completion');
    const completedAt = new Date();
    const [completed] = await this.database.db.update(trainerSessions).set({ status: 'completed', completedAt })
      .where(and(eq(trainerSessions.id, session.id), eq(trainerSessions.status, 'active'))).returning();
    if (!completed) throw new ConflictException('Trainer session changed concurrently');
    await this.audit.record(null, 'trainer_session_completed', 'trainer_session', completed.id, {}, tenant.workspaceId);
    return { ...(await this.sessionView(tenant, completed)), idempotentReplay: false };
  }

  private async ensureCurrentAttempt(tenant: TenantContext, session: typeof trainerSessions.$inferSelect) {
    return this.database.transaction(async () => {
      const [item] = await this.database.db.select().from(trainerSessionItems).where(and(
        eq(trainerSessionItems.sessionId, session.id),
        eq(trainerSessionItems.workspaceId, tenant.workspaceId),
        ne(trainerSessionItems.status, 'submitted'),
      )).orderBy(asc(trainerSessionItems.position)).for('update', { of: trainerSessionItems }).limit(1);
      if (!item || item.attemptId) return;
      const started = await this.attempts.startTrainer(session.learnerId, item.taskVersionId, tenant.workspaceId);
      await this.database.db.update(trainerSessionItems).set({ attemptId: started.attempt.id, status: 'started', updatedAt: new Date() })
        .where(and(eq(trainerSessionItems.id, item.id), eq(trainerSessionItems.status, 'pending')));
    });
  }

  private async selectTasks(tenant: TenantContext, input: CreateTrainerSessionDto) {
    const published = await this.education.listPublishedTaskVersions(tenant);
    const latestByTask = new Map<string, typeof published[number]>();
    for (const task of published) {
      if (task.taskVersion.taskType !== 'single-choice' || task.taskVersion.evaluationRule !== 'single-choice.v1') continue;
      const previous = latestByTask.get(task.task.id);
      if (!previous || task.taskVersion.version > previous.taskVersion.version) latestByTask.set(task.task.id, task);
    }
    const explicit = input.taskIds ? new Set(input.taskIds) : null;
    const selected = [...latestByTask.values()].filter((task) =>
      (!explicit || explicit.has(task.task.id)) &&
      (!input.subjectId || task.task.subjectId === input.subjectId) &&
      (!input.courseId || task.task.courseId === input.courseId) &&
      (!input.topicId || task.task.topicId === input.topicId) &&
      (!input.skillId || task.task.skillId === input.skillId),
    ).sort((left, right) => left.task.id.localeCompare(right.task.id));
    if (!selected.length || (explicit && selected.length !== explicit.size)) {
      throw new DomainError('TRAINER_NO_MATCHING_TASKS', 'No published, automatically evaluated tasks match the trainer session', 422);
    }
    return selected;
  }

  private async relevantTheory(tenant: TenantContext, taskVersionId: string) {
    const task = await this.education.getPublishedTaskVersion(taskVersionId, tenant);
    return this.theory.listPublishedContext({ tenant }, {
      subjectId: task.task.subjectId ?? undefined,
      courseId: task.task.courseId ?? undefined,
      topicId: task.task.topicId ?? undefined,
      skillId: task.task.skillId ?? undefined,
      limit: 10,
    });
  }

  private async teacherSignal(tenant: TenantContext, learnerId: string, taskVersionId: string) {
    const task = await this.education.getPublishedTaskVersion(taskVersionId, tenant);
    if (!task.task.skillId) return null;
    const state = await this.learning.getLearningState(learnerId, task.task.skillId, tenant);
    return state.status === 'needs_practice'
      ? { type: 'needs_practice', skillId: task.task.skillId, evidenceCount: state.evidenceCount, recentOutcomes: state.recentOutcomes }
      : null;
  }

  private async requireSession(tenant: TenantContext, sessionId: string) {
    const [session] = await this.database.db.select().from(trainerSessions).where(and(
      eq(trainerSessions.id, sessionId),
      eq(trainerSessions.organizationId, tenant.organizationId),
      eq(trainerSessions.workspaceId, tenant.workspaceId),
      eq(trainerSessions.integrationId, tenant.integrationId),
    )).limit(1);
    if (!session) throw new NotFoundException('Trainer session not found');
    return session;
  }

  private async findIdempotent(tenant: TenantContext, externalUserId: string, idempotencyKey: string) {
    const [session] = await this.database.db.select().from(trainerSessions).where(and(
      eq(trainerSessions.workspaceId, tenant.workspaceId),
      eq(trainerSessions.integrationId, tenant.integrationId),
      eq(trainerSessions.externalUserId, externalUserId),
      eq(trainerSessions.idempotencyKey, idempotencyKey),
    )).limit(1);
    return session;
  }

  private async firstUnsubmittedItem(sessionId: string, workspaceId: string) {
    return (await this.database.db.select().from(trainerSessionItems).where(and(
      eq(trainerSessionItems.sessionId, sessionId),
      eq(trainerSessionItems.workspaceId, workspaceId),
      ne(trainerSessionItems.status, 'submitted'),
    )).orderBy(asc(trainerSessionItems.position)).limit(1))[0];
  }

  private async sessionView(tenant: TenantContext, session: typeof trainerSessions.$inferSelect) {
    const items = await this.database.db.select().from(trainerSessionItems).where(and(
      eq(trainerSessionItems.sessionId, session.id), eq(trainerSessionItems.workspaceId, tenant.workspaceId),
    )).orderBy(asc(trainerSessionItems.position));
    const current = items.find((item) => item.status !== 'submitted') ?? null;
    const latestSubmitted = [...items].reverse().find((item) => item.status === 'submitted') ?? null;
    const latestResult = latestSubmitted ? (await this.itemView(tenant, latestSubmitted)).result : null;
    return {
      id: session.id,
      status: session.status,
      filters: { subjectId: session.subjectId, courseId: session.courseId, topicId: session.topicId, skillId: session.skillId },
      progress: { completed: items.filter((item) => item.status === 'submitted').length, total: items.length },
      current: current ? await this.itemView(tenant, current) : null,
      latestResult,
      canComplete: !current,
    };
  }

  private async itemView(tenant: TenantContext, item: typeof trainerSessionItems.$inferSelect): Promise<TrainerSessionItemView> {
    const task = await this.education.getPublishedTaskVersion(item.taskVersionId, tenant);
    const [result] = item.resultId
      ? await this.database.db.select().from(results).where(and(eq(results.id, item.resultId), eq(results.workspaceId, tenant.workspaceId))).limit(1)
      : [undefined];
    return {
      id: item.id,
      position: item.position,
      status: item.status as TrainerSessionItemView['status'],
      task: this.education.toPublicTaskVersion(task.taskVersion),
      attemptId: item.attemptId,
      result: result ? {
        id: result.id, attemptId: result.attemptId, submissionId: result.submissionId, evaluationRule: result.evaluationRule,
        outcome: result.outcome, isCorrect: result.isCorrect, score: result.score, evaluatedAt: result.evaluatedAt,
        learningHandoff: result.details?.learningHandoff,
      } : null,
    };
  }
}
