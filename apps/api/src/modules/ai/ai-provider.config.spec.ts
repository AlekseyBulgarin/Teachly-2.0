import { resolveAiProviderConfiguration } from './ai-provider.config';

describe('AI provider configuration', () => {
  it('stays disabled when no key or provider is configured', () => {
    expect(resolveAiProviderConfiguration({})).toMatchObject({
      mode: 'disabled',
      configured: false,
      model: null,
    });
  });

  it('uses OpenAI by default when a legacy or generic key is added', () => {
    expect(resolveAiProviderConfiguration({ AI_API_KEY: 'test-key' })).toMatchObject({
      mode: 'openai',
      configured: true,
      providerName: 'openai',
      model: 'gpt-4o-mini',
      apiMode: 'responses',
    });
  });

  it('supports an explicitly named OpenAI-compatible endpoint', () => {
    expect(resolveAiProviderConfiguration({
      AI_PROVIDER: 'openai-compatible',
      AI_PROVIDER_NAME: 'example-gateway',
      AI_API_KEY: 'test-key',
      AI_BASE_URL: 'https://gateway.example.test/v1',
      AI_MODEL: 'example-model',
    })).toMatchObject({
      mode: 'openai-compatible',
      providerName: 'example-gateway',
      configured: true,
      apiMode: 'chat_completions',
    });
  });
});
