import { Injectable } from '@nestjs/common';
import { AiProviderError, type AiProvider, type AiProviderRequest, type AiProviderResponse } from './ai-provider';

@Injectable()
export class DisabledAiProvider implements AiProvider {
  status() {
    return {
      configured: false,
      provider: 'disabled',
      model: null,
      apiMode: null,
    } as const;
  }

  async complete(_request: AiProviderRequest, _signal: AbortSignal): Promise<AiProviderResponse> {
    throw new AiProviderError('configuration', 'AI provider is not configured');
  }
}
