import type { Page, Route } from '@playwright/test';

const task = {
  id: '00000000-0000-4000-8000-000000000330', taskId: '00000000-0000-4000-8000-000000000310', version: 1,
  taskType: 'single-choice', status: 'published', evaluationRule: 'single-choice.v1', publishedAt: '2026-10-09T08:00:00.000Z', createdAt: '2026-10-09T08:00:00.000Z',
  content: { title: 'Переменная и вывод', statement: 'Что выведет программа?', options: [{ id: 'a', label: 'x' }, { id: 'b', label: '5' }, { id: 'c', label: 'Ничего' }], metadata: { showcase: true, track: 'python', code: 'x = 5\nprint(x)', explanation: 'Переменная хранит число.', translations: { ru: { title: 'Переменная и вывод', statement: 'Что выведет программа?', options: [{ id: 'a', label: 'x' }, { id: 'b', label: '5' }, { id: 'c', label: 'Ничего' }], explanation: 'Переменная хранит число.' }, en: { title: 'Variable and output', statement: 'What does the program print?', options: [{ id: 'a', label: 'x' }, { id: 'b', label: '5' }, { id: 'c', label: 'Nothing' }], explanation: 'The variable stores a number.' } } } },
};

const curriculum = { subject: { code: 'CS', name: 'Информатика' }, course: { id: 'course', name: 'Основы программирования' }, topic: { id: 'topic', name: 'Программирование' }, skill: { id: 'skill', name: 'Основы Python' } };
const summary = { evidenceCount: 12, correct: 7, incorrect: 5, invalid: 0, outcomeRate: 7 / 12 };
const skill = { curriculum, state: { rule: 'recent.v1', status: 'needs_practice', evidenceCount: 6, recentOutcomes: ['incorrect', 'correct', 'incorrect'], lastObservedAt: '2026-10-08T10:00:00.000Z', asOf: '2026-10-09T08:00:00.000Z' }, trend: { rule: 'window.v1', status: 'improving', currentCorrect: 2, previousCorrect: 1 }, window: summary, taskEvidenceCount: 10, trainerEvidenceCount: 2 };

function payload(url: string): unknown {
  if (url.endsWith('/health')) return { status: 'ok', database: 'ok' };
  if (url.endsWith('/v1/assessment/tasks')) return [task];
  if (url.endsWith('/v1/assessment/variants')) return [{ id: 'variant', version: 1, status: 'published', title: 'Python: первые программы', description: 'Пять коротких задач.', metadata: { audience: 'showcase', track: 'python' }, publishedAt: '2026-10-09T08:00:00.000Z', items: [0, 1, 2, 3, 4].map((position) => ({ id: `item-${position}`, position, required: true, resolutionStatus: 'resolved', section: position < 2 ? 'Основа' : 'Применение' })) }];
  if (url.endsWith('/v1/theory/materials')) return [{ id: 'theory', title: 'Как Python выполняет выражения', description: 'Переменные, типы и порядок вычислений.', category: 'Python', status: 'published', curriculum: { subjectId: 'subject', courseId: 'course', topicId: 'topic', skillId: 'skill' }, taskIds: [task.taskId], version: { id: 'theory-version', version: 1, status: 'published', content: { blocks: [{ type: 'heading', text: 'Сначала значение, затем действие' }, { type: 'paragraph', text: 'Переменная хранит значение, а операция учитывает его тип.' }] } } }];
  if (url.includes('/v1/learner-intelligence/profile')) return { learner: { externalUserId: 'demo-learner-01', status: 'active' }, asOf: '2026-10-09T08:00:00.000Z', activity: { ...summary, firstObservedAt: '2026-09-01T08:00:00.000Z', lastObservedAt: '2026-10-08T10:00:00.000Z', activeDays: 8 }, attempts: { started: 12, submitted: 12, evaluated: 12, correct: 7, incorrect: 5, invalid: 0, outcomeRate: 7 / 12, mappedResults: 12, firstStartedAt: '2026-09-01T08:00:00.000Z', lastActivityAt: '2026-10-08T10:00:00.000Z' }, mappingCoverage: { evaluatedResults: 12, withSkillEvidence: 12 }, skills: { observed: 2, byStatus: { showing_progress: 1, needs_practice: 1, insufficient_evidence: 0 } }, strengths: [{ ...skill, state: { ...skill.state, status: 'showing_progress' }, curriculum: { ...curriculum, skill: { id: 'skill-2', name: 'Логические условия' } } }], needsPractice: [skill], trainer: { sessionsStarted: 2, sessionsCompleted: 2, itemsSubmitted: 8, lastActivityAt: '2026-10-08T10:00:00.000Z' }, recentActivity: [{ occurredAt: '2026-10-08T10:00:00.000Z', origin: 'assessment', outcome: 'incorrect', curriculum }] };
  if (url.includes('/v1/learner-intelligence/progress')) return { learner: { externalUserId: 'demo-learner-01', status: 'active' }, asOf: '2026-10-09T08:00:00.000Z', window: { from: '2026-09-09T08:00:00.000Z', to: '2026-10-09T08:00:00.000Z' }, summary, mappingCoverage: { evaluatedResults: 12, withSkillEvidence: 12 }, skillStates: { observed: 2, byStatus: { showing_progress: 1, needs_practice: 1, insufficient_evidence: 0 } }, activityByDay: [{ date: '2026-10-06', evidenceCount: 2 }, { date: '2026-10-08', evidenceCount: 4 }], groupBy: 'skill', dimensions: [skill], recentOutcomeTrend: [{ curriculum, trend: skill.trend }] };
  if (url.endsWith('/v1/ai/status')) return { configured: false, provider: 'disabled', model: null, apiMode: null };
  if (url.endsWith('/v1/knowledge/status')) return [{ sourceId: 'source', sourceName: 'Учебная программа', sourceType: 'manual', sourceStatus: 'active', sourceLicenseStatus: 'allowed', documentId: 'document', documentTitle: 'Основы программирования', documentStatus: 'active', versionId: 'version', version: 1, versionStatus: 'approved', licenseStatus: 'allowed', externalAiPermission: 'allowed', approvedAt: '2026-10-01T08:00:00.000Z' }];
  if (url.endsWith('/v1/integration')) return { id: 'integration', name: 'Demo Customer Platform', organizationId: 'organization', workspaceId: 'workspace', status: 'active', scopes: ['assessment:read'], createdAt: '2026-10-01T08:00:00.000Z' };
  if (url.endsWith('/v1/external-users')) return [{ id: 'external', externalUserId: 'demo-learner-01', status: 'active', workspaceId: 'workspace', integrationId: 'integration' }];
  return [];
}

export async function mockShowcaseApi(page: Page) {
  await page.route('**/api/teachly/**', (route: Route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload(route.request().url())) }));
}

export { task as showcaseTask };
