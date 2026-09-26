import { Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { DatabaseService } from '../../infrastructure/database/database';
import { learningEvents, skillEvidence } from '../../infrastructure/database/schema';
import type { TenantContext } from '../integrations/integrations.types';
import { TeachingService } from '../teaching/teaching.service';
import { deriveLearningState, deriveSkillEvidence } from './learning.rules';
import type {
  LearningEventInput,
  LearningEventView,
  LearningState,
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

  async recordResultFacts(input: ResultFactsInput): Promise<{
    attemptEvent: LearningEventView;
    resultEvent: LearningEventView;
    evidence: SkillEvidenceView | null;
  }> {
    const shared = {
      workspaceId: input.workspaceId,
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
    return { attemptEvent, resultEvent, evidence: await this.deriveEvidenceFor(resultEvent) };
  }

  async getLearningState(learnerId: string, skillId: string, context?: TenantContext): Promise<LearningState> {
    const rows = await this.database.db.select().from(skillEvidence).where(and(
      eq(skillEvidence.learnerId, learnerId),
      eq(skillEvidence.skillId, skillId),
      context ? eq(skillEvidence.workspaceId, context.workspaceId) : undefined,
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
