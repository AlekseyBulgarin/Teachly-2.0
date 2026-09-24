import { assertSingleChoiceContent, evaluateSingleChoice } from './single-choice.evaluator';

const content = {
  statement: 'Choose the correct option',
  options: [
    { id: 'a', label: 'Correct' },
    { id: 'b', label: 'Incorrect' },
  ],
  correctOptionId: 'a',
};

describe('evaluateSingleChoice', () => {
  it('returns a deterministic correct result', () => {
    const first = evaluateSingleChoice(content, { optionId: 'a' });
    const second = evaluateSingleChoice(content, { optionId: 'a' });

    expect(first).toEqual(second);
    expect(first).toMatchObject({ outcome: 'correct', isCorrect: true, score: 1 });
  });

  it('returns an incorrect result for a valid wrong option', () => {
    expect(evaluateSingleChoice(content, { optionId: 'b' })).toMatchObject({
      outcome: 'incorrect',
      isCorrect: false,
      score: 0,
    });
  });

  it('rejects malformed and unknown answers without throwing', () => {
    expect(evaluateSingleChoice(content, null).outcome).toBe('invalid');
    expect(evaluateSingleChoice(content, { optionId: 'unknown' }).outcome).toBe('invalid');
    expect(evaluateSingleChoice(content, { optionId: 'a', isCorrect: true }).outcome).toBe('invalid');
  });

  it('rejects ambiguous or malformed published content', () => {
    expect(() => assertSingleChoiceContent({ ...content, correctOptionId: 'missing' })).toThrow('not a valid');
    expect(() => assertSingleChoiceContent({ ...content, options: [{ id: 'a', label: 'one' }, { id: 'a', label: 'two' }] })).toThrow('not a valid');
    expect(() => assertSingleChoiceContent({ ...content, options: [null, { id: 'b', label: 'other' }] })).toThrow('not a valid');
  });
});
