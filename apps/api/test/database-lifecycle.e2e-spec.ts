import request from 'supertest';
import { Test } from '@nestjs/testing';
import { NestApplication } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { configureHttpApp } from '../src/common/configure-http-app';
import { DatabaseService } from '../src/infrastructure/database/database';
import { MetricsService } from '../src/infrastructure/observability/metrics.service';
import { resetTestDatabase, startTestApp, testDatabase } from './postgres-test';
import { TenancyService } from '../src/modules/tenancy/tenancy.service';

jest.setTimeout(120_000);

describe('PostgreSQL E2E lifecycle', () => {
  let app: NestApplication;
  let database: ReturnType<typeof testDatabase>;
  const metricsToken = 'test-metrics-token-at-least-32-characters';
  const previousMetricsToken = process.env.METRICS_TOKEN;

  beforeAll(async () => {
    database = testDatabase();
    await resetTestDatabase(database);
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DatabaseService).useValue(database)
      .compile();
    app = moduleRef.createNestApplication<NestApplication>();
    process.env.METRICS_TOKEN = metricsToken;
    configureHttpApp(app, app.get(MetricsService));
    await app.init();
    await startTestApp(app);
  });

  afterAll(async () => {
    await app?.close();
    if (previousMetricsToken === undefined) delete process.env.METRICS_TOKEN;
    else process.env.METRICS_TOKEN = previousMetricsToken;
  });

  it('survives DB-backed requests across an HTTP validation error', async () => {
    await database.ping();
    const organization = await app.get(TenancyService).createOrganization('Lifecycle organization');
    await app.get(TenancyService).createWorkspace(organization.id, 'Lifecycle workspace');
    await request(app.getHttpServer()).get('/health').expect(200, { status: 'ok', database: 'ok' });
    await request(app.getHttpServer()).get('/health/live').expect(200, { status: 'ok' });
    await request(app.getHttpServer()).get('/health/ready').expect(200, { status: 'ok', database: 'ok' });
    await request(app.getHttpServer()).get('/metrics').expect(401);
    const metrics = await request(app.getHttpServer()).get('/metrics').set('Authorization', `Bearer ${metricsToken}`).expect(200);
    expect(metrics.headers['content-type']).toContain('text/plain');
    expect(metrics.text).toContain('teachly_http_requests_total');
    await request(app.getHttpServer()).post('/v1/assessment/variants').send({ items: [{ position: -1 }] }).expect(401);
    await request(app.getHttpServer()).get('/health').expect(200, { status: 'ok', database: 'ok' });
    await database.ping();
  });
});
