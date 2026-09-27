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

export class AiProviderError extends Error {
  constructor(
    public readonly category: 'configuration' | 'rate_limit' | 'unavailable' | 'request',
    message: string,
  ) {
    super(message);
  }
}

export interface AiProvider {
  complete(request: AiProviderRequest, signal: AbortSignal): Promise<AiProviderResponse>;
}
