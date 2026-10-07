import type { AiCapability, AiContext, AiProviderUsage } from './ai.types';

export const AI_PROVIDER = Symbol('AI_PROVIDER');

export type AiProviderRequest = {
  capability: AiCapability;
  context: AiContext;
  policyVersion: string;
  promptVersion: string;
};

export type AiProviderResponse = {
  provider: string;
  model: string;
  output: unknown;
  usage?: AiProviderUsage;
};

export type AiProviderStatus = {
  configured: boolean;
  provider: string;
  model: string | null;
  apiMode: 'responses' | 'chat_completions' | null;
};

export class AiProviderError extends Error {
  constructor(
    public readonly category: 'configuration' | 'rate_limit' | 'unavailable' | 'request',
    message: string,
  ) {
    super(message);
  }
}

export interface AiProvider {
  status(): AiProviderStatus;
  complete(request: AiProviderRequest, signal: AbortSignal): Promise<AiProviderResponse>;
}
