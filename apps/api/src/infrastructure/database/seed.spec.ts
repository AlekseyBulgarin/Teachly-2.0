import { seedProductionDemoFixtures, demoApiKey } from './seed';
import type { DatabaseService } from './database';

describe('production demo seed guard', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it('rejects use outside production', async () => {
    process.env.NODE_ENV = 'development';
    process.env.DEV_AUTH_ENABLED = 'true';
    await expect(seedProductionDemoFixtures({} as DatabaseService)).rejects.toThrow(
      'NODE_ENV=production',
    );
  });

  it('requires the explicit production seed gate', async () => {
    process.env.NODE_ENV = 'production';
    process.env.DEV_AUTH_ENABLED = 'false';
    process.env.TEACHLY_DEMO_SEED_ENABLED = 'false';
    await expect(seedProductionDemoFixtures({} as DatabaseService)).rejects.toThrow(
      'TEACHLY_DEMO_SEED_ENABLED=true',
    );
  });

  it('rejects the known development key', async () => {
    process.env.NODE_ENV = 'production';
    process.env.DEV_AUTH_ENABLED = 'false';
    process.env.TEACHLY_DEMO_SEED_ENABLED = 'true';
    process.env.TEACHLY_DEMO_API_KEY = demoApiKey;
    await expect(seedProductionDemoFixtures({} as DatabaseService)).rejects.toThrow(
      'non-development Teachly API key',
    );
  });
});
