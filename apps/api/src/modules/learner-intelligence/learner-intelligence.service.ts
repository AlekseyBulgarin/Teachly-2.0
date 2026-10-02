import { Injectable } from '@nestjs/common';
import { DomainError } from '../../common/errors';
import { AttemptsService } from '../attempts/attempts.service';
import { AuditService } from '../audit/audit.service';
import type { TenantContext } from '../core/core.types';
import { EducationService } from '../education/education.service';
import type { CurriculumDescriptor } from '../education/education.types';
import { ExternalUsersService } from '../external-users/external-users.service';
import type { LearnerEvidenceFact, LearnerSkillEvidenceTotal } from '../learning/learning.read-model';
import { deriveLearningState, deriveLearningTrend } from '../learning/learning.rules';
import { LearningService } from '../learning/learning.service';
import type { LearningStateStatus } from '../learning/learning.types';
import { TrainerService } from '../trainer/trainer.service';
import type {
  LearnerActivityQueryDto,
  LearnerProfileQueryDto,
  LearnerProgressQueryDto,
  LearnerSkillsQueryDto,
} from './learner-intelligence.dto';
import type { LearnerSkillView, OutcomeSummary, PublicActivityItem } from './learner-intelligence.types';

const DAY_MS = 86_400_000;
const MAX_RANGE_MS = 366 * DAY_MS;
const EPOCH = new Date(0);

@Injectable()
export class LearnerIntelligenceService {
  constructor(
    private readonly externalUsers: ExternalUsersService,
    private readonly attempts: AttemptsService,
    private readonly learning: LearningService,
    private readonly trainer: TrainerService,
    private readonly education: EducationService,
    private readonly audit: AuditService,
  ) {}

  async profile(tenant: TenantContext, query: LearnerProfileQueryDto) {
    const learner = await this.resolveLearner(tenant, query.externalUserId);
    const asOf = new Date();
    const [attempts, evidence, latest, allTotals, trainer, recentPage] = await Promise.all([
      this.attempts.getLearnerIntelligenceSummary(tenant, learner.learnerId),
      this.learning.getLearnerEvidenceSummary(tenant, learner.learnerId),
      this.learning.listRecentEvidenceBySkill(tenant, learner.learnerId, asOf),
      this.learning.listSkillEvidenceTotals(tenant, learner.learnerId, EPOCH, asOf),
      this.trainer.getLearnerIntelligenceSummary(tenant, learner.id),
      this.learning.listLearnerActivity(tenant, learner.learnerId, { limit: query.recentLimit }),
    ]);
    const descriptors = await this.education.describeSkills(tenant.workspaceId, allTotals.map((row) => row.skillId));
    const trainerCounts = await this.learning.countEvidenceForSources(tenant, learner.learnerId, trainer.resultIds);
    const skills = this.buildSkills(learner.learnerId, latest, allTotals, descriptors, trainerCounts, asOf);
    const trainerResults = new Set(trainer.resultIds);
    const response = {
      learner: { externalUserId: learner.externalUserId, status: learner.status },
      asOf,
      activity: {
        ...this.outcomes(evidence),
        firstObservedAt: evidence.firstObservedAt,
        lastObservedAt: evidence.lastObservedAt,
        activeDays: evidence.activeDays,
      },
      attempts: { ...attempts, outcomeRate: this.rate(attempts.correct, attempts.incorrect) },
      mappingCoverage: { evaluatedResults: attempts.evaluated, withSkillEvidence: attempts.mappedResults },
      skills: this.stateCounts(skills),
      strengths: skills.filter((item) => item.state.status === 'showing_progress'),
      needsPractice: skills.filter((item) => item.state.status === 'needs_practice'),
      trainer: {
        sessionsStarted: trainer.sessionsStarted,
        sessionsCompleted: trainer.sessionsCompleted,
        itemsSubmitted: trainer.itemsSubmitted,
        lastActivityAt: trainer.lastActivityAt,
      },
      recentActivity: recentPage.items.flatMap((item) => {
        const descriptor = descriptors.get(item.skillId);
        return descriptor ? [this.publicActivity(item, descriptor, trainerResults)] : [];
      }),
    };
    await this.recordRead(tenant, learner.id, 'profile');
    return response;
  }

  async progress(tenant: TenantContext, query: LearnerProgressQueryDto) {
    const learner = await this.resolveLearner(tenant, query.externalUserId);
    const range = this.range(query.from, query.to);
    const [attempts, evidence, latest, allTotals, windowTotals, daily, trainer] = await Promise.all([
      this.attempts.getLearnerIntelligenceSummary(tenant, learner.learnerId, range),
      this.learning.getLearnerEvidenceSummary(tenant, learner.learnerId, range.from, range.to),
      this.learning.listRecentEvidenceBySkill(tenant, learner.learnerId, range.to),
      this.learning.listSkillEvidenceTotals(tenant, learner.learnerId, EPOCH, range.to),
      this.learning.listSkillEvidenceTotals(tenant, learner.learnerId, range.from, range.to),
      this.learning.listDailyActivity(tenant, learner.learnerId, range.from, range.to),
      this.trainer.getLearnerIntelligenceSummary(tenant, learner.id),
    ]);
    const descriptors = await this.education.describeSkills(tenant.workspaceId, allTotals.map((row) => row.skillId));
    const trainerCounts = await this.learning.countEvidenceForSources(
      tenant, learner.learnerId, trainer.resultIds, range,
    );
    const skills = this.buildSkills(learner.learnerId, latest, windowTotals, descriptors, trainerCounts, range.to, allTotals);
    const response = {
      learner: { externalUserId: learner.externalUserId, status: learner.status },
      asOf: range.to,
      window: range,
      summary: this.outcomes(evidence),
      mappingCoverage: { evaluatedResults: attempts.evaluated, withSkillEvidence: attempts.mappedResults },
      skillStates: this.stateCounts(skills),
      activityByDay: daily,
      groupBy: query.groupBy,
      dimensions: this.groupDimensions(query.groupBy, skills),
      recentOutcomeTrend: skills.map((skill) => ({ curriculum: skill.curriculum, trend: skill.trend })),
    };
    await this.recordRead(tenant, learner.id, 'progress');
    return response;
  }

  async skills(tenant: TenantContext, query: LearnerSkillsQueryDto) {
    const learner = await this.resolveLearner(tenant, query.externalUserId);
    const asOf = new Date();
    const [latest, totals, trainer] = await Promise.all([
      this.learning.listRecentEvidenceBySkill(tenant, learner.learnerId, asOf),
      this.learning.listSkillEvidenceTotals(tenant, learner.learnerId, EPOCH, asOf),
      this.trainer.getLearnerIntelligenceSummary(tenant, learner.id),
    ]);
    const [descriptors, trainerCounts] = await Promise.all([
      this.education.describeSkills(tenant.workspaceId, totals.map((row) => row.skillId)),
      this.learning.countEvidenceForSources(tenant, learner.learnerId, trainer.resultIds),
    ]);
    let items = this.buildSkills(learner.learnerId, latest, totals, descriptors, trainerCounts, asOf)
      .filter((item) => !query.status || item.state.status === query.status)
      .sort((left, right) => {
        const delta = (right.state.lastObservedAt?.getTime() ?? 0) - (left.state.lastObservedAt?.getTime() ?? 0);
        return delta || right.curriculum.skill.id.localeCompare(left.curriculum.skill.id);
      });
    const cursor = query.cursor ? this.decodeCursor(query.cursor) : null;
    if (cursor) items = items.filter((item) => this.afterSkillCursor(item, cursor));
    const page = items.slice(0, query.limit);
    const last = page.at(-1);
    await this.recordRead(tenant, learner.id, 'skills');
    return {
      learner: { externalUserId: learner.externalUserId, status: learner.status },
      asOf,
      items: page,
      nextCursor: items.length > query.limit && last
        ? this.encodeCursor(last.state.lastObservedAt!, last.curriculum.skill.id)
        : null,
    };
  }

  async activity(tenant: TenantContext, query: LearnerActivityQueryDto) {
    const learner = await this.resolveLearner(tenant, query.externalUserId);
    const range = query.from || query.to ? this.range(query.from, query.to) : null;
    const cursor = query.cursor ? this.decodeCursor(query.cursor) : null;
    const [page, trainer] = await Promise.all([
      this.learning.listLearnerActivity(tenant, learner.learnerId, {
        from: range?.from,
        to: range?.to,
        beforeAt: cursor?.at,
        beforeId: cursor?.id,
        limit: query.limit,
      }),
      this.trainer.getLearnerIntelligenceSummary(tenant, learner.id),
    ]);
    const descriptors = await this.education.describeSkills(tenant.workspaceId, page.items.map((item) => item.skillId));
    const trainerResults = new Set(trainer.resultIds);
    const items = page.items.flatMap((item) => {
      const descriptor = descriptors.get(item.skillId);
      return descriptor ? [this.publicActivity(item, descriptor, trainerResults)] : [];
    });
    const last = page.items.at(-1);
    await this.recordRead(tenant, learner.id, 'activity');
    return {
      learner: { externalUserId: learner.externalUserId, status: learner.status },
      items,
      nextCursor: page.hasMore && last ? this.encodeCursor(last.occurredAt, last.id) : null,
    };
  }

  private async resolveLearner(tenant: TenantContext, externalUserId: string) {
    try {
      return await this.externalUsers.resolveActiveLearner(tenant, externalUserId);
    } catch (error) {
      if (error instanceof DomainError && error.statusCode === 404) {
        throw new DomainError('LEARNER_NOT_FOUND', 'Learner not found', 404);
      }
      throw error;
    }
  }

  private buildSkills(
    learnerId: string,
    latest: LearnerEvidenceFact[],
    totals: LearnerSkillEvidenceTotal[],
    descriptors: Map<string, CurriculumDescriptor>,
    trainerCounts: Array<{ skillId: string; evidenceCount: number }>,
    asOf: Date,
    stateTotals = totals,
  ): LearnerSkillView[] {
    const latestBySkill = this.groupBy(latest, (row) => row.skillId);
    const totalsBySkill = new Map(totals.map((row) => [row.skillId, row]));
    const stateTotalsBySkill = new Map(stateTotals.map((row) => [row.skillId, row]));
    const trainerBySkill = new Map(trainerCounts.map((row) => [row.skillId, row.evidenceCount]));
    return stateTotals.flatMap((total) => {
      const descriptor = descriptors.get(total.skillId);
      if (!descriptor) return [];
      const recent = latestBySkill.get(total.skillId) ?? [];
      const state = deriveLearningState({
        learnerId,
        workspaceId: null,
        skillId: total.skillId,
        evidence: recent.map((row) => ({ id: row.id, courseId: row.courseId, outcome: row.outcome, occurredAt: row.occurredAt })),
      });
      const window = totalsBySkill.get(total.skillId);
      return [{
        curriculum: descriptor,
        state: {
          rule: 'learning_state.v1' as const,
          status: state.status,
          evidenceCount: stateTotalsBySkill.get(total.skillId)?.evidenceCount ?? 0,
          recentOutcomes: state.recentOutcomes,
          lastObservedAt: state.lastObservedAt,
          asOf,
        },
        trend: deriveLearningTrend(recent.map((row) => ({
          id: row.id, courseId: row.courseId, outcome: row.outcome, occurredAt: row.occurredAt,
        }))),
        window: window ? this.outcomes(window) : this.outcomes({ evidenceCount: 0, correct: 0, incorrect: 0, invalid: 0 }),
        taskEvidenceCount: window?.evidenceCount ?? 0,
        trainerEvidenceCount: trainerBySkill.get(total.skillId) ?? 0,
      }];
    });
  }

  private groupDimensions(groupBy: 'skill' | 'topic' | 'course' | 'subject', skills: LearnerSkillView[]) {
    if (groupBy === 'skill') return skills;
    const groups = new Map<string, { reference: object; skills: LearnerSkillView[] }>();
    for (const skill of skills) {
      const reference = skill.curriculum[groupBy];
      const key = groupBy === 'subject'
        ? skill.curriculum.subject.code
        : groupBy === 'course'
          ? skill.curriculum.course.id
          : skill.curriculum.topic.id;
      const current = groups.get(key) ?? { reference, skills: [] };
      current.skills.push(skill);
      groups.set(key, current);
    }
    return [...groups.values()].map(({ reference, skills: grouped }) => {
      const aggregate = grouped.reduce((value, item) => ({
        evidenceCount: value.evidenceCount + item.window.evidenceCount,
        correct: value.correct + item.window.correct,
        incorrect: value.incorrect + item.window.incorrect,
        invalid: value.invalid + item.window.invalid,
      }), { evidenceCount: 0, correct: 0, incorrect: 0, invalid: 0 });
      return {
        reference,
        ...this.outcomes(aggregate),
        observedSkillCount: grouped.length,
        skillStates: this.stateCounts(grouped),
      };
    });
  }

  private publicActivity(
    item: LearnerEvidenceFact,
    curriculum: CurriculumDescriptor,
    trainerResults: Set<string>,
  ): PublicActivityItem {
    return {
      occurredAt: item.occurredAt,
      origin: item.sourceType === 'external_result_observation'
        ? 'external_observation'
        : trainerResults.has(item.sourceId) ? 'trainer' : 'assessment',
      outcome: item.outcome,
      curriculum,
    };
  }

  private stateCounts(skills: LearnerSkillView[]) {
    const counts: Record<LearningStateStatus, number> = {
      insufficient_evidence: 0, needs_practice: 0, showing_progress: 0,
    };
    for (const skill of skills) counts[skill.state.status] += 1;
    return { observed: skills.length, byStatus: counts };
  }

  private outcomes(input: { evidenceCount: number; correct: number; incorrect: number; invalid: number }): OutcomeSummary {
    return {
      evidenceCount: input.evidenceCount,
      correct: input.correct,
      incorrect: input.incorrect,
      invalid: input.invalid,
      outcomeRate: this.rate(input.correct, input.incorrect),
    };
  }

  private rate(correct: number, incorrect: number): number | null {
    const denominator = correct + incorrect;
    return denominator ? correct / denominator : null;
  }

  private range(fromValue?: string, toValue?: string) {
    const to = toValue ? new Date(toValue) : new Date();
    const from = fromValue ? new Date(fromValue) : new Date(to.getTime() - 90 * DAY_MS);
    if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) || from > to || to.getTime() - from.getTime() > MAX_RANGE_MS) {
      throw new DomainError('INVALID_DATE_RANGE', 'Date range must be valid, ordered, and no longer than 366 days', 400);
    }
    return { from, to };
  }

  private encodeCursor(at: Date, id: string): string {
    return Buffer.from(JSON.stringify({ at: at.toISOString(), id }), 'utf8').toString('base64url');
  }

  private decodeCursor(value: string): { at: Date; id: string } {
    try {
      const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as { at?: unknown; id?: unknown };
      const at = new Date(String(parsed.at));
      const id = String(parsed.id);
      if (!Number.isFinite(at.getTime()) || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
        throw new Error('invalid');
      }
      return { at, id };
    } catch {
      throw new DomainError('INVALID_CURSOR', 'Cursor is invalid', 400);
    }
  }

  private afterSkillCursor(item: LearnerSkillView, cursor: { at: Date; id: string }): boolean {
    const time = item.state.lastObservedAt?.getTime() ?? 0;
    return time < cursor.at.getTime() || (time === cursor.at.getTime() && item.curriculum.skill.id < cursor.id);
  }

  private groupBy<T>(values: T[], key: (value: T) => string): Map<string, T[]> {
    const grouped = new Map<string, T[]>();
    for (const value of values) grouped.set(key(value), [...(grouped.get(key(value)) ?? []), value]);
    return grouped;
  }

  private async recordRead(tenant: TenantContext, externalUserMappingId: string, endpoint: string) {
    await this.audit.record(null, `learner_intelligence_${endpoint}_read`, 'external_user', externalUserMappingId, {
      integrationId: tenant.integrationId,
      apiKeyId: tenant.principal.apiKeyId,
    }, tenant.workspaceId);
  }
}
