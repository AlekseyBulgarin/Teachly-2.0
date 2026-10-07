import { developmentAuthEnabled, requiredEnvironment } from './config';

const base = { NODE_ENV: 'development', DEV_AUTH_ENABLED: 'true', DATABASE_URL: 'postgres://user:password@localhost:5432/teachly' };

describe('environment validation', () => {
  it('requires explicit safe configuration', () => {
    expect(() => requiredEnvironment(base)).not.toThrow();
    expect(() => requiredEnvironment({ ...base, NODE_ENV: undefined })).toThrow('NODE_ENV');
    expect(() => requiredEnvironment({ ...base, DEV_AUTH_ENABLED: undefined })).toThrow('DEV_AUTH_ENABLED');
    expect(() => requiredEnvironment({ ...base, DATABASE_URL: 'not-a-url' })).toThrow('DATABASE_URL');
  });

  it('rejects development authentication in production before startup', () => {
    expect(() => requiredEnvironment({ ...base, NODE_ENV: 'production' })).toThrow('cannot be enabled in production');
    expect(() => requiredEnvironment({
      ...base,
      NODE_ENV: 'production',
      DEV_AUTH_ENABLED: 'false',
      METRICS_TOKEN: 'test-metrics-token-at-least-32-characters',
    })).not.toThrow();
  });

  it('allows production to run with AI explicitly disabled', () => {
    expect(() => requiredEnvironment({
      ...base,
      NODE_ENV: 'production',
      DEV_AUTH_ENABLED: 'false',
      METRICS_TOKEN: 'test-metrics-token-at-least-32-characters',
      AI_PROVIDER: 'disabled',
    })).not.toThrow();
  });

  it('validates the selected AI provider without requiring a provider globally', () => {
    expect(() => requiredEnvironment({
      ...base,
      AI_PROVIDER: 'openai',
    })).toThrow('AI_API_KEY or OPENAI_API_KEY');
    expect(() => requiredEnvironment({
      ...base,
      AI_PROVIDER: 'openai-compatible',
      AI_API_KEY: 'test-provider-key',
    })).toThrow('AI_BASE_URL and AI_MODEL');
    expect(() => requiredEnvironment({
      ...base,
      AI_PROVIDER: 'openai-compatible',
      AI_API_KEY: 'test-provider-key',
      AI_BASE_URL: 'https://gateway.example.test/v1',
      AI_MODEL: 'provider-model',
    })).not.toThrow();
    expect(() => requiredEnvironment({
      ...base,
      NODE_ENV: 'production',
      DEV_AUTH_ENABLED: 'false',
      METRICS_TOKEN: 'test-metrics-token-at-least-32-characters',
      AI_PROVIDER: 'fake',
    })).toThrow('AI_PROVIDER=fake is not allowed in production');
  });

  it('requires a strong metrics token in production', () => {
    expect(() => requiredEnvironment({
      ...base,
      NODE_ENV: 'production',
      DEV_AUTH_ENABLED: 'false',
    })).toThrow('METRICS_TOKEN is required in production');
    expect(() => requiredEnvironment({ ...base, METRICS_TOKEN: 'too-short' })).toThrow('METRICS_TOKEN');
  });

  it('fails closed without an explicit environment', () => {
    const oldEnv = process.env.NODE_ENV;
    const oldFlag = process.env.DEV_AUTH_ENABLED;
    try {
      delete process.env.NODE_ENV;
      process.env.DEV_AUTH_ENABLED = 'true';
      expect(developmentAuthEnabled()).toBe(false);
    } finally {
      if (oldEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = oldEnv;
      if (oldFlag === undefined) delete process.env.DEV_AUTH_ENABLED;
      else process.env.DEV_AUTH_ENABLED = oldFlag;
    }
  });
});
