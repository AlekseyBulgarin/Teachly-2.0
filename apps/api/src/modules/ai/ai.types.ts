import type { TenantContext } from '../core/core.types';

export const AI_CAPABILITIES = ['grounded_remediation'] as const;
export type AiCapability = typeof AI_CAPABILITIES[number];

export type AiContextReference = { type: string; id: string };

export type GroundedRemediationOutput = {
  summary: string;
  explanation: string;
  hint: string;
  likelyGap: string | null;
  evidenceRefs: string[];
  knowledgeRefs: string[];
  confidence: number;
  abstained: boolean;
};

export type AiContext = {
  capability: AiCapability;
  learnerRequest: string;
  task: {
    taskVersionId: string;
    version: number;
    taskType: string;
    statement: string;
    options: Array<{ id: string; label: string }>;
    evaluationRule: string;
    subject: string;
    course: string;
    topic: string;
    skill: string;
  };
  attempt: {
    id: string;
    status: string;
    startedAt: Date;
    submittedAt: Date | null;
  };
  result: {
    id: string;
    submissionId: string;
    outcome: string;
    isCorrect: boolean;
    score: number;
    evaluatedAt: Date;
  };
  learningState: {
    status: string;
    evidenceCount: number;
    recentOutcomes: string[];
    explanation: { reason: string; evidenceReferences: string[] };
  };
  knowledge: Array<{
    chunkId: string;
    documentVersionId: string;
    content: string;
    section: string | null;
    sourceName: string;
  }>;
  contextReferences: AiContextReference[];
};

export type AiExecutionInput = {
  context: TenantContext;
  learnerId: string;
  attemptId: string;
  capability: AiCapability;
  learnerRequest: string;
  idempotencyKey: string;
};

export type AiExecutionResult = {
  requestId: string;
  status: 'succeeded';
  provider: string;
  model: string;
  output: GroundedRemediationOutput;
  usage: AiProviderUsage | null;
  replayed: boolean;
};

export type AiProviderUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  estimatedCostMicros?: number;
};
