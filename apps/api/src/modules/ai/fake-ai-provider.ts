import { Injectable } from '@nestjs/common';
import type { AiProvider, AiProviderRequest, AiProviderResponse } from './ai-provider';
import type { GroundedRemediationOutput } from './ai.types';

export type FakeAiProviderBehavior = {
  output?: unknown;
  error?: Error;
  usage?: AiProviderResponse['usage'];
};

@Injectable()
export class FakeAiProvider implements AiProvider {
  constructor(private readonly behavior: FakeAiProviderBehavior = {}) {}

  async complete(request: AiProviderRequest, signal: AbortSignal): Promise<AiProviderResponse> {
    if (signal.aborted) throw new Error('AI provider request aborted');
    if (this.behavior.error) throw this.behavior.error;
    const knowledgeReference = request.context.knowledge[0]?.chunkId;
    const output: GroundedRemediationOutput = this.behavior.output as GroundedRemediationOutput ?? {
      summary: 'The result suggests more practice is needed with this skill.',
      explanation: 'Review the task steps and compare the result with the approved learning material.',
      hint: 'Try the task again by checking one step at a time against the worked concept.',
      likelyGap: 'Applying the evaluated skill to this task format',
      evidenceRefs: [`result:${request.context.result.id}`],
      knowledgeRefs: knowledgeReference ? [`knowledge_chunk:${knowledgeReference}`] : [],
      confidence: knowledgeReference ? 0.6 : 0.35,
      abstained: false,
    };
    return {
      provider: 'fake',
      model: 'deterministic-v1',
      output,
      usage: this.behavior.usage ?? { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
    };
  }
}
