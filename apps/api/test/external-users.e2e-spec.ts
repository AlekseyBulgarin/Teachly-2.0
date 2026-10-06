import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/http-exception.filter';
import { requestIdMiddleware } from '../src/common/request-id.middleware';
import { DatabaseService } from '../src/infrastructure/database/database';
import { IntegrationsService } from '../src/modules/integrations/integrations.service';
import { TenancyService } from '../src/modules/tenancy/tenancy.service';
import { resetTestDatabase, startTestApp, testDatabase } from './postgres-test';

jest.setTimeout(120_000);

describe('B2B external users API (PostgreSQL)', () => {
  let app: INestApplication;
  let database: ReturnType<typeof testDatabase>;

  beforeEach(async () => {
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

  afterEach(async () => {
    await app?.close();
  });

  async function createTenant(name: string) {
    const tenancy = app.get(TenancyService);
    const integrations = app.get(IntegrationsService);
    const organization = await tenancy.createOrganization(name);
    const workspace = await tenancy.createWorkspace(organization.id, 'Workspace');
    const integration = await integrations.createIntegration(organization.id, workspace.id, 'Customer platform');
    const key = await integrations.createApiKey({
      organizationId: organization.id,
      workspaceId: workspace.id,
      integrationId: integration.id,
      name: 'Integration key',
      scopes: ['external_users:read', 'external_users:write'],
    });
    return { organization, workspace, integration, key };
  }

  it('uses API-key tenant context and rejects client-supplied tenant overrides', async () => {
    const fixture = await createTenant('Organization A');
    const other = await createTenant('Organization B');
    const auth = { Authorization: `Bearer ${fixture.key.secret}` };

    await request(app.getHttpServer()).post('/v1/external-users').send({ externalUserId: 'learner-unauthenticated' }).expect(401);
    await request(app.getHttpServer()).post('/v1/external-users').set(auth).send({
      externalUserId: 'learner-42',
      organizationId: other.organization.id,
      workspaceId: other.workspace.id,
    }).expect(400);

    const created = await request(app.getHttpServer()).post('/v1/external-users').set(auth)
      .send({ externalUserId: 'learner-42' }).expect(201);
    expect(created.body).toMatchObject({
      organizationId: fixture.organization.id,
      workspaceId: fixture.workspace.id,
      integrationId: fixture.integration.id,
      externalUserId: 'learner-42',
      status: 'active',
    });
    const replay = await request(app.getHttpServer()).post('/v1/external-users').set(auth)
      .send({ externalUserId: 'learner-42' }).expect(201);
    expect(replay.body.id).toBe(created.body.id);

    await request(app.getHttpServer()).post('/v1/external-users').set(auth)
      .send({ externalUserId: 'learner-43' }).expect(201);
    const bounded = await request(app.getHttpServer()).get('/v1/external-users')
      .set(auth).query({ limit: 1 }).expect(200);
    expect(bounded.body).toHaveLength(1);
    await request(app.getHttpServer()).get('/v1/external-users')
      .set(auth).query({ limit: 101 }).expect(400);
    await request(app.getHttpServer()).get('/v1/knowledge/status')
      .set(auth).query({ limit: 101 }).expect(400);

    await request(app.getHttpServer()).get(`/v1/external-users/${created.body.id}`).set(auth).expect(200);
    const otherAuth = { Authorization: `Bearer ${other.key.secret}` };
    await request(app.getHttpServer()).get(`/v1/external-users/${created.body.id}`).set(otherAuth).expect(404);
  });

  it('fails closed on every current machine route without tenant authentication', async () => {
    await request(app.getHttpServer()).get('/v1/integration').expect(401);
    await request(app.getHttpServer()).get('/v1/external-users').expect(401);
    await request(app.getHttpServer()).get('/v1/knowledge/status').expect(401);
    await request(app.getHttpServer()).get('/v1/ai-requests').expect(401);
    await request(app.getHttpServer()).post('/v1/remediations').send({}).expect(401);
  });

  it('rejects unknown, revoked, and insufficient-scope API keys', async () => {
    const fixture = await createTenant('Organization A');
    const integrations = app.get(IntegrationsService);
    const readOnly = await integrations.createApiKey({
      organizationId: fixture.organization.id,
      workspaceId: fixture.workspace.id,
      integrationId: fixture.integration.id,
      name: 'Read-only key',
      scopes: ['external_users:read'],
    });

    await request(app.getHttpServer()).post('/v1/external-users')
      .set('Authorization', 'Bearer tlk_0000000000000000.invalid')
      .send({ externalUserId: 'learner-unknown' }).expect(401);
    await request(app.getHttpServer()).post('/v1/external-users').set('Authorization', `Bearer ${readOnly.secret}`)
      .send({ externalUserId: 'learner-read-only' }).expect(403);

    const context = await integrations.authenticateApiKey(fixture.key.secret);
    if (!context) throw new Error('Fixture API key did not authenticate');
    await integrations.revokeApiKey(context, fixture.key.id);
    await request(app.getHttpServer()).post('/v1/external-users').set('Authorization', `Bearer ${fixture.key.secret}`)
      .send({ externalUserId: 'learner-revoked' }).expect(401);
  });
});
