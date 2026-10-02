import { deriveLearningTrend, LEARNING_TREND_RULE } from './learning.rules';
import type { EvidenceFacts } from './learning.rules';

function evidence(outcomes: Array<'correct' | 'incorrect' | 'invalid'>): EvidenceFacts[] {
  return outcomes.map((outcome, index) => ({
    id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    courseId: 'course',
    outcome,
    occurredAt: new Date(Date.UTC(2026, 0, 1, 0, index)),
  }));
}

describe('learning_trend.v1', () => {
  it('requires two complete windows', () => {
    expect(deriveLearningTrend(evidence(['correct', 'incorrect', 'correct']))).toEqual({
      rule: LEARNING_TREND_RULE,
      status: 'insufficient_history',
      currentCorrect: 0,
      previousCorrect: 0,
    });
  });

  it.each([
    { outcomes: ['incorrect', 'incorrect', 'incorrect', 'correct', 'correct', 'correct'], status: 'improving' },
    { outcomes: ['correct', 'correct', 'correct', 'incorrect', 'incorrect', 'incorrect'], status: 'regressing' },
    { outcomes: ['correct', 'incorrect', 'incorrect', 'correct', 'incorrect', 'incorrect'], status: 'stable' },
  ] as const)('returns $status from the latest and preceding windows', ({ outcomes, status }) => {
    expect(deriveLearningTrend(evidence([...outcomes])).status).toBe(status);
  });

  it('uses id descending as the stable tie-breaker', () => {
    const rows = evidence(['correct', 'correct', 'correct', 'incorrect', 'incorrect', 'incorrect'])
      .map((row) => ({ ...row, occurredAt: new Date('2026-01-01T00:00:00.000Z') }));
    expect(deriveLearningTrend(rows).status).toBe('regressing');
  });
});
