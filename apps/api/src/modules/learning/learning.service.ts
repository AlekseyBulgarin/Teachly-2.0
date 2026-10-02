import { Injectable } from '@nestjs/common';
import { and, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { DatabaseService } from '../../infrastructure/database/database';
import { learningEvents, skillEvidence } from '../../infrastructure/database/schema';
import type { TenantContext } from '../core/core.types';
import { TeachingService } from '../teaching/teaching.service';
import { deriveLearningState, deriveSkillEvidence } from './learning.rules';
import type {
  LearnerActivityPage,
  LearnerDailyActivity,
  LearnerEvidenceFact,
  LearnerEvidenceSummary,
  LearnerSkillEvidenceTotal,
  LearnerSourceEvidenceCount,
} from './learning.read-model';
import type {
  LearningEventInput,
  LearningEventView,
  LearningState,
  ExternalResultFactsInput,
  LearningHandoffResult,
  ResultFactsInput,
  SkillEvidenceView,
} from './learning.types';

@Injectable()
export class LearningService {
  constructor(
    private readonly database: DatabaseService,
    private readonly teaching: TeachingService,
  ) {}

  async ingest(input: LearningEventInput): Promise<LearningEventView> {
    const [inserted] = await this.database.db.insert(learningEvents).values({
      workspaceId: input.workspaceId,
      integrationId: input.integrationId,
      eventType: input.eventType,
      learnerId: input.learnerId,
      source: input.source,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      taskVersionId: input.taskVersionId,
      courseId: input.courseId,
      skillId: input.skillId,
      outcome: input.outcome,
      evaluationRule: input.evaluationRule,
      correlationId: input.correlationId,
      occurredAt: input.occurredAt,
    }).onConflictDoNothing({
      target: [learningEvents.workspaceId, learningEvents.eventType, learningEvents.sourceType, learningEvents.sourceId],
    }).returning();
    if (inserted) return this.toEventView(inserted);
    const [existing] = await this.database.db.select().from(learningEvents).where(and(
      eq(learningEvents.workspaceId, input.workspaceId),
      eq(learningEvents.eventType, input.eventType),
      eq(learningEvents.sourceType, input.sourceType),
      eq(learningEvents.sourceId, input.sourceId),
    )).limit(1);
    if (!existing) throw new Error('Learning event ingestion failed');
    return this.toEventView(existing);
  }

  async deriveEvidenceFor(event: LearningEventView): Promise<SkillEvidenceView | null> {
    const facts = deriveSkillEvidence(event);
    if (!facts) return null;
    const [inserted] = await this.database.db.insert(skillEvidence).values({
      workspaceId: event.workspaceId,
      ...facts,
    }).onConflictDoNothing({
      target: [skillEvidence.workspaceId, skillEvidence.learningEventId, skillEvidence.rule],
    }).returning();
    if (inserted) return this.toEvidenceView(inserted);
    const [existing] = await this.database.db.select().from(skillEvidence).where(and(
      eq(skillEvidence.workspaceId, event.workspaceId),
      eq(skillEvidence.learningEventId, event.id),
      eq(skillEvidence.rule, facts.rule),
    )).limit(1);
    if (!existing) throw new Error('Skill evidence derivation failed');
    return this.toEvidenceView(existing);
  }

  async recordResultFacts(input: ResultFactsInput & { courseId: string; skillId: string }): Promise<Extract<LearningHandoffResult, { status: 'recorded' }> & { attemptEvent: LearningEventView; resultEvent: LearningEventView }>;
  async recordResultFacts(input: ResultFactsInput): Promise<LearningHandoffResult>;
  async recordResultFacts(input: ResultFactsInput): Promise<LearningHandoffResult> {
    if (!input.courseId || !input.skillId) {
      return {
        status: 'skipped',
        reason: 'skill_unmapped',
        attemptEvent: null as unknown as LearningEventView,
        resultEvent: null as unknown as LearningEventView,
        evidence: null,
      };
    }
    const shared = {
      workspaceId: input.workspaceId,
      integrationId: input.integrationId,
      learnerId: input.learnerId,
      taskVersionId: input.taskVersionId,
      courseId: input.courseId,
      skillId: input.skillId,
      correlationId: input.correlationId,
      occurredAt: input.occurredAt,
    };
    const attemptEvent = await this.ingest({
      ...shared,
      eventType: 'attempt_submitted',
      source: 'teachly_authoritative',
      sourceType: 'submission',
      sourceId: input.submissionId,
    });
    const resultEvent = await this.ingest({
      ...shared,
      eventType: 'result_recorded',
      source: 'teachly_authoritative',
      sourceType: 'result',
      sourceId: input.resultId,
      outcome: input.outcome,
      evaluationRule: input.evaluationRule,
    });
    return { status: 'recorded', attemptEvent, resultEvent, evidence: await this.deriveEvidenceFor(resultEvent) };
  }

  async recordExternalResultFacts(input: ExternalResultFactsInput): Promise<LearningHandoffResult> {
    const resultEvent = await this.ingest({
      workspaceId: input.workspaceId,
      integrationId: input.integrationId,
      learnerId: input.learnerId,
      taskVersionId: input.taskVersionId,
      courseId: input.courseId,
      skillId: input.skillId,
      eventType: 'result_recorded',
      source: 'integration',
      sourceType: 'external_result_observation',
      sourceId: input.observationId,
      outcome: input.outcome,
      evaluationRule: 'external-observation.v1',
      occurredAt: input.occurredAt,
    });
    return { status: 'recorded', attemptEvent: null as unknown as LearningEventView, resultEvent, evidence: await this.deriveEvidenceFor(resultEvent) };
  }

  async listRecentEvidenceBySkill(context: TenantContext, learnerId: string, asOf: Date): Promise<LearnerEvidenceFact[]> {
    const query = await this.database.db.execute(sql`
      WITH ranked AS (
        SELECT se.id, le.source_type, le.source_id, se.skill_id, se.course_id, se.outcome, se.occurred_at,
          row_number() OVER (PARTITION BY se.skill_id ORDER BY se.occurred_at DESC, se.id DESC) AS position
        FROM skill_evidence se
        INNER JOIN learning_events le ON le.id = se.learning_event_id AND le.workspace_id = se.workspace_id
        WHERE se.workspace_id = ${context.workspaceId}
          AND se.learner_id = ${learnerId}
          AND le.integration_id = ${context.integrationId}
          AND se.occurred_at <= ${asOf}
      )
      SELECT id, source_type, source_id, skill_id, course_id, outcome, occurred_at
      FROM ranked WHERE position <= 6
      ORDER BY skill_id, occurred_at DESC, id DESC
    `);
    return (query.rows as Array<Record<string, unknown>>).map((row) => this.toLearnerEvidenceFact(row));
  }

  async listSkillEvidenceTotals(
    context: TenantContext,
    learnerId: string,
    from: Date,
    to: Date,
  ): Promise<LearnerSkillEvidenceTotal[]> {
    const query = await this.database.db.execute(sql`
      SELECT se.skill_id,
        count(*)::int AS evidence_count,
        count(*) FILTER (WHERE se.outcome = 'correct')::int AS correct,
        count(*) FILTER (WHERE se.outcome = 'incorrect')::int AS incorrect,
        count(*) FILTER (WHERE se.outcome = 'invalid')::int AS invalid,
        min(se.occurred_at) AS first_observed_at,
        max(se.occurred_at) AS last_observed_at
      FROM skill_evidence se
      INNER JOIN learning_events le ON le.id = se.learning_event_id AND le.workspace_id = se.workspace_id
      WHERE se.workspace_id = ${context.workspaceId}
        AND se.learner_id = ${learnerId}
        AND le.integration_id = ${context.integrationId}
        AND se.occurred_at >= ${from}
        AND se.occurred_at <= ${to}
      GROUP BY se.skill_id
      ORDER BY max(se.occurred_at) DESC, se.skill_id
    `);
    return (query.rows as Array<Record<string, unknown>>).map((row) => ({
      skillId: String(row.skill_id),
      evidenceCount: Number(row.evidence_count),
      correct: Number(row.correct),
      incorrect: Number(row.incorrect),
      invalid: Number(row.invalid),
      firstObservedAt: new Date(String(row.first_observed_at)),
      lastObservedAt: new Date(String(row.last_observed_at)),
    }));
  }

  async getLearnerEvidenceSummary(
    context: TenantContext,
    learnerId: string,
    from?: Date,
    to?: Date,
  ): Promise<LearnerEvidenceSummary> {
    const fromClause = from ? sql`AND se.occurred_at >= ${from}` : sql``;
    const toClause = to ? sql`AND se.occurred_at <= ${to}` : sql``;
    const query = await this.database.db.execute(sql`
      SELECT count(*)::int AS evidence_count,
        count(*) FILTER (WHERE se.outcome = 'correct')::int AS correct,
        count(*) FILTER (WHERE se.outcome = 'incorrect')::int AS incorrect,
        count(*) FILTER (WHERE se.outcome = 'invalid')::int AS invalid,
        min(se.occurred_at) AS first_observed_at,
        max(se.occurred_at) AS last_observed_at,
        count(DISTINCT (se.occurred_at AT TIME ZONE 'UTC')::date)::int AS active_days
      FROM skill_evidence se
      INNER JOIN learning_events le ON le.id = se.learning_event_id AND le.workspace_id = se.workspace_id
      WHERE se.workspace_id = ${context.workspaceId}
        AND se.learner_id = ${learnerId}
        AND le.integration_id = ${context.integrationId}
        ${fromClause}
        ${toClause}
    `);
    const row = query.rows[0] as Record<string, unknown> | undefined;
    return {
      evidenceCount: Number(row?.evidence_count ?? 0),
      correct: Number(row?.correct ?? 0),
      incorrect: Number(row?.incorrect ?? 0),
      invalid: Number(row?.invalid ?? 0),
      firstObservedAt: row?.first_observed_at ? new Date(String(row.first_observed_at)) : null,
      lastObservedAt: row?.last_observed_at ? new Date(String(row.last_observed_at)) : null,
      activeDays: Number(row?.active_days ?? 0),
    };
  }

  async listDailyActivity(context: TenantContext, learnerId: string, from: Date, to: Date): Promise<LearnerDailyActivity[]> {
    const query = await this.database.db.execute(sql`
      SELECT to_char((se.occurred_at AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD') AS date,
        count(*)::int AS evidence_count
      FROM skill_evidence se
      INNER JOIN learning_events le ON le.id = se.learning_event_id AND le.workspace_id = se.workspace_id
      WHERE se.workspace_id = ${context.workspaceId}
        AND se.learner_id = ${learnerId}
        AND le.integration_id = ${context.integrationId}
        AND se.occurred_at >= ${from}
        AND se.occurred_at <= ${to}
      GROUP BY (se.occurred_at AT TIME ZONE 'UTC')::date
      ORDER BY (se.occurred_at AT TIME ZONE 'UTC')::date
    `);
    return (query.rows as Array<Record<string, unknown>>).map((row) => ({
      date: String(row.date), evidenceCount: Number(row.evidence_count),
    }));
  }

  async listLearnerActivity(context: TenantContext, learnerId: string, input: {
    from?: Date; to?: Date; beforeAt?: Date; beforeId?: string; limit: number;
  }): Promise<LearnerActivityPage> {
    const fromClause = input.from ? sql`AND se.occurred_at >= ${input.from}` : sql``;
    const toClause = input.to ? sql`AND se.occurred_at <= ${input.to}` : sql``;
    const cursor = input.beforeAt && input.beforeId
      ? sql`AND (se.occurred_at, se.id) < (${input.beforeAt}, ${input.beforeId}::uuid)`
      : sql``;
    const query = await this.database.db.execute(sql`
      SELECT se.id, le.source_type, le.source_id, se.skill_id, se.course_id, se.outcome, se.occurred_at
      FROM skill_evidence se
      INNER JOIN learning_events le ON le.id = se.learning_event_id AND le.workspace_id = se.workspace_id
      WHERE se.workspace_id = ${context.workspaceId}
        AND se.learner_id = ${learnerId}
        AND le.integration_id = ${context.integrationId}
        ${fromClause}
        ${toClause}
        ${cursor}
      ORDER BY se.occurred_at DESC, se.id DESC
      LIMIT ${input.limit + 1}
    `);
    const rows = (query.rows as Array<Record<string, unknown>>).map((row) => this.toLearnerEvidenceFact(row));
    return { items: rows.slice(0, input.limit), hasMore: rows.length > input.limit };
  }

  async countEvidenceForSources(
    context: TenantContext,
    learnerId: string,
    sourceIds: string[],
    range?: { from: Date; to: Date },
  ): Promise<LearnerSourceEvidenceCount[]> {
    if (!sourceIds.length) return [];
    const rows = await this.database.db.select({
      skillId: skillEvidence.skillId,
      evidenceCount: sql<number>`count(*)::int`,
    }).from(skillEvidence).innerJoin(learningEvents, and(
      eq(learningEvents.id, skillEvidence.learningEventId),
      eq(learningEvents.workspaceId, skillEvidence.workspaceId),
    )).where(and(
      eq(skillEvidence.workspaceId, context.workspaceId),
      eq(skillEvidence.learnerId, learnerId),
      eq(learningEvents.integrationId, context.integrationId),
      eq(learningEvents.sourceType, 'result'),
      inArray(learningEvents.sourceId, sourceIds),
      range ? gte(skillEvidence.occurredAt, range.from) : undefined,
      range ? lte(skillEvidence.occurredAt, range.to) : undefined,
    )).groupBy(skillEvidence.skillId);
    return rows;
  }

  async getLearningState(learnerId: string, skillId: string, context?: TenantContext): Promise<LearningState> {
    const rows = context
      ? (await this.database.db.select({ evidence: skillEvidence }).from(skillEvidence)
        .innerJoin(learningEvents, and(
          eq(learningEvents.id, skillEvidence.learningEventId),
          eq(learningEvents.workspaceId, skillEvidence.workspaceId),
        )).where(and(
          eq(skillEvidence.learnerId, learnerId),
          eq(skillEvidence.skillId, skillId),
          eq(skillEvidence.workspaceId, context.workspaceId),
          eq(learningEvents.integrationId, context.integrationId),
        )).orderBy(desc(skillEvidence.occurredAt), desc(skillEvidence.id))).map((row) => row.evidence)
      : await this.database.db.select().from(skillEvidence).where(and(
        eq(skillEvidence.learnerId, learnerId),
        eq(skillEvidence.skillId, skillId),
      )).orderBy(desc(skillEvidence.occurredAt), desc(skillEvidence.id));
    return deriveLearningState({
      learnerId,
      workspaceId: context?.workspaceId ?? rows[0]?.workspaceId ?? null,
      skillId,
      evidence: rows.map((row) => ({
        id: row.id,
        courseId: row.courseId,
        outcome: row.outcome,
        occurredAt: row.occurredAt,
      })),
    });
  }

  async getLearningStateForTeacher(
    teacherId: string,
    learnerId: string,
    skillId: string,
    context?: TenantContext,
  ): Promise<LearningState> {
    await this.teaching.assertManagesStudent(teacherId, learnerId, context);
    return this.getLearningState(learnerId, skillId, context);
  }

  private toEventView(event: typeof learningEvents.$inferSelect): LearningEventView {
    return {
      id: event.id,
      workspaceId: event.workspaceId,
      integrationId: event.integrationId,
      eventType: event.eventType,
      learnerId: event.learnerId,
      source: event.source as LearningEventView['source'],
      sourceType: event.sourceType,
      sourceId: event.sourceId,
      taskVersionId: event.taskVersionId,
      courseId: event.courseId,
      skillId: event.skillId,
      outcome: event.outcome,
      evaluationRule: event.evaluationRule,
      correlationId: event.correlationId,
      occurredAt: event.occurredAt,
    };
  }

  private toLearnerEvidenceFact(row: Record<string, unknown>): LearnerEvidenceFact {
    return {
      id: String(row.id),
      sourceType: String(row.source_type),
      sourceId: String(row.source_id),
      skillId: String(row.skill_id),
      courseId: String(row.course_id),
      outcome: row.outcome as LearnerEvidenceFact['outcome'],
      occurredAt: new Date(String(row.occurred_at)),
    };
  }

  private toEvidenceView(evidence: typeof skillEvidence.$inferSelect): SkillEvidenceView {
    return {
      id: evidence.id,
      workspaceId: evidence.workspaceId,
      learnerId: evidence.learnerId,
      courseId: evidence.courseId,
      skillId: evidence.skillId,
      learningEventId: evidence.learningEventId,
      rule: evidence.rule,
      outcome: evidence.outcome,
      occurredAt: evidence.occurredAt,
    };
  }
}
