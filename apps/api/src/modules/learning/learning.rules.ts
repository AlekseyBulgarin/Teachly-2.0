import type {
  LearningEventView,
  LearningState,
  LearningTrend,
  ResultOutcome,
} from './learning.types';

export const SKILL_EVIDENCE_RULE = 'outcome_by_skill.v1';
export const LEARNING_STATE_RULE = 'learning_state.v1';
export const LEARNING_STATE_RECENT_WINDOW = 3;
export const LEARNING_STATE_PROGRESS_THRESHOLD = 2;
export const LEARNING_TREND_RULE = 'learning_trend.v1' as const;
export const LEARNING_TREND_WINDOW = 3;

export type SkillEvidenceFacts = {
  learnerId: string;
  courseId: string;
  skillId: string;
  learningEventId: string;
  rule: string;
  outcome: ResultOutcome;
  occurredAt: Date;
};

export type EvidenceFacts = {
  id: string;
  courseId: string;
  outcome: ResultOutcome;
  occurredAt: Date;
};

export function deriveSkillEvidence(event: LearningEventView): SkillEvidenceFacts | null {
  if (event.eventType !== 'result_recorded' || !event.outcome) return null;
  return {
    learnerId: event.learnerId,
    courseId: event.courseId,
    skillId: event.skillId,
    learningEventId: event.id,
    rule: SKILL_EVIDENCE_RULE,
    outcome: event.outcome,
    occurredAt: event.occurredAt,
  };
}

export function deriveLearningState(input: {
  learnerId: string;
  workspaceId: string | null;
  skillId: string;
  evidence: EvidenceFacts[];
}): LearningState {
  const sorted = [...input.evidence].sort((left, right) => {
    const delta = right.occurredAt.getTime() - left.occurredAt.getTime();
    return delta !== 0 ? delta : right.id.localeCompare(left.id);
  });
  const recent = sorted.slice(0, LEARNING_STATE_RECENT_WINDOW);
  const correctRecent = recent.filter((entry) => entry.outcome === 'correct').length;

  const status = resolveStatus(sorted.length, recent.length, correctRecent);
  return {
    learnerId: input.learnerId,
    workspaceId: input.workspaceId,
    courseId: sorted[0]?.courseId ?? null,
    skillId: input.skillId,
    rule: LEARNING_STATE_RULE,
    evidenceCount: sorted.length,
    recentOutcomes: recent.map((entry) => entry.outcome),
    lastObservedAt: sorted[0]?.occurredAt ?? null,
    status: status.value,
    explanation: {
      reason: status.reason,
      evidenceReferences: recent.map((entry) => entry.id),
    },
  };
}

export function deriveLearningTrend(evidence: EvidenceFacts[]): LearningTrend {
  const sorted = [...evidence].sort((left, right) => {
    const delta = right.occurredAt.getTime() - left.occurredAt.getTime();
    return delta !== 0 ? delta : right.id.localeCompare(left.id);
  });
  if (sorted.length < LEARNING_TREND_WINDOW * 2) {
    return { rule: LEARNING_TREND_RULE, status: 'insufficient_history', currentCorrect: 0, previousCorrect: 0 };
  }
  const currentCorrect = sorted.slice(0, LEARNING_TREND_WINDOW).filter((entry) => entry.outcome === 'correct').length;
  const previousCorrect = sorted.slice(LEARNING_TREND_WINDOW, LEARNING_TREND_WINDOW * 2)
    .filter((entry) => entry.outcome === 'correct').length;
  return {
    rule: LEARNING_TREND_RULE,
    status: currentCorrect > previousCorrect ? 'improving' : currentCorrect < previousCorrect ? 'regressing' : 'stable',
    currentCorrect,
    previousCorrect,
  };
}

function resolveStatus(
  evidenceCount: number,
  recentCount: number,
  correctRecent: number,
): { value: LearningState['status']; reason: string } {
  if (evidenceCount === 0) {
    return { value: 'insufficient_evidence', reason: 'No skill evidence has been recorded' };
  }
  if (recentCount < LEARNING_STATE_RECENT_WINDOW) {
    return {
      value: 'insufficient_evidence',
      reason: `${recentCount} of ${LEARNING_STATE_RECENT_WINDOW} recent outcomes recorded`,
    };
  }
  const reason = `${correctRecent} of the last ${LEARNING_STATE_RECENT_WINDOW} outcomes were correct`;
  return correctRecent >= LEARNING_STATE_PROGRESS_THRESHOLD
    ? { value: 'showing_progress', reason }
    : { value: 'needs_practice', reason };
}
