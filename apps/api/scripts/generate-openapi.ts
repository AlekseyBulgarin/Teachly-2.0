import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { createOpenApiDocument } from '../src/openapi';

const outputPath = resolve(__dirname, '../../../packages/contracts/openapi.json');
const checkOnly = process.argv.includes('--check');

function sortObjectKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObjectKeys);
  if (value === null || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, sortObjectKeys(child)]),
  );
}

async function generate(): Promise<void> {
  process.env.DATABASE_URL ??= 'postgresql://openapi:openapi@127.0.0.1:5432/openapi';
  process.env.NODE_ENV ??= 'test';
  process.env.DEV_AUTH_ENABLED ??= 'false';

  const app = await NestFactory.create(AppModule, { logger: false, abortOnError: false });
  try {
    const document = createOpenApiDocument(app);
    const next = `${JSON.stringify(sortObjectKeys(document), null, 2)}\n`;

    if (checkOnly) {
      const current = await readFile(outputPath, 'utf8').catch(() => '');
      if (current !== next) {
        throw new Error('OpenAPI artifact is stale. Run `pnpm contracts:generate`.');
      }
      return;
    }

    await writeFile(outputPath, next, 'utf8');
  } finally {
    await app.close();
  }
}

void generate().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
