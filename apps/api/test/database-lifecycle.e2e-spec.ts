import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/http-exception.filter';
import { requestIdMiddleware } from '../src/common/request-id.middleware';
import { DatabaseService } from '../src/infrastructure/database/database';
import { resetTestDatabase, startTestApp, testDatabase } from './postgres-test';
import { TenancyService } from '../src/modules/tenancy/tenancy.service';

jest.setTimeout(120_000);

describe('PostgreSQL E2E lifecycle', () => {
  let app: INestApplication;
  let database: ReturnType<typeof testDatabase>;

  beforeAll(async () => {
    database = testDatabase();
    await resetTestDatabase(database);
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DatabaseService).useValue(database)
      .compile();
    app = moduleRef.createNestApplication();
    app.use(requestIdMiddleware);
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
    await startTestApp(app);
  });

  afterAll(async () => {
    await app?.close();
  });

  it('survives DB-backed requests across an HTTP validation error', async () => {
    await database.ping();
    const organization = await app.get(TenancyService).createOrganization('Lifecycle organization');
    await app.get(TenancyService).createWorkspace(organization.id, 'Lifecycle workspace');
    await request(app.getHttpServer()).get('/health').expect(200, { status: 'ok', database: 'ok' });
    await request(app.getHttpServer()).post('/v1/assessment/variants').send({ items: [{ position: -1 }] }).expect(401);
    await request(app.getHttpServer()).get('/health').expect(200, { status: 'ok', database: 'ok' });
    await database.ping();
  });
});
