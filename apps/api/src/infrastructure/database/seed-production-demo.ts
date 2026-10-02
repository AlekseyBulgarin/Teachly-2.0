import 'dotenv/config';
import { requiredEnvironment } from '../../common/config';
import { DatabaseService } from './database';
import { seedProductionDemoFixtures } from './seed';

if (require.main === module) {
  void (async () => {
    if (process.env.DATABASE_URL_UNPOOLED) {
      process.env.DATABASE_URL = process.env.DATABASE_URL_UNPOOLED;
    }
    requiredEnvironment();
    const database = new DatabaseService();
    try {
      await seedProductionDemoFixtures(database);
    } finally {
      await database.onModuleDestroy();
    }
  })().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
