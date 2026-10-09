import { createTeachlyClient, type components, type TeachlyClient } from '@teachly/contracts';

export const requiredPilotScopes = [
  'external_users:read',
  'external_users:write',
  'assessment:read',
  'trainer:read',
  'trainer:write',
  'learner_intelligence:read',
  'remediation:write',
] as const;

export type PilotMode = 'preflight' | 'run';

export type ReferencePilotConfig = {
  mode: PilotMode;
  baseUrl: string;
  apiKey: string;
  externalUserId: string;
  runId?: string;
  answerOptionId?: string;
  learnerQuestion?: string;
  fetch?: typeof globalThis.fetch;
  requestId?: () => string;
};

type AiStatus = components['schemas']['AiStatusResponseDto'];
type SubmissionStatus = 'not_requested' | 'submitted' | 'skipped_completed_session';
type RemediationStatus = 'not_requested' | 'generated' | 'provider_not_configured' | 'skipped_completed_session';

export type ReferencePilotReport = {
  status: 'ready' | 'blocked' | 'completed';
  mode: PilotMode;
  integration: { id: string; name: string; status: string; scopes: string[] };
  scopeCheck: { required: readonly string[]; missing: string[] };
  ai?: AiStatus;
  workflow?: {
    learner: string;
    task: { taskId: string; taskVersionId: string };
    trainer: { sessionId: string; progress: { completed: number; total: number }; idempotentReplay: boolean };
    submission: SubmissionStatus;
    remediation: RemediationStatus;
    intelligence: { evidenceCount: number; observedSkills: number; needsPractice: number; activityItems: number };
    requestId: string | null;
    apiVersion: string | null;
  };
};

export async function runReferencePilot(config: ReferencePilotConfig): Promise<ReferencePilotReport> {
  const client = createTeachlyClient({
    baseUrl: config.baseUrl,
    apiKey: config.apiKey,
    fetch: config.fetch,
    requestId: config.requestId,
  });
  const integration = requireData('read integration context', await client.GET('/v1/integration'));
  const missing = requiredPilotScopes.filter((scope) => !integration.scopes.includes(scope));
  const baseReport = {
    mode: config.mode,
    integration: { id: integration.id, name: integration.name, status: integration.status, scopes: integration.scopes },
    scopeCheck: { required: requiredPilotScopes, missing },
  } as const;

  if (missing.length > 0) return { status: 'blocked', ...baseReport };

  const ai = requireData('read AI readiness', await client.GET('/v1/ai/status'));
  if (config.mode === 'preflight') return { status: 'ready', ...baseReport, ai };

  const synchronized = requireData('synchronize learner', await client.POST('/v1/external-users', {
    body: { externalUserId: config.externalUserId },
  }));
  const taskResult = await client.GET('/v1/assessment/tasks', { params: { query: { limit: 100 } } });
  const tasks = requireData('list published tasks', taskResult);
  const selected = selectTask(tasks, config.answerOptionId);
  const runId = sanitizeRunId(config.runId ?? `reference-pilot-${config.externalUserId}-v1`);
  const session = requireData('create trainer session', await client.POST('/v1/trainer/sessions', {
    body: {
      externalLearnerId: config.externalUserId,
      idempotencyKey: `${runId}:session`,
      taskIds: [selected.taskId],
    },
  }));
  const currentResult = await client.GET('/v1/trainer/sessions/{sessionId}/current', {
    params: { path: { sessionId: session.id } },
  });
  const currentSession = requireData('read current trainer task', currentResult);

  let submission: SubmissionStatus = 'not_requested';
  let remediation: RemediationStatus = 'not_requested';
  if (config.answerOptionId) {
    if (!currentSession.current) {
      submission = 'skipped_completed_session';
      remediation = 'skipped_completed_session';
    } else {
      assertOption(currentSession.current, config.answerOptionId);
      const submitted = requireData('submit trainer answer', await client.POST('/v1/trainer/sessions/{sessionId}/submissions', {
        params: { path: { sessionId: session.id } },
        body: {
          itemId: currentSession.current.id,
          idempotencyKey: `${runId}:submission:${currentSession.current.id}`,
          answer: { optionId: config.answerOptionId },
        },
      }));
      submission = 'submitted';
      if (ai.configured) {
        requireData('generate grounded remediation', await client.POST('/v1/remediations', {
          body: {
            externalUserId: config.externalUserId,
            attemptId: submitted.submitted.attempt.id,
            idempotencyKey: `${runId}:remediation:${submitted.submitted.attempt.id}`,
            locale: 'en',
            ...(config.learnerQuestion ? { learnerQuestion: config.learnerQuestion } : {}),
          },
        }));
        remediation = 'generated';
      } else {
        remediation = 'provider_not_configured';
      }
    }
  }

  const [profile, progress, skills, activityResult] = await Promise.all([
    getProfile(client, config.externalUserId),
    getProgress(client, config.externalUserId),
    getSkills(client, config.externalUserId),
    getActivity(client, config.externalUserId),
  ]);

  return {
    status: 'completed',
    ...baseReport,
    ai,
    workflow: {
      learner: synchronized.externalUserId,
      task: { taskId: selected.taskId, taskVersionId: selected.id },
      trainer: { sessionId: session.id, progress: currentSession.progress, idempotentReplay: session.idempotentReplay },
      submission,
      remediation,
      intelligence: {
        evidenceCount: progress.summary.evidenceCount,
        observedSkills: skills.items.length,
        needsPractice: profile.needsPractice.length,
        activityItems: activityResult.data.items.length,
      },
      requestId: activityResult.response.headers.get('x-request-id'),
      apiVersion: activityResult.response.headers.get('x-teachly-api-version'),
    },
  };
}

async function getProfile(client: TeachlyClient, externalUserId: string) {
  return requireData('read learner profile', await client.GET('/v1/learner-intelligence/profile', {
    params: { query: { externalUserId, recentLimit: 10 } },
  }));
}

async function getProgress(client: TeachlyClient, externalUserId: string) {
  return requireData('read learner progress', await client.GET('/v1/learner-intelligence/progress', {
    params: { query: { externalUserId, groupBy: 'skill' } },
  }));
}

async function getSkills(client: TeachlyClient, externalUserId: string) {
  return requireData('read learner skills', await client.GET('/v1/learner-intelligence/skills', {
    params: { query: { externalUserId, limit: 20 } },
  }));
}

async function getActivity(client: TeachlyClient, externalUserId: string) {
  const result = await client.GET('/v1/learner-intelligence/activity', {
    params: { query: { externalUserId, limit: 20 } },
  });
  return { data: requireData('read learner activity', result), response: result.response };
}

function selectTask(tasks: components['schemas']['TaskVersionResponseDto'][], answerOptionId?: string) {
  const selected = answerOptionId
    ? tasks.find((task) => task.taskType === 'single-choice' && optionIds(task.content).includes(answerOptionId))
    : tasks.find((task) => task.taskType === 'single-choice' && task.evaluationRule === 'single-choice.v1');
  if (!selected) {
    throw new Error(answerOptionId
      ? `No published single-choice task contains option ${answerOptionId}`
      : 'No published deterministic single-choice task is available');
  }
  return selected;
}

function assertOption(item: components['schemas']['TrainerItemDto'], answerOptionId: string): void {
  if (!optionIds(item.task.content as unknown as Record<string, unknown>).includes(answerOptionId)) {
    throw new Error(`Configured answer option ${answerOptionId} is not present in the current trainer task`);
  }
}

function optionIds(content: Record<string, unknown>): string[] {
  if (!Array.isArray(content.options)) return [];
  return content.options.flatMap((option) => {
    if (!option || typeof option !== 'object' || !('id' in option) || typeof option.id !== 'string') return [];
    return [option.id];
  });
}

function sanitizeRunId(value: string): string {
  const normalized = value.trim();
  if (!normalized || normalized.length > 150 || !/^[a-zA-Z0-9._:-]+$/.test(normalized)) {
    throw new Error('TEACHLY_PILOT_RUN_ID must be 1-150 characters using letters, digits, dot, underscore, colon, or dash');
  }
  return normalized;
}

function requireData<T>(action: string, result: { data?: T; error?: unknown; response: Response }): T {
  if (result.data !== undefined) return result.data;
  const requestId = result.response.headers.get('x-request-id');
  const apiError = result.error && typeof result.error === 'object' && 'code' in result.error
    ? String(result.error.code)
    : 'UNKNOWN_ERROR';
  throw new Error(`Unable to ${action} (HTTP ${result.response.status}, code ${apiError}, request ${requestId ?? 'unknown'})`);
}
