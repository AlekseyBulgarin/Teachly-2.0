import { config as loadDotenv } from 'dotenv';
import { plainToInstance } from 'class-transformer';
import { IsIn, IsNotEmpty, IsOptional, IsString, Matches, MinLength, validateSync } from 'class-validator';
import { resolve } from 'node:path';

loadDotenv({
  path: [
    resolve(process.cwd(), '.env.local'),
    resolve(process.cwd(), '.env'),
    resolve(__dirname, '../../../../.env.local'),
    resolve(__dirname, '../../../../.env'),
  ],
});

class EnvironmentSchema {
  @IsIn(['development', 'test', 'production'])
  NODE_ENV!: string;

  @IsIn(['true', 'false'])
  DEV_AUTH_ENABLED!: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsOptional()
  @Matches(/^\d+$/)
  PORT?: string;

  @IsOptional()
  @IsString()
  @MinLength(32)
  METRICS_TOKEN?: string;

  @IsOptional()
  @IsIn(['disabled', 'openai', 'openai-compatible', 'fake'])
  AI_PROVIDER?: string;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function developmentAuthEnabled(): boolean {
  return (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') && process.env.DEV_AUTH_ENABLED === 'true';
}

export function requiredEnvironment(env: NodeJS.ProcessEnv = process.env): void {
  const config = plainToInstance(EnvironmentSchema, {
    NODE_ENV: env.NODE_ENV, DEV_AUTH_ENABLED: env.DEV_AUTH_ENABLED,
    DATABASE_URL: env.DATABASE_URL, PORT: env.PORT, METRICS_TOKEN: env.METRICS_TOKEN,
    AI_PROVIDER: env.AI_PROVIDER,
  });
  const errors = validateSync(config, { skipMissingProperties: false });
  if (errors.length > 0) throw new Error(`Invalid environment: ${errors.map((error) => error.property).join(', ')}`);
  if (env.DEV_AUTH_ENABLED === 'true' && env.NODE_ENV === 'production') throw new Error('Development authentication cannot be enabled in production');
  if (env.NODE_ENV === 'production' && !env.METRICS_TOKEN) throw new Error('METRICS_TOKEN is required in production');
  const aiProvider = env.AI_PROVIDER?.trim() || (env.AI_API_KEY || env.OPENAI_API_KEY ? 'openai' : 'disabled');
  const aiApiKey = env.AI_API_KEY?.trim() || env.OPENAI_API_KEY?.trim();
  if (env.NODE_ENV === 'production' && aiProvider === 'fake') throw new Error('AI_PROVIDER=fake is not allowed in production');
  if ((aiProvider === 'openai' || aiProvider === 'openai-compatible') && !aiApiKey) {
    throw new Error('AI_API_KEY or OPENAI_API_KEY is required for the selected AI provider');
  }
  if (aiProvider === 'openai-compatible' && (!env.AI_BASE_URL?.trim() || !env.AI_MODEL?.trim())) {
    throw new Error('AI_BASE_URL and AI_MODEL are required for an OpenAI-compatible provider');
  }
  if (env.AI_BASE_URL) {
    try {
      const aiUrl = new URL(env.AI_BASE_URL);
      if (!['http:', 'https:'].includes(aiUrl.protocol)) throw new Error();
      if (env.NODE_ENV === 'production' && aiUrl.protocol !== 'https:') throw new Error();
    } catch {
      throw new Error('AI_BASE_URL must be a valid HTTPS URL in production');
    }
  }
  try {
    const url = new URL(config.DATABASE_URL);
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname || !url.pathname.slice(1)) throw new Error();
  } catch {
    throw new Error('DATABASE_URL must be a PostgreSQL connection URL');
  }
  if (config.PORT !== undefined && (Number(config.PORT) < 1 || Number(config.PORT) > 65535)) throw new Error('PORT must be between 1 and 65535');
}
