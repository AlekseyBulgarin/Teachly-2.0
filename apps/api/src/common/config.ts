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
  });
  const errors = validateSync(config, { skipMissingProperties: false });
  if (errors.length > 0) throw new Error(`Invalid environment: ${errors.map((error) => error.property).join(', ')}`);
  if (env.DEV_AUTH_ENABLED === 'true' && env.NODE_ENV === 'production') throw new Error('Development authentication cannot be enabled in production');
  if (env.NODE_ENV === 'production' && !env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is required in production');
  if (env.NODE_ENV === 'production' && !env.METRICS_TOKEN) throw new Error('METRICS_TOKEN is required in production');
  try {
    const url = new URL(config.DATABASE_URL);
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname || !url.pathname.slice(1)) throw new Error();
  } catch {
    throw new Error('DATABASE_URL must be a PostgreSQL connection URL');
  }
  if (config.PORT !== undefined && (Number(config.PORT) < 1 || Number(config.PORT) > 65535)) throw new Error('PORT must be between 1 and 65535');
}
