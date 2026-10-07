export const AI_PROVIDER_MODES = ['disabled', 'openai', 'openai-compatible', 'fake'] as const;
export type AiProviderMode = typeof AI_PROVIDER_MODES[number];

export type AiProviderConfiguration = {
  mode: AiProviderMode;
  providerName: string;
  model: string | null;
  apiKey: string | null;
  baseUrl: string | null;
  apiMode: 'responses' | 'chat_completions';
  configured: boolean;
};

const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';

export function resolveAiProviderConfiguration(
  env: NodeJS.ProcessEnv = process.env,
): AiProviderConfiguration {
  const explicitMode = env.AI_PROVIDER?.trim().toLowerCase();
  const apiKey = env.AI_API_KEY?.trim() || env.OPENAI_API_KEY?.trim() || null;
  const mode = isAiProviderMode(explicitMode)
    ? explicitMode
    : apiKey
      ? 'openai'
      : 'disabled';
  const compatible = mode === 'openai-compatible';
  const model = env.AI_MODEL?.trim() || (mode === 'openai' ? DEFAULT_OPENAI_MODEL : null);
  const baseUrl = env.AI_BASE_URL?.trim() || null;
  const apiMode = env.AI_API_MODE === 'chat_completions' || compatible
    ? 'chat_completions'
    : 'responses';
  const providerName = env.AI_PROVIDER_NAME?.trim()
    || (mode === 'openai-compatible' ? 'openai-compatible' : mode);

  return {
    mode,
    providerName,
    model,
    apiKey,
    baseUrl,
    apiMode,
    configured: mode === 'fake'
      || (mode === 'openai' && Boolean(apiKey && model))
      || (mode === 'openai-compatible' && Boolean(apiKey && model && baseUrl)),
  };
}

function isAiProviderMode(value: string | undefined): value is AiProviderMode {
  return AI_PROVIDER_MODES.includes(value as AiProviderMode);
}
