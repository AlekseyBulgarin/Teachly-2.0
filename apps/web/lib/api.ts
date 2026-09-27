export type Student = { id: string; displayName: string; type: 'student'; createdAt: string };
export type AttemptResult = {
  attempt: { id: string; taskVersionId: string; assignmentId: string; status: string; startedAt: string; submittedAt: string | null };
  result: { id: string; attemptId: string; submissionId: string; evaluationRule: string; outcome: 'correct' | 'incorrect' | 'invalid'; isCorrect: boolean; score: number; evaluatedAt: string };
};
export type Task = {
  taskVersion: { id: string; version: number; taskType: string; content: { statement: string; options: Array<{ id: string; label: string }> }; evaluationRule: string };
  task: { id: string; subjectId: string; courseId: string; topicId: string; skillId: string };
  subject: { name: string; code: string };
  course: { name: string };
  topic: { name: string };
  skill: { name: string };
};
export type LearningState = { status: 'insufficient_evidence' | 'needs_practice' | 'showing_progress'; evidenceCount: number; recentOutcomes: string[]; lastObservedAt: string | null; rule: string; explanation: { reason: string; evidenceReferences: string[] } };
export type ExternalUser = { id: string; externalUserId: string; status: 'active' | 'inactive'; workspaceId: string; integrationId: string };
export type Integration = { id: string; name: string; organizationId: string; workspaceId: string; status: string; scopes: string[]; createdAt: string };
export type KnowledgeStatus = { sourceId: string; sourceName: string; sourceType: string; sourceStatus: string; sourceLicenseStatus: string; documentId: string; documentTitle: string; documentStatus: string; versionId: string; version: number; versionStatus: string; licenseStatus: string; externalAiPermission: string; approvedAt: string | null };
export type AiTrace = { requestId: string; capability: string; status: string; provider: string | null; model: string | null; latencyMs: number | null; knowledgeReferences: string[]; outcome: string | null; createdAt: string; completedAt: string | null };
export type RemediationResponse = { requestId: string; remediation: { summary: string; explanation: string; hint: string; likelyGap: string | null; confidence: number; abstained: boolean }; evidenceRefs: string[]; knowledgeRefs: string[] };

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) { super(message); }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api/teachly/${path.replace(/^\//, '')}`, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options?.headers ?? {}) },
    cache: 'no-store',
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(response.status, body?.code ?? 'REQUEST_FAILED', body?.message ?? 'Teachly API request failed');
  }
  return body as T;
}

type StudentRelationshipRow = { student: Student; relationship: { id: string; status: string; createdAt: string } };

export const api = {
  students: () => request<StudentRelationshipRow[]>('students').then((rows) => rows.map((row) => row.student)),
  results: (studentId: string) => request<AttemptResult[]>(`students/${studentId}/results`),
  task: (taskVersionId: string) => request<Task>(`tasks/published/${taskVersionId}`),
  learningState: (studentId: string, skillId: string) => request<LearningState>(`students/${studentId}/learning-state?skillId=${skillId}`),
  externalUsers: () => request<ExternalUser[]>('v1/external-users'),
  integration: () => request<Integration>('v1/integration'),
  knowledge: () => request<KnowledgeStatus[]>('v1/knowledge/status'),
  aiTraces: () => request<AiTrace[]>('v1/ai-requests'),
  remediation: (body: { externalUserId: string; attemptId: string; learnerQuestion?: string; idempotencyKey: string }) => request<RemediationResponse>('v1/remediations', { method: 'POST', body: JSON.stringify(body), headers: { 'x-request-id': crypto.randomUUID() } }),
};
