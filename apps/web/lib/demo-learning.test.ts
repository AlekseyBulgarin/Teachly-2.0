import assert from 'node:assert/strict';
import test from 'node:test';
import { localizeTask } from './demo-learning';
import type { PublicTaskVersion } from './api';

const task: PublicTaskVersion = {
  id: 'version',
  taskId: 'task',
  version: 1,
  taskType: 'single-choice',
  status: 'published',
  content: {
    statement: 'Русский вопрос',
    options: [{ id: 'a', label: 'Русский ответ' }],
    metadata: {
      showcase: true,
      track: 'python',
      code: 'print(5)',
      translations: {
        ru: { title: 'Заголовок', statement: 'Русский вопрос', options: [{ id: 'a', label: 'Русский ответ' }], explanation: 'Разбор' },
        en: { title: 'Title', statement: 'English question', options: [{ id: 'a', label: 'English answer' }], explanation: 'Explanation' },
      },
    },
  },
  evaluationRule: 'single-choice.v1',
  publishedAt: '2026-10-09T08:00:00.000Z',
  createdAt: '2026-10-09T08:00:00.000Z',
};

test('localizeTask selects requested copy without changing answer ids', () => {
  const localized = localizeTask(task, 'en');
  assert.equal(localized.content.title, 'Title');
  assert.equal(localized.content.statement, 'English question');
  assert.deepEqual(localized.content.options, [{ id: 'a', label: 'English answer' }]);
  assert.equal(localized.explanation, 'Explanation');
  assert.equal(localized.track, 'python');
  assert.equal(localized.code, 'print(5)');
  assert.equal(localized.showcase, true);
});

test('localizeTask safely falls back to public task content', () => {
  const localized = localizeTask({ ...task, content: { statement: 'Fallback', options: [{ id: 'b', label: 'Fallback option' }] } }, 'en');
  assert.equal(localized.content.statement, 'Fallback');
  assert.deepEqual(localized.content.options, [{ id: 'b', label: 'Fallback option' }]);
  assert.equal(localized.showcase, false);
});
