import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/http-exception.filter';
import { DatabaseService } from '../src/infrastructure/database/database';
import { fixtureIds } from '../src/infrastructure/database/seed';
import { teacherStudentRelationships } from '../src/infrastructure/database/schema';
import { AttemptsService } from '../src/modules/attempts/attempts.service';
import { AI_PROVIDER } from '../src/modules/ai/ai-provider';
import { FakeAiProvider } from '../src/modules/ai/fake-ai-provider';
import { ExternalUsersService } from '../src/modules/external-users/external-users.service';
import { IntegrationsService } from '../src/modules/integrations/integrations.service';
import type { TenantContext } from '../src/modules/core/core.types';
import { TeachingService } from '../src/modules/teaching/teaching.service';
import { TenancyService } from '../src/modules/tenancy/tenancy.service';
import { requestIdMiddleware } from '../src/common/request-id.middleware';
import { resetTestDatabase, startTestApp, testDatabase } from './postgres-test';

jest.setTimeout(240_000);

describe('Partner grounded remediation API (PostgreSQL)', () => {
  let app: INestApplication;
  let database: DatabaseService;
  let fakeProvider: FakeAiProvider;

  beforeEach(async () => {
    database = testDatabase();
    await resetTestDatabase(database);
    fakeProvider = new FakeAiProvider();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DatabaseService).useValue(database)
      .overrideProvider(AI_PROVIDER)
      .useValue(fakeProvider)
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

  async function createKey(
    organizationId = fixtureIds.organization,
    workspaceId = fixtureIds.workspace,
    name = 'Partner key',
  ) {
    const integrations = app.get(IntegrationsService);
    const organization = organizationId === fixtureIds.organization
      ? { id: fixtureIds.organization }
      : await app.get(TenancyService).createOrganization(name);
    const workspace = workspaceId === fixtureIds.workspace
      ? { id: fixtureIds.workspace }
      : await app.get(TenancyService).createWorkspace(organization.id, `${name} workspace`);
    const integration = await integrations.createIntegration(organization.id, workspace.id, name);
    const key = await integrations.createApiKey({
      organizationId: organization.id,
      workspaceId: workspace.id,
      integrationId: integration.id,
      name,
      scopes: ['external_users:read', 'external_users:write', 'remediation:write'],
    });
    const context = await integrations.authenticateApiKey(key.secret);
    if (!context) throw new Error('Partner API key did not authenticate');
    return { organization, workspace, integration, key, context };
  }

  it('reports safe provider readiness without exposing credentials', async () => {
    const tenant = await createKey();
    const response = await request(app.getHttpServer())
      .get('/v1/ai/status')
      .set('Authorization', `Bearer ${tenant.key.secret}`)
      .expect(200);

    expect(response.body).toEqual({
      configured: true,
      provider: 'fake',
      model: 'deterministic-v1',
      apiMode: null,
    });
    expect(JSON.stringify(response.body)).not.toContain('secret');
    expect(JSON.stringify(response.body)).not.toContain('apiKey');
  });

  async function mapExternalUser(key: string, externalUserId: string) {
    const response = await request(app.getHttpServer()).post('/v1/external-users')
      .set('Authorization', `Bearer ${key}`)
      .send({ externalUserId })
      .expect(201);
    return response.body as { id: string; externalUserId: string };
  }

  async function createAttempt(context: TenantContext, externalUserId: string, attemptKey: string) {
    const mapping = await app.get(ExternalUsersService).resolveActiveLearner(context, externalUserId);
    await database.db.insert(teacherStudentRelationships).values({
      teacherId: fixtureIds.teacher,
      studentId: mapping.learnerId,
    });
    const assignment = await app.get(TeachingService).createAssignment(
      fixtureIds.teacher, mapping.learnerId, fixtureIds.version, context,
    );
    const started = await app.get(AttemptsService).start(
      mapping.learnerId, fixtureIds.version, assignment.id, context,
    );
    await app.get(AttemptsService).submit(
      mapping.learnerId, started.attempt.id, attemptKey, { optionId: 'b' }, context,
    );
    return started.attempt.id;
  }

  it('returns partner-safe grounded remediation for a mapped learner', async () => {
    const tenant = await createKey();
    await mapExternalUser(tenant.key.secret, 'learner-valid');
    const attemptId = await createAttempt(tenant.context, 'learner-valid', 'partner-attempt-1');

    const response = await request(app.getHttpServer()).post('/v1/remediations')
      .set('Authorization', `Bearer ${tenant.key.secret}`)
      .set('x-request-id', 'partner-request-1')
      .send({
        externalUserId: 'learner-valid', attemptId,
        learnerQuestion: 'Why was this incorrect?', idempotencyKey: 'remediation-1',
      })
      .expect(201);

    expect(response.headers['x-request-id']).toBe('partner-request-1');
    expect(response.body).toHaveProperty('requestId');
    expect(response.body.remediation).toMatchObject({ abstained: false });
    expect(response.body.remediation).not.toHaveProperty('correctOptionId');
    expect(JSON.stringify(response.body)).not.toContain('correctOptionId');
    expect(response.body).not.toHaveProperty('provider');
    expect(response.body).not.toHaveProperty('model');

    const otherIntegration = await createKey(fixtureIds.organization, fixtureIds.workspace, 'Second integration');
    const ownTraces = await request(app.getHttpServer()).get('/v1/ai-requests')
      .set('Authorization', `Bearer ${tenant.key.secret}`).expect(200);
    const otherTraces = await request(app.getHttpServer()).get('/v1/ai-requests')
      .set('Authorization', `Bearer ${otherIntegration.key.secret}`).expect(200);
    expect(ownTraces.body.map((trace: { requestId: string }) => trace.requestId)).toContain(response.body.requestId);
    expect(otherTraces.body.map((trace: { requestId: string }) => trace.requestId)).not.toContain(response.body.requestId);
  });

  it('fails closed across integrations, workspaces, and mapped learner ownership', async () => {
    const tenantA = await createKey();
    await mapExternalUser(tenantA.key.secret, 'learner-a');
    const attemptA = await createAttempt(tenantA.context, 'learner-a', 'partner-attempt-a');
    await mapExternalUser(tenantA.key.secret, 'learner-b');
    const attemptB = await createAttempt(tenantA.context, 'learner-b', 'partner-attempt-b');

    const tenantB = await createKey(fixtureIds.organization, fixtureIds.workspace, 'Second integration');
    await expectPartnerError(tenantB.key.secret, 'learner-a', attemptA, 'EXTERNAL_LEARNER_NOT_FOUND', 404);
    await expectPartnerError(tenantA.key.secret, 'learner-a', attemptB, 'ATTEMPT_NOT_ACCESSIBLE', 404);

    const otherWorkspace = await createKey('00000000-0000-4000-8000-000000000009', '00000000-0000-4000-8000-000000000010', 'Other workspace');
    await mapExternalUser(otherWorkspace.key.secret, 'learner-a');
    await expectPartnerError(otherWorkspace.key.secret, 'learner-a', attemptA, 'ATTEMPT_NOT_ACCESSIBLE', 404);
  });

  it('replays the same partner request and rejects changed payloads', async () => {
    const tenant = await createKey();
    await mapExternalUser(tenant.key.secret, 'learner-replay');
    const attemptId = await createAttempt(tenant.context, 'learner-replay', 'partner-attempt-replay');
    const body = { externalUserId: 'learner-replay', attemptId, learnerQuestion: 'Explain this', idempotencyKey: 'replay-1' };
    const first = await request(app.getHttpServer()).post('/v1/remediations').set('Authorization', `Bearer ${tenant.key.secret}`).send(body).expect(201);
    const replay = await request(app.getHttpServer()).post('/v1/remediations').set('Authorization', `Bearer ${tenant.key.secret}`).send(body).expect(201);
    expect(replay.body.requestId).toBe(first.body.requestId);
    expect(replay.body).toEqual(first.body);
    await request(app.getHttpServer()).post('/v1/remediations').set('Authorization', `Bearer ${tenant.key.secret}`)
      .send({ ...body, learnerQuestion: 'A changed question' }).expect((response) => {
        expect(response.status).toBe(409);
        expect(response.body.code).toBe('IDEMPOTENCY_CONFLICT');
      });
  });

  it('sanitizes provider failures and returns abstention safely', async () => {
    const tenant = await createKey();
    await mapExternalUser(tenant.key.secret, 'learner-provider');
    const attemptId = await createAttempt(tenant.context, 'learner-provider', 'partner-attempt-provider');
    fakeProvider.setBehavior({ error: new Error('vendor secret and stack trace') });
    const failed = await request(app.getHttpServer()).post('/v1/remediations').set('Authorization', `Bearer ${tenant.key.secret}`)
      .send({ externalUserId: 'learner-provider', attemptId, idempotencyKey: 'provider-failure-1' }).expect(503);
    expect(failed.body).toMatchObject({ code: 'REMEDIATION_UNAVAILABLE', message: 'Grounded remediation is temporarily unavailable' });
    expect(JSON.stringify(failed.body)).not.toContain('vendor secret');

    fakeProvider.setBehavior({ output: {
      summary: 'Insufficient grounding', explanation: 'No safe explanation is available.', hint: 'Ask a teacher for help.',
      likelyGap: null, evidenceRefs: [], knowledgeRefs: [], confidence: 0, abstained: true,
    } });
    const abstained = await request(app.getHttpServer()).post('/v1/remediations').set('Authorization', `Bearer ${tenant.key.secret}`)
      .send({ externalUserId: 'learner-provider', attemptId, idempotencyKey: 'abstain-1' }).expect(201);
    expect(abstained.body.remediation).toMatchObject({ abstained: true, confidence: 0, likelyGap: null });
    expect(abstained.body.evidenceRefs).toEqual([]);
    expect(abstained.body.knowledgeRefs).toEqual([]);
  });

  async function expectPartnerError(key: string, externalUserId: string, attemptId: string, code: string, status: number) {
    const response = await request(app.getHttpServer()).post('/v1/remediations')
      .set('Authorization', `Bearer ${key}`)
      .send({ externalUserId, attemptId, idempotencyKey: `error-${code}-${attemptId}` });
    expect(response.status).toBe(status);
    expect(response.body.code).toBe(code);
  }
});
