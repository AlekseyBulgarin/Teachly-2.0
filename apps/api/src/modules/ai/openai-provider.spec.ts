import type { AiProviderRequest } from './ai-provider';
import { buildGroundedRemediationInput, groundedRemediationInstructions } from './openai-provider';

const request: AiProviderRequest = {
  capability: 'grounded_remediation',
  policyVersion: 'policy.v1',
  promptVersion: 'prompt.v1',
  context: {
    capability: 'grounded_remediation',
    learnerRequest: 'Explain the gap',
    task: {
      taskVersionId: 'task-version-1', version: 1, taskType: 'single_choice', statement: 'Question',
      options: [], evaluationRule: 'exact', subject: 'Math', course: 'Demo', topic: 'Topic', skill: 'Skill',
    },
    attempt: { id: 'attempt-1', status: 'completed', startedAt: new Date(0), submittedAt: new Date(1) },
    result: { id: 'result-1', submissionId: 'submission-1', outcome: 'incorrect', isCorrect: false, score: 0, evaluatedAt: new Date(2) },
    learningState: { status: 'needs_support', evidenceCount: 1, recentOutcomes: ['incorrect'], explanation: { reason: 'Recent error', evidenceReferences: [] } },
    knowledge: [{ chunkId: 'chunk-1', documentVersionId: 'document-version-1', content: 'Approved guidance', section: null, sourceName: 'Manual' }],
    contextReferences: [
      { type: 'attempt', id: 'attempt-1' },
      { type: 'result', id: 'result-1' },
      { type: 'knowledge_chunk', id: 'chunk-1' },
    ],
  },
};

describe('OpenAI-compatible grounded remediation prompt', () => {
  it('publishes exact allowed reference strings for provider-neutral validation', () => {
    const input = buildGroundedRemediationInput(request);

    expect(input).toContain('"evidenceRefs":["attempt:attempt-1","result:result-1","knowledge_chunk:chunk-1"]');
    expect(input).toContain('"knowledgeRefs":["knowledge_chunk:chunk-1"]');
    expect(input).toContain('Copy reference values exactly from allowed_reference_values.');
  });

  it('requires exact citations or an explicit abstention', () => {
    const instructions = groundedRemediationInstructions(request);

    expect(instructions).toContain('Never invent, shorten, or reformat an id.');
    expect(instructions).toContain('cite at least one allowed value');
    expect(instructions).toContain('abstained=true, confidence=0');
  });
});
