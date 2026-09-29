export const kompegeCurriculum = {
  subject: 'Mathematics',
  course: 'Algebra',
  expressionsTopic: 'Expressions',
  proofTopic: 'Proof',
  compareValuesSkill: 'Compare values',
  applyFormulasSkill: 'Apply formulas',
} as const;

export const kompegeTextTask = {
  externalTaskId: 'kompege-like-text-001',
  taskType: 'single-choice',
  statement: 'Which expression has the greatest value?',
  subject: kompegeCurriculum.subject,
  course: kompegeCurriculum.course,
  topic: kompegeCurriculum.expressionsTopic,
  skill: kompegeCurriculum.compareValuesSkill,
  category: 'Section A',
  section: '1',
  blocks: [{ type: 'paragraph', text: 'Choose one answer.' }],
  options: [{ id: 'a', label: '2' }, { id: 'b', label: '3' }],
  answer: 'b',
} as const;

export const kompegeRichTask = {
  externalTaskId: 'kompege-like-rich-002',
  taskType: 'single-choice',
  statement: 'Use the formula to determine the result.',
  subject: kompegeCurriculum.subject,
  course: kompegeCurriculum.course,
  topic: kompegeCurriculum.expressionsTopic,
  skill: kompegeCurriculum.applyFormulasSkill,
  category: 'Section B',
  section: '2',
  blocks: [
    { type: 'formula', latex: 'a^2 + b^2 = c^2' },
    { type: 'table', rows: [['a', 'b'], ['3', '4']] },
    { type: 'image', reference: 'fixture://kompege-like/diagram.png' },
    { type: 'file', reference: 'fixture://kompege-like/source.pdf', label: 'Source file' },
  ],
  options: [{ id: 'a', label: '5' }, { id: 'b', label: '7' }],
  answer: 'a',
} as const;

export const kompegeStructuredTask = {
  externalTaskId: 'kompege-like-open-003',
  taskType: 'structured-answer',
  statement: 'Explain the reasoning and provide a structured response.',
  subject: kompegeCurriculum.subject,
  course: kompegeCurriculum.course,
  topic: kompegeCurriculum.proofTopic,
  category: 'Section C',
  section: '3',
  blocks: [{ type: 'paragraph', text: 'This task requires human review.' }],
  answerSchema: { type: 'structured-answer', required: true },
} as const;

export const kompegeUnmappedTask = {
  externalTaskId: 'kompege-like-unmapped-004',
  taskType: 'single-choice',
  statement: 'A supported task without a mapped skill',
  subject: kompegeCurriculum.subject,
  course: kompegeCurriculum.course,
  topic: kompegeCurriculum.expressionsTopic,
  skill: 'New external skill',
  options: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
  answer: 'a',
} as const;

export const kompegeLikeTasks = [kompegeTextTask, kompegeRichTask, kompegeStructuredTask] as const;

export type KompegeLikeTask = (typeof kompegeLikeTasks)[number];
