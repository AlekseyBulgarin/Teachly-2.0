import { DatabaseService } from '../src/infrastructure/database/database';
import { applyMigrations } from '../src/infrastructure/database/migrate';
import { seedDevelopmentFixtures } from '../src/infrastructure/database/seed';

export function testDatabase(): DatabaseService {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error('TEST_DATABASE_URL is required for PostgreSQL integration/e2e tests');
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
