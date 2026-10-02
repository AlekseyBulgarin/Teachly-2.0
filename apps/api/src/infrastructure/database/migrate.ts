import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { resolve } from 'node:path';
import '../../common/config';
import { DatabaseService } from './database';

export async function applyMigrations(database: DatabaseService): Promise<void> {
  await migrate(database.db, { migrationsFolder: resolve(__dirname, '../../../../../database/migrations') });
}

if (require.main === module) {
  void (async () => {
    if (process.env.DATABASE_URL_UNPOOLED) {
      process.env.DATABASE_URL = process.env.DATABASE_URL_UNPOOLED;
    }
    const database = new DatabaseService();
    try { await applyMigrations(database); }
    finally { await database.onModuleDestroy(); }
  })().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
}
