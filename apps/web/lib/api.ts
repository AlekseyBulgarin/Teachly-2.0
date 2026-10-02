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
export type HealthStatus = { status: string; database: string };

export type LearnerCurriculum = {
  subject: { code: string; name: string };
  course: { id: string; name: string };
  topic: { id: string; name: string };
  skill: { id: string; name: string };
};
export type LearnerStateStatus = 'insufficient_evidence' | 'needs_practice' | 'showing_progress';
export type LearnerTrendStatus = 'insufficient_history' | 'improving' | 'stable' | 'regressing';
export type LearnerOutcome = 'correct' | 'incorrect' | 'invalid';
export type LearnerGroupBy = 'skill' | 'topic' | 'course' | 'subject';
export type LearnerSkillStates = { observed: number; byStatus: Record<LearnerStateStatus, number> };
export type LearnerOutcomeSummary = {
  evidenceCount: number;
  correct: number;
  incorrect: number;
  invalid: number;
  outcomeRate: number | null;
};
export type LearnerSkillState = {
  rule: string;
  status: LearnerStateStatus;
  evidenceCount: number;
  recentOutcomes: LearnerOutcome[];
  lastObservedAt: string | null;
  asOf: string;
};
export type LearnerSkillTrend = { rule: string; status: LearnerTrendStatus; currentCorrect: number; previousCorrect: number };
export type LearnerSkill = {
  curriculum: LearnerCurriculum;
  state: LearnerSkillState;
  trend: LearnerSkillTrend;
  window: LearnerOutcomeSummary;
  taskEvidenceCount: number;
  trainerEvidenceCount: number;
};
export type LearnerDimensionGroup = LearnerOutcomeSummary & {
  reference: { id?: string; code?: string; name?: string };
  observedSkillCount: number;
  skillStates: LearnerSkillStates;
};
export type LearnerActivityItem = {
  occurredAt: string;
  origin: 'assessment' | 'trainer' | 'external_observation';
  outcome: LearnerOutcome;
  curriculum: LearnerCurriculum;
};
export type LearnerProfile = {
  learner: { externalUserId: string; status: string };
  asOf: string;
  activity: LearnerOutcomeSummary & { firstObservedAt: string | null; lastObservedAt: string | null; activeDays: number };
  attempts: {
    started: number;
    submitted: number;
    evaluated: number;
    correct: number;
    incorrect: number;
    invalid: number;
    outcomeRate: number | null;
    mappedResults: number;
    firstStartedAt: string | null;
    lastActivityAt: string | null;
  };
  mappingCoverage: { evaluatedResults: number; withSkillEvidence: number };
  skills: LearnerSkillStates;
  strengths: LearnerSkill[];
  needsPractice: LearnerSkill[];
  trainer: { sessionsStarted: number; sessionsCompleted: number; itemsSubmitted: number; lastActivityAt: string | null };
  recentActivity: LearnerActivityItem[];
};
export type LearnerProgress = {
  learner: { externalUserId: string; status: string };
  asOf: string;
  window: { from: string; to: string };
  summary: LearnerOutcomeSummary;
  mappingCoverage: { evaluatedResults: number; withSkillEvidence: number };
  skillStates: LearnerSkillStates;
  activityByDay: Array<{ date: string; evidenceCount: number }>;
  groupBy: LearnerGroupBy;
  dimensions: Array<LearnerSkill | LearnerDimensionGroup>;
  recentOutcomeTrend: Array<{ curriculum: LearnerCurriculum; trend: LearnerSkillTrend }>;
};

export type PublicTaskVersion = {
  id: string;
  taskId: string;
  version: number;
  taskType: string;
  status: string;
  content: { statement: string; title?: string; options?: Array<{ id: string; label: string }> };
  evaluationRule: string;
  publishedAt: string | null;
  createdAt: string;
};
export type PublishedTask = PublicTaskVersion;
export type TheoryBlock = { type: string; text?: string; items?: string[]; latex?: string };
export type TheoryMaterial = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: string;
  curriculum: { subjectId: string | null; courseId: string | null; topicId: string | null; skillId: string | null };
  taskIds: string[];
  version: { id: string; version: number; status: string; content: { blocks: TheoryBlock[] } };
};
export type TrainerSessionItem = {
  id: string;
  position: number;
  status: string;
  task: PublicTaskVersion;
  result: { outcome: string; isCorrect: boolean; score: number } | null;
};
export type TrainerSession = {
  id: string;
  status: string;
  progress: { completed: number; total: number };
  current: TrainerSessionItem | null;
  latestResult: { outcome: string; isCorrect: boolean; score: number } | null;
  canComplete: boolean;
  idempotentReplay: boolean;
};
export type TrainerTeacherSignal = { type: string; evidenceCount: number; recentOutcomes: string[] } | null;
export type TrainerSubmitResponse = {
  submitted: { result: { outcome: string; isCorrect: boolean; score: number; evaluationRule: string } };
  theory: TheoryMaterial[];
  teacherSignal: TrainerTeacherSignal;
  session: TrainerSession;
};

export type WhiteboardCreate = { id: string; currentRevision: number };
export type WhiteboardState = { id: string; revision: number; data: Record<string, unknown> | null };
export type WhiteboardSaveResult = { revision: number };

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
  health: () => request<HealthStatus>('health'),
  students: () => request<StudentRelationshipRow[]>('students').then((rows) => rows.map((row) => row.student)),
  results: (studentId: string) => request<AttemptResult[]>(`students/${studentId}/results`),
  task: (taskVersionId: string) => request<Task>(`tasks/published/${taskVersionId}`),
  learningState: (studentId: string, skillId: string) => request<LearningState>(`students/${studentId}/learning-state?skillId=${skillId}`),
  externalUsers: () => request<ExternalUser[]>('v1/external-users'),
  integration: () => request<Integration>('v1/integration'),
  knowledge: () => request<KnowledgeStatus[]>('v1/knowledge/status'),
  aiTraces: () => request<AiTrace[]>('v1/ai-requests'),
  remediation: (body: { externalUserId: string; attemptId: string; learnerQuestion?: string; idempotencyKey: string }) => request<RemediationResponse>('v1/remediations', { method: 'POST', body: JSON.stringify(body), headers: { 'x-request-id': crypto.randomUUID() } }),
  publishedTasks: (signal?: AbortSignal) => request<PublishedTask[]>('v1/assessment/tasks', { signal }),
  theoryMaterials: (signal?: AbortSignal) => request<TheoryMaterial[]>('v1/theory/materials', { signal }),
  trainerStart: (body: { idempotencyKey: string }, signal?: AbortSignal) => request<TrainerSession>('v1/trainer/sessions', { method: 'POST', body: JSON.stringify(body), signal }),
  trainerCurrent: (sessionId: string, signal?: AbortSignal) => request<TrainerSession>(`v1/trainer/sessions/${sessionId}/current`, { signal }),
  trainerSubmit: (sessionId: string, body: { itemId: string; idempotencyKey: string; answer: { optionId: string } }, signal?: AbortSignal) => request<TrainerSubmitResponse>(`v1/trainer/sessions/${sessionId}/submissions`, { method: 'POST', body: JSON.stringify(body), signal }),
  trainerNext: (sessionId: string, signal?: AbortSignal) => request<TrainerSession>(`v1/trainer/sessions/${sessionId}/next`, { method: 'POST', body: '{}', signal }),
  trainerComplete: (sessionId: string, signal?: AbortSignal) => request<TrainerSession>(`v1/trainer/sessions/${sessionId}/complete`, { method: 'POST', body: '{}', signal }),
  learnerProfile: (signal?: AbortSignal) => request<LearnerProfile>('v1/learner-intelligence/profile', { signal }),
  learnerProgress: (options?: { groupBy?: LearnerGroupBy; signal?: AbortSignal }) =>
    request<LearnerProgress>(`v1/learner-intelligence/progress?groupBy=${options?.groupBy ?? 'skill'}`, { signal: options?.signal }),
  whiteboardCreate: (title: string) =>
    request<WhiteboardCreate>('v1/whiteboards', { method: 'POST', body: JSON.stringify({ title }) }),
  whiteboardState: (boardId: string, signal?: AbortSignal) =>
    request<WhiteboardState>(`v1/whiteboards/${boardId}/state`, { signal }),
  whiteboardSave: (boardId: string, expectedRevision: number, data: Record<string, unknown>) =>
    request<WhiteboardSaveResult>(`v1/whiteboards/${boardId}/state`, {
      method: 'PUT',
      body: JSON.stringify({ expectedRevision, data }),
    }),
};
