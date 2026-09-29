import { DatabaseService } from '../src/infrastructure/database/database';
import { applyMigrations } from '../src/infrastructure/database/migrate';
import { seedDevelopmentFixtures } from '../src/infrastructure/database/seed';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { INestApplication } from '@nestjs/common';

const statePath = join(tmpdir(), 'teachly-api-e2e-postgres.json');

function readTestDatabaseUrl(): string {
  if (!process.env.JEST_WORKER_ID) throw new Error('PostgreSQL tests must run under the configured Jest PostgreSQL lifecycle');
  let state: { user: string; password: string; port: number; database: string };
  try {
    state = JSON.parse(readFileSync(statePath, 'utf8')) as typeof state;
  } catch {
    throw new Error('Embedded PostgreSQL is not running. Use the PostgreSQL Jest config for database tests.');
  }
  const url = `postgresql://${encodeURIComponent(state.user)}:${encodeURIComponent(state.password)}@127.0.0.1:${state.port}/${state.database}`;
  process.env.TEST_DATABASE_URL = url;
  return url;
}

export function testDatabase(): DatabaseService {
  const url = readTestDatabaseUrl();
  if (process.env.ALLOW_TEST_DB_RESET !== 'true') {
    throw new Error('Database reset requires ALLOW_TEST_DB_RESET=true');
  }
  process.env.DATABASE_URL = url;
  process.env.NODE_ENV = 'test';
  process.env.DEV_AUTH_ENABLED = 'true';
  return new DatabaseService();
}

export async function resetTestDatabase(database: DatabaseService): Promise<void> {
  // Drizzle stores its migration journal outside public by default.
  await database.pool.query('DROP SCHEMA IF EXISTS drizzle CASCADE');
  await database.pool.query('DROP SCHEMA IF EXISTS public CASCADE');
  await database.pool.query('CREATE SCHEMA public');
  await applyMigrations(database);
  await seedDevelopmentFixtures(database, { includeDemoRecords: false });
}

export async function startTestApp(app: INestApplication): Promise<void> {
  await app.listen(0, '127.0.0.1');
}
