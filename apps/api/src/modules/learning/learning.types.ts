export const learningEventSources = ['teachly_authoritative', 'integration'] as const;
export type LearningEventSource = typeof learningEventSources[number];

export type LearningEventType = 'attempt_submitted' | 'result_recorded';
export type ResultOutcome = 'correct' | 'incorrect' | 'invalid';
export type LearningStateStatus = 'insufficient_evidence' | 'needs_practice' | 'showing_progress';

export type LearningEventInput = {
  workspaceId: string;
  learnerId: string;
  eventType: LearningEventType;
  source: LearningEventSource;
  sourceType: string;
  sourceId: string;
  taskVersionId: string;
  courseId: string;
  skillId: string;
  outcome?: ResultOutcome;
  evaluationRule?: string;
  correlationId?: string;
  occurredAt?: Date;
};

export type LearningEventView = {
  id: string;
  workspaceId: string;
  eventType: LearningEventType;
  learnerId: string;
  source: LearningEventSource;
  sourceType: string;
  sourceId: string;
  taskVersionId: string;
  courseId: string;
  skillId: string;
  outcome: ResultOutcome | null;
  evaluationRule: string | null;
  correlationId: string | null;
  occurredAt: Date;
};

export type SkillEvidenceView = {
  id: string;
  workspaceId: string;
  learnerId: string;
  courseId: string;
  skillId: string;
  learningEventId: string;
  rule: string;
  outcome: ResultOutcome;
  occurredAt: Date;
};

export type LearningState = {
  learnerId: string;
  workspaceId: string | null;
  courseId: string | null;
  skillId: string;
  rule: string;
  evidenceCount: number;
  recentOutcomes: ResultOutcome[];
  lastObservedAt: Date | null;
  status: LearningStateStatus;
  explanation: {
    reason: string;
    evidenceReferences: string[];
  };
};

export type ResultFactsInput = {
  workspaceId: string;
  learnerId: string;
  taskVersionId: string;
  courseId: string | null;
  skillId: string | null;
  submissionId: string;
  resultId: string;
  outcome: ResultOutcome;
  evaluationRule: string;
  correlationId?: string;
  occurredAt?: Date;
};

export type ExternalResultFactsInput = {
  workspaceId: string;
  learnerId: string;
  taskVersionId: string;
  courseId: string;
  skillId: string;
  observationId: string;
  outcome: ResultOutcome;
  occurredAt?: Date;
};

export type LearningHandoffResult = {
  status: 'recorded';
  attemptEvent: LearningEventView;
  resultEvent: LearningEventView;
  evidence: SkillEvidenceView | null;
} | {
  status: 'skipped';
  reason: 'skill_unmapped';
  attemptEvent: LearningEventView;
  resultEvent: LearningEventView;
  evidence: null;
};
