import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { and, eq } from 'drizzle-orm';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/http-exception.filter';
import { requestIdMiddleware } from '../src/common/request-id.middleware';
import { DatabaseService } from '../src/infrastructure/database/database';
import { apiKeys, auditEvents, integrations as integrationsTable } from '../src/infrastructure/database/schema';
import { IntegrationsService } from '../src/modules/integrations/integrations.service';
import { TenancyService } from '../src/modules/tenancy/tenancy.service';
import { resetTestDatabase, startTestApp, testDatabase } from './postgres-test';

jest.setTimeout(120_000);

describe('API key lifecycle (PostgreSQL)', () => {
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

  afterEach(async () => { await app?.close(); });

  async function tenantFixture(name: string) {
    const tenancy = app.get(TenancyService);
    const integrations = app.get(IntegrationsService);
    const organization = await tenancy.createOrganization(name);
    const workspace = await tenancy.createWorkspace(organization.id, 'Pilot workspace');
    const integration = await integrations.createIntegration(organization.id, workspace.id, 'Customer platform');
    const key = await integrations.createApiKey({
      organizationId: organization.id,
      workspaceId: workspace.id,
      integrationId: integration.id,
      name: 'Management key',
      scopes: ['integrations:read', 'integrations:write'],
    });
    const context = await integrations.authenticateApiKey(key.secret);
    if (!context) throw new Error('Fixture API key did not authenticate');
    return { organization, workspace, integration, key, context };
  }

  function auth(secret: string) {
    return { Authorization: `Bearer ${secret}` };
  }

  it('creates, lists, rotates, and revokes keys without exposing secrets', async () => {
    const fixture = await tenantFixture('Organization A');
    await request(app.getHttpServer()).post('/v1/integrations/api-keys').set(auth(fixture.key.secret))
      .send({ name: 'Invalid tenant override', scopes: ['external_users:read'], integrationId: fixture.integration.id }).expect(400);
    const created = await request(app.getHttpServer()).post('/v1/integrations/api-keys').set(auth(fixture.key.secret))
      .send({ name: 'Runtime key', scopes: ['external_users:read'] }).expect(201);
    expect(created.body.key).toMatchObject({ name: 'Runtime key', status: 'active', scopes: ['external_users:read'] });
    expect(created.body.secret).toMatch(/^tlk_[a-f0-9]{16}\.[A-Za-z0-9_-]+$/);
    expect(created.body.key).not.toHaveProperty('keyHash');
    expect(created.body.key).not.toHaveProperty('secret');

    const stored = await database.db.select().from(apiKeys).where(eq(apiKeys.id, created.body.key.id));
    expect(stored[0]?.keyHash).not.toContain(created.body.secret);
    expect(await app.get(IntegrationsService).authenticateApiKey(created.body.secret)).not.toBeNull();

    const listed = await request(app.getHttpServer()).get('/v1/integrations/api-keys').set(auth(fixture.key.secret)).expect(200);
    expect(listed.body).toHaveLength(2);
    expect(listed.body.find((key: { id: string }) => key.id === created.body.key.id)).toMatchObject({ status: 'active' });
    expect(JSON.stringify(listed.body)).not.toContain(created.body.secret);
    expect(JSON.stringify(listed.body)).not.toContain(stored[0]?.keyHash);

    const rotated = await request(app.getHttpServer())
      .post(`/v1/integrations/api-keys/${created.body.key.id}/rotate`).set(auth(fixture.key.secret)).expect(201);
    expect(rotated.body.key.id).not.toBe(created.body.key.id);
    expect(rotated.body.secret).not.toBe(created.body.secret);
    expect(await app.get(IntegrationsService).authenticateApiKey(created.body.secret)).toBeNull();
    expect(await app.get(IntegrationsService).authenticateApiKey(rotated.body.secret)).not.toBeNull();

    const oldRow = await database.db.select().from(apiKeys).where(eq(apiKeys.id, created.body.key.id));
    expect(oldRow[0]?.status).toBe('revoked');
    expect(oldRow[0]?.revokedAt).not.toBeNull();

    const revoked = await request(app.getHttpServer())
      .post(`/v1/integrations/api-keys/${rotated.body.key.id}/revoke`).set(auth(fixture.key.secret)).expect(200);
    expect(revoked.body).toMatchObject({ id: rotated.body.key.id, status: 'revoked' });
    expect(await app.get(IntegrationsService).authenticateApiKey(rotated.body.secret)).toBeNull();
    await request(app.getHttpServer())
      .post(`/v1/integrations/api-keys/${rotated.body.key.id}/rotate`).set(auth(fixture.key.secret)).expect(404);

    const audits = await database.db.select().from(auditEvents).where(and(
      eq(auditEvents.resourceType, 'api_key'),
      eq(auditEvents.workspaceId, fixture.workspace.id),
    ));
    expect(audits.map((audit) => audit.action)).toEqual(expect.arrayContaining([
      'api_key_created', 'api_key_rotated', 'api_key_revoked',
    ]));
    for (const audit of audits) {
      const serialized = JSON.stringify(audit.metadata);
      expect(serialized).not.toContain(created.body.secret);
      expect(serialized).not.toContain(rotated.body.secret);
      expect(serialized).not.toContain(stored[0]?.keyHash);
    }
  });

  it('enforces scopes and exact tenant/integration ownership', async () => {
    const fixture = await tenantFixture('Organization A');
    const foreign = await tenantFixture('Organization B');
    const readOnly = await app.get(IntegrationsService).createApiKey({
      organizationId: fixture.organization.id,
      workspaceId: fixture.workspace.id,
      integrationId: fixture.integration.id,
      name: 'Read-only key',
      scopes: ['integrations:read'],
    });

    await request(app.getHttpServer()).get('/v1/integrations/api-keys').set(auth(readOnly.secret)).expect(200);
    await request(app.getHttpServer()).post('/v1/integrations/api-keys').set(auth(readOnly.secret))
      .send({ name: 'Denied', scopes: ['external_users:read'] }).expect(403);
    await request(app.getHttpServer()).post(`/v1/integrations/api-keys/${fixture.key.id}/revoke`).set(auth(readOnly.secret)).expect(403);
    await request(app.getHttpServer()).post(`/v1/integrations/api-keys/${fixture.key.id}/rotate`).set(auth(readOnly.secret)).expect(403);

    const foreignId = foreign.key.id;
    const foreignRevoke = await request(app.getHttpServer())
      .post(`/v1/integrations/api-keys/${foreignId}/revoke`).set(auth(fixture.key.secret)).expect(404);
    const unknownRevoke = await request(app.getHttpServer())
      .post('/v1/integrations/api-keys/00000000-0000-4000-8000-000000000999/revoke')
      .set(auth(fixture.key.secret)).expect(404);
    expect(foreignRevoke.body.code).toBe(unknownRevoke.body.code);
    expect(foreignRevoke.body.message).toBe(unknownRevoke.body.message);
    const foreignRotate = await request(app.getHttpServer())
      .post(`/v1/integrations/api-keys/${foreignId}/rotate`).set(auth(fixture.key.secret)).expect(404);
    const unknownRotate = await request(app.getHttpServer())
      .post('/v1/integrations/api-keys/00000000-0000-4000-8000-000000000999/rotate')
      .set(auth(fixture.key.secret)).expect(404);
    expect(foreignRotate.body.code).toBe(unknownRotate.body.code);
    expect(foreignRotate.body.message).toBe(unknownRotate.body.message);
    expect((await request(app.getHttpServer()).get('/v1/integrations/api-keys').set(auth(fixture.key.secret))).body)
      .not.toEqual(expect.arrayContaining([expect.objectContaining({ id: foreignId })]));
  });

  it('fails closed for inactive integrations and rejects invalid payloads', async () => {
    const fixture = await tenantFixture('Organization A');
    await request(app.getHttpServer()).post('/v1/integrations/api-keys').set(auth(fixture.key.secret))
      .send({ name: '', scopes: [] }).expect(400);

    await database.db.update(integrationsTable).set({ status: 'disabled' })
      .where(eq(integrationsTable.id, fixture.integration.id));
    await request(app.getHttpServer()).get('/v1/integrations/api-keys').set(auth(fixture.key.secret)).expect(401);
  });
});
