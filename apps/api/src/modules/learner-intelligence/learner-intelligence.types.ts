import type { CurriculumDescriptor } from '../education/education.types';
import type { LearningStateStatus, LearningTrendStatus, ResultOutcome } from '../learning/learning.types';

export type PublicSkillState = {
  rule: 'learning_state.v1';
  status: LearningStateStatus;
  evidenceCount: number;
  recentOutcomes: ResultOutcome[];
  lastObservedAt: Date | null;
  asOf: Date;
};

export type PublicSkillTrend = {
  rule: 'learning_trend.v1';
  status: LearningTrendStatus;
  currentCorrect: number;
  previousCorrect: number;
};

export type LearnerSkillView = {
  curriculum: CurriculumDescriptor;
  state: PublicSkillState;
  trend: PublicSkillTrend;
  window: { evidenceCount: number; correct: number; incorrect: number; invalid: number; outcomeRate: number | null };
  taskEvidenceCount: number;
  trainerEvidenceCount: number;
};

export type PublicActivityItem = {
  occurredAt: Date;
  origin: 'assessment' | 'trainer' | 'external_observation';
  outcome: ResultOutcome;
  curriculum: CurriculumDescriptor;
};

export type OutcomeSummary = {
  evidenceCount: number;
  correct: number;
  incorrect: number;
  invalid: number;
  outcomeRate: number | null;
};
