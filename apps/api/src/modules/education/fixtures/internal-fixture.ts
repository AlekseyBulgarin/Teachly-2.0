type InternalRawFixture = ReturnType<typeof buildInternalRawFixture>;

function buildInternalRawFixture() {
  return {
    source: { kind: 'internal_fixture' as const, identifier: 'teachly-phase-2-single-choice', fixtureVersion: '1' },
    subject: { code: 'informatics-ict', name: 'Informatics and ICT' },
    course: { name: 'Development Fixture Course' },
    topic: { name: 'Algorithms and Logic' },
    skill: { name: 'Select a correct answer' },
    task: { sourceKind: 'internal_fixture' },
    taskVersion: {
      version: 1,
      taskType: 'single-choice',
      status: 'published' as const,
      content: {
        statement: 'Which option represents a deterministic evaluation?',
        options: [
          { id: 'a', label: 'The same input always produces the same result' },
          { id: 'b', label: 'The result depends on a random model response' },
          { id: 'c', label: 'The result is chosen by the client' },
        ],
        correctOptionId: 'a',
      },
      answerSchema: { type: 'single-choice' as const, required: true as const },
      evaluationRule: 'single-choice.v1',
      provenance: {
        sourceKind: 'internal_fixture' as const,
        sourceIdentifier: 'teachly-phase-2-single-choice',
        licenseStatus: 'development_only' as const,
        fixtureVersion: '1',
      },
      publishedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
  };
}

function normalizeInternalFixture(raw: InternalRawFixture) {
  return { ...raw, normalizedBy: 'internal-fixture-normalizer.v1' };
}

function validateInternalFixture(fixture: ReturnType<typeof normalizeInternalFixture>) {
  if (fixture.taskVersion.taskType !== 'single-choice' || fixture.taskVersion.content.options.length < 2) {
    throw new Error('Internal fixture validation failed');
  }
  if (!fixture.taskVersion.content.options.some((option) => option.id === fixture.taskVersion.content.correctOptionId)) {
    throw new Error('Internal fixture correct option is not present');
  }
  return fixture;
}

export function buildInternalFixture() {
  const raw = buildInternalRawFixture();
  const normalized = normalizeInternalFixture(raw);
  return validateInternalFixture(normalized);
}
