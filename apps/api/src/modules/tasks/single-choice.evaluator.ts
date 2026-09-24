import { DomainError } from '../../common/errors';

export type SingleChoiceContent = {
  statement: string;
  options: Array<{ id: string; label: string }>;
  correctOptionId: string;
};

export type SingleChoiceAnswer = { optionId: string };

export type EvaluationResult = {
  outcome: 'correct' | 'incorrect' | 'invalid';
  isCorrect: boolean;
  score: number;
  details: { selectedOptionId?: string; correctOptionId?: string; reason?: string };
};

export function evaluateSingleChoice(
  content: SingleChoiceContent,
  answer: unknown,
): EvaluationResult {
  if (!answer || typeof answer !== 'object' || Array.isArray(answer) || Object.keys(answer).length !== 1 || !('optionId' in answer) || typeof answer.optionId !== 'string' || answer.optionId.length === 0) {
    return { outcome: 'invalid', isCorrect: false, score: 0, details: { reason: 'optionId is required' } };
  }
  const selectedOptionId = answer.optionId;
  if (!content.options.some((option) => option.id === selectedOptionId)) {
    return { outcome: 'invalid', isCorrect: false, score: 0, details: { selectedOptionId, reason: 'Unknown option' } };
  }
  const correctOptionId = content.correctOptionId;
  const isCorrect = selectedOptionId === correctOptionId;
  return {
    outcome: isCorrect ? 'correct' : 'incorrect',
    isCorrect,
    score: isCorrect ? 1 : 0,
    details: { selectedOptionId, correctOptionId },
  };
}

export function assertSingleChoiceContent(content: unknown): asserts content is SingleChoiceContent {
  if (!content || typeof content !== 'object' || !('statement' in content) || !('options' in content)) {
    throw new DomainError('INVALID_TASK_VERSION', 'Task content is not a valid single-choice payload', 422);
  }
  const candidate = content as { statement: unknown; options: unknown };
  const options = candidate.options;
  const correctOptionId = (candidate as { correctOptionId?: unknown }).correctOptionId;
  if (typeof candidate.statement !== 'string' || candidate.statement.trim().length === 0 || !Array.isArray(options) || options.length < 2 ||
    typeof correctOptionId !== 'string' || !options.every((option: unknown) => option !== null && typeof option === 'object' &&
      typeof (option as { id?: unknown }).id === 'string' && (option as { id: string }).id.length > 0 &&
      typeof (option as { label?: unknown }).label === 'string' && (option as { label: string }).label.trim().length > 0) ||
    new Set(options.map((option: { id: string }) => option.id)).size !== options.length ||
    !options.some((option: { id: string }) => option.id === correctOptionId)) {
    throw new DomainError('INVALID_TASK_VERSION', 'Task content is not a valid single-choice payload', 422);
  }
}
