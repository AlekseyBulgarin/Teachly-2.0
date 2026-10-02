import type { ResultOutcome } from './learning.types';

export type LearnerEvidenceFact = {
  id: string;
  sourceType: string;
  sourceId: string;
  skillId: string;
  courseId: string;
  outcome: ResultOutcome;
  occurredAt: Date;
};

export type LearnerSkillEvidenceTotal = {
  skillId: string;
  evidenceCount: number;
  correct: number;
  incorrect: number;
  invalid: number;
  firstObservedAt: Date;
  lastObservedAt: Date;
};

export type LearnerEvidenceSummary = {
  evidenceCount: number;
  correct: number;
  incorrect: number;
  invalid: number;
  firstObservedAt: Date | null;
  lastObservedAt: Date | null;
  activeDays: number;
};

export type LearnerActivityPage = { items: LearnerEvidenceFact[]; hasMore: boolean };
export type LearnerDailyActivity = { date: string; evidenceCount: number };
export type LearnerSourceEvidenceCount = { skillId: string; evidenceCount: number };
