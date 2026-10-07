import assert from 'node:assert/strict';
import test from 'node:test';
import { requiredPilotScopes, runReferencePilot } from './reference-pilot.js';

const id = {
  integration: '11111111-1111-4111-8111-111111111111',
  organization: '22222222-2222-4222-8222-222222222222',
  workspace: '33333333-3333-4333-8333-333333333333',
  mapping: '44444444-4444-4444-8444-444444444444',
  task: '55555555-5555-4555-8555-555555555555',
  version: '66666666-6666-4666-8666-666666666666',
  session: '77777777-7777-4777-8777-777777777777',
  item: '88888888-8888-4888-8888-888888888888',
  attempt: '99999999-9999-4999-8999-999999999999',
};

test('preflight reports missing scopes and performs no writes', async () => {
  const calls: Request[] = [];
  const fetch = mockFetch(calls, { scopes: ['external_users:read'] });
  const report = await runReferencePilot(config('preflight', fetch));

  assert.equal(report.status, 'blocked');
  assert.ok(report.scopeCheck.missing.includes('trainer:write'));
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.method, 'GET');
});

test('run executes the complete non-destructive reference workflow with typed contracts', async () => {
  const calls: Request[] = [];
  const fetch = mockFetch(calls, { scopes: [...requiredPilotScopes] });
  const report = await runReferencePilot(config('run', fetch));

  assert.equal(report.status, 'completed');
  assert.equal(report.workflow?.learner, 'partner-learner-1');
  assert.equal(report.workflow?.trainer.sessionId, id.session);
  assert.equal(report.workflow?.submission, 'not_requested');
  assert.equal(report.workflow?.intelligence.evidenceCount, 3);
  assert.ok(calls.some((request) => request.method === 'POST' && new URL(request.url).pathname === '/v1/trainer/sessions'));
  assert.ok(calls.every((request) => request.headers.get('authorization') === 'Bearer server-secret'));
  assert.ok(calls.every((request) => !request.url.includes('server-secret')));
});

function config(mode: 'preflight' | 'run', fetch: typeof globalThis.fetch) {
  return {
    mode,
    baseUrl: 'https://api.example.test',
    apiKey: 'server-secret',
    externalUserId: 'partner-learner-1',
    runId: 'contract-test-v1',
    fetch,
    requestId: () => 'request-test-1',
  } as const;
}

function mockFetch(calls: Request[], options: { scopes: string[] }): typeof globalThis.fetch {
  return (async (input: Parameters<typeof globalThis.fetch>[0], init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init);
    calls.push(request);
    const path = new URL(request.url).pathname;
    const key = `${request.method} ${path}`;
    const responses: Record<string, unknown> = {
      'GET /v1/integration': {
        id: id.integration, name: 'Reference pilot', organizationId: id.organization, workspaceId: id.workspace,
        status: 'active', scopes: options.scopes, createdAt: '2026-10-07T00:00:00.000Z',
      },
      'GET /v1/ai/status': { configured: false, provider: 'disabled', model: null, apiMode: null },
      'POST /v1/external-users': {
        id: id.mapping, organizationId: id.organization, workspaceId: id.workspace, integrationId: id.integration,
        externalUserId: 'partner-learner-1', status: 'active', createdAt: '2026-10-07T00:00:00.000Z', updatedAt: '2026-10-07T00:00:00.000Z',
      },
      'GET /v1/assessment/tasks': [{
        id: id.version, taskId: id.task, version: 1, taskType: 'single-choice', status: 'published',
        content: { statement: '2 + 2?', options: [{ id: 'four', label: '4' }] },
        answerSchema: { evaluatorCapability: 'automatic' }, evaluatorCapability: 'automatic',
        evaluationRule: 'single-choice.v1', provenance: {}, rawSnapshotId: null,
        publishedAt: '2026-10-07T00:00:00.000Z', createdAt: '2026-10-07T00:00:00.000Z',
      }],
      'POST /v1/trainer/sessions': session(false),
      [`GET /v1/trainer/sessions/${id.session}/current`]: session(false),
      'GET /v1/learner-intelligence/profile': {
        learner: { externalUserId: 'partner-learner-1', status: 'active' }, asOf: '2026-10-07T00:00:00.000Z',
        activity: summary(3), attempts: { started: 3, submitted: 3, evaluated: 3, correct: 2, incorrect: 1, invalid: 0, mappedResults: 3, firstStartedAt: null, lastActivityAt: null, outcomeRate: 0.67 },
        mappingCoverage: { evaluatedResults: 3, withSkillEvidence: 3 }, skills: states(), strengths: [], needsPractice: [],
        trainer: { sessionsStarted: 1, sessionsCompleted: 0, itemsSubmitted: 0, lastActivityAt: null }, recentActivity: [],
      },
      'GET /v1/learner-intelligence/progress': {
        learner: { externalUserId: 'partner-learner-1', status: 'active' }, asOf: '2026-10-07T00:00:00.000Z',
        window: { from: '2026-07-09T00:00:00.000Z', to: '2026-10-07T00:00:00.000Z' }, summary: summary(3),
        mappingCoverage: { evaluatedResults: 3, withSkillEvidence: 3 }, skillStates: states(), activityByDay: [],
        groupBy: 'skill', dimensions: [], recentOutcomeTrend: [],
      },
      'GET /v1/learner-intelligence/skills': {
        learner: { externalUserId: 'partner-learner-1', status: 'active' }, asOf: '2026-10-07T00:00:00.000Z', items: [], nextCursor: null,
      },
      'GET /v1/learner-intelligence/activity': {
        learner: { externalUserId: 'partner-learner-1', status: 'active' }, items: [], nextCursor: null,
      },
    };
    if (!(key in responses)) throw new Error(`Unexpected request ${key}`);
    return Response.json(responses[key], {
      status: request.method === 'POST' ? 201 : 200,
      headers: { 'x-request-id': 'request-test-1', 'x-teachly-api-version': '1' },
    });
  }) as typeof globalThis.fetch;
}

function session(idempotentReplay: boolean) {
  return {
    id: id.session, status: 'active', filters: { subjectId: null, courseId: null, topicId: null, skillId: null },
    progress: { completed: 0, total: 1 },
    current: {
      id: id.item, position: 1, status: 'started', attemptId: id.attempt, result: null,
      task: {
        id: id.version, taskId: id.task, version: 1, taskType: 'single-choice', status: 'published',
        content: { statement: '2 + 2?', options: [{ id: 'four', label: '4' }] },
        evaluationRule: 'single-choice.v1', publishedAt: '2026-10-07T00:00:00.000Z', createdAt: '2026-10-07T00:00:00.000Z',
      },
    },
    latestResult: null, canComplete: false, idempotentReplay,
  };
}

function summary(evidenceCount: number) {
  return { evidenceCount, correct: 2, incorrect: 1, invalid: 0, outcomeRate: 0.67 };
}

function states() {
  return { observed: 0, byStatus: { insufficient_evidence: 0, needs_practice: 0, showing_progress: 0 } };
}
