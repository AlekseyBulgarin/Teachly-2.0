import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { and, eq } from 'drizzle-orm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/http-exception.filter';
import { requestIdMiddleware } from '../src/common/request-id.middleware';
import { DatabaseService } from '../src/infrastructure/database/database';
import { attempts, externalUsers, learningEvents, results, skills, submissions } from '../src/infrastructure/database/schema';
import { fixtureIds } from '../src/infrastructure/database/seed';
import { IntegrationsService } from '../src/modules/integrations/integrations.service';
import type { IntegrationScope } from '../src/modules/integrations/integrations.types';
import { LearningService } from '../src/modules/learning/learning.service';
import { TenancyService } from '../src/modules/tenancy/tenancy.service';
import { resetTestDatabase, startTestApp, testDatabase } from './postgres-test';

jest.setTimeout(120_000);

const scopes: IntegrationScope[] = ['external_users:write', 'learner_intelligence:read'];
const uuid = (n: number) => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

describe('Learner Intelligence V1 (PostgreSQL)', () => {
  let app: INestApplication;
  let database: DatabaseService;
  let integrations: IntegrationsService;
  let learning: LearningService;

  beforeEach(async () => {
    database = testDatabase();
    await resetTestDatabase(database);
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DatabaseService).useValue(database).compile();
    app = moduleRef.createNestApplication();
    app.use(requestIdMiddleware);
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
    await startTestApp(app);
    integrations = app.get(IntegrationsService);
    learning = app.get(LearningService);
  });

  afterEach(async () => app?.close());

  async function integrationAuth(name: string, keyScopes = scopes) {
    const integration = await integrations.createIntegration(fixtureIds.organization, fixtureIds.workspace, name);
    const key = await integrations.createApiKey({
      organizationId: fixtureIds.organization,
      workspaceId: fixtureIds.workspace,
      integrationId: integration.id,
      name: `${name} key`,
      scopes: keyScopes,
    });
    return { integration, auth: { Authorization: `Bearer ${key.secret}` } };
  }

  async function learner(auth: Record<string, string>, externalUserId: string) {
    await request(app.getHttpServer()).post('/v1/external-users').set(auth).send({ externalUserId }).expect(201);
    const [mapping] = await database.db.select().from(externalUsers).where(eq(externalUsers.externalUserId, externalUserId));
    if (!mapping?.learnerId) throw new Error('Learner fixture was not linked');
    return mapping;
  }

  async function evidence(input: {
    integrationId: string; learnerId: string; skillId: string; outcomes: Array<'correct' | 'incorrect'>; offset: number;
  }) {
    for (const [index, outcome] of input.outcomes.entries()) {
      await learning.recordExternalResultFacts({
        workspaceId: fixtureIds.workspace,
        integrationId: input.integrationId,
        learnerId: input.learnerId,
        taskVersionId: fixtureIds.version,
        courseId: fixtureIds.course,
        skillId: input.skillId,
        observationId: uuid(input.offset + index),
        outcome,
        occurredAt: new Date(Date.UTC(2026, 8, 1 + index, 10)),
      });
    }
  }

  it('returns deterministic profile/progress without internal evidence identifiers', async () => {
    const owner = await integrationAuth('Learner intelligence owner');
    const mapping = await learner(owner.auth, 'learner-profile-1');
    const [secondSkill] = await database.db.insert(skills).values({ topicId: fixtureIds.topic, name: 'Second observed skill' }).returning();
    await database.db.insert(attempts).values({
      id: uuid(200), workspaceId: fixtureIds.workspace, integrationId: owner.integration.id,
      studentId: mapping.learnerId!, taskVersionId: fixtureIds.version, status: 'submitted',
      startedAt: new Date('2026-08-31T23:55:00.000Z'), submittedAt: new Date('2026-09-01T00:01:00.000Z'),
    });
    await database.db.insert(submissions).values({
      id: uuid(201), attemptId: uuid(200), workspaceId: fixtureIds.workspace,
      idempotencyKey: 'window-boundary', answer: { optionId: 'a' }, createdAt: new Date('2026-09-01T00:01:00.000Z'),
    });
    await database.db.insert(results).values({
      id: uuid(202), attemptId: uuid(200), submissionId: uuid(201), workspaceId: fixtureIds.workspace,
      evaluationRule: 'single-choice.v1', outcome: 'correct', isCorrect: true, score: 1,
      details: {}, evaluatedAt: new Date('2026-09-01T00:02:00.000Z'),
    });
    await evidence({ integrationId: owner.integration.id, learnerId: mapping.learnerId!, skillId: fixtureIds.skill,
      outcomes: ['incorrect', 'incorrect', 'incorrect', 'correct', 'correct', 'correct'], offset: 1 });
    await evidence({ integrationId: owner.integration.id, learnerId: mapping.learnerId!, skillId: secondSkill!.id,
      outcomes: ['correct', 'correct', 'correct', 'incorrect', 'incorrect', 'incorrect'], offset: 20 });

    const profile = await request(app.getHttpServer()).get('/v1/learner-intelligence/profile')
      .set(owner.auth).query({ externalUserId: 'learner-profile-1' }).expect(200);
    expect(profile.body.skills).toEqual({ observed: 2, byStatus: {
      insufficient_evidence: 0, needs_practice: 1, showing_progress: 1,
    } });
    expect(profile.body.strengths).toHaveLength(1);
    expect(profile.body.needsPractice).toHaveLength(1);
    expect(profile.body.attempts.firstStartedAt).toMatch(/^2026-08-31T23:55:00\.000Z$/);
    expect(JSON.stringify(profile.body)).not.toMatch(/"learnerId"|evidenceReferences|sourceId|correctOptionId|"answer"/i);

    const progress = await request(app.getHttpServer()).get('/v1/learner-intelligence/progress')
      .set(owner.auth).query({ externalUserId: 'learner-profile-1', from: '2026-09-01', to: '2026-09-30', groupBy: 'topic' }).expect(200);
    expect(progress.body.summary).toMatchObject({ evidenceCount: 12, correct: 6, incorrect: 6, invalid: 0, outcomeRate: 0.5 });
    expect(progress.body.mappingCoverage).toEqual({ evaluatedResults: 1, withSkillEvidence: 0 });
    expect(progress.body.dimensions).toHaveLength(1);
    expect(progress.body.dimensions[0]).not.toHaveProperty('status');
    expect(progress.body.recentOutcomeTrend.map((row: { trend: { status: string } }) => row.trend.status).sort())
      .toEqual(['improving', 'regressing']);

    const firstSkills = await request(app.getHttpServer()).get('/v1/learner-intelligence/skills')
      .set(owner.auth).query({ externalUserId: 'learner-profile-1', limit: 1 }).expect(200);
    expect(firstSkills.body.items).toHaveLength(1);
    expect(firstSkills.body.nextCursor).toEqual(expect.any(String));
    const secondSkills = await request(app.getHttpServer()).get('/v1/learner-intelligence/skills')
      .set(owner.auth).query({ externalUserId: 'learner-profile-1', limit: 1, cursor: firstSkills.body.nextCursor }).expect(200);
    expect(secondSkills.body.items).toHaveLength(1);
    expect(secondSkills.body.items[0].curriculum.skill.id).not.toBe(firstSkills.body.items[0].curriculum.skill.id);
    await request(app.getHttpServer()).get('/v1/learner-intelligence/skills')
      .set(owner.auth).query({ externalUserId: 'learner-profile-1', limit: 101 }).expect(400);
    const filteredSkills = await request(app.getHttpServer()).get('/v1/learner-intelligence/skills')
      .set(owner.auth).query({ externalUserId: 'learner-profile-1', status: 'showing_progress' }).expect(200);
    expect(filteredSkills.body.items).toHaveLength(1);
    expect(filteredSkills.body.items[0].state.status).toBe('showing_progress');

    const firstActivity = await request(app.getHttpServer()).get('/v1/learner-intelligence/activity')
      .set(owner.auth).query({ externalUserId: 'learner-profile-1', limit: 2 }).expect(200);
    expect(firstActivity.body.items).toHaveLength(2);
    expect(firstActivity.body.nextCursor).toEqual(expect.any(String));
    expect(firstActivity.body.items[0]).toMatchObject({ origin: 'external_observation' });
    expect(JSON.stringify(firstActivity.body)).not.toMatch(/"eventId"|"evidenceId"|"sourceId"|"resultId"/);
    const secondActivity = await request(app.getHttpServer()).get('/v1/learner-intelligence/activity')
      .set(owner.auth).query({ externalUserId: 'learner-profile-1', limit: 2, cursor: firstActivity.body.nextCursor }).expect(200);
    expect(secondActivity.body.items).toHaveLength(2);
    await request(app.getHttpServer()).get('/v1/learner-intelligence/activity')
      .set(owner.auth).query({ externalUserId: 'learner-profile-1', limit: 101 }).expect(400);
    const invalidUuidCursor = Buffer.from(JSON.stringify({
      at: '2026-09-01T10:00:00.000Z',
      id: '------------------------------------',
    }), 'utf8').toString('base64url');
    const invalidCursor = await request(app.getHttpServer()).get('/v1/learner-intelligence/activity')
      .set(owner.auth).query({ externalUserId: 'learner-profile-1', cursor: invalidUuidCursor }).expect(400);
    expect(invalidCursor.body.code).toBe('INVALID_CURSOR');
    await request(app.getHttpServer()).get('/v1/learner-intelligence/profile')
      .set(owner.auth).query({ externalUserId: 'learner-profile-1', recentLimit: 21 }).expect(400);
    await request(app.getHttpServer()).get('/v1/learner-intelligence/progress')
      .set(owner.auth).query({ externalUserId: 'learner-profile-1', from: '2025-01-01', to: '2026-09-30' }).expect(400);
  });

  it('fails closed by scope, active mapping, workspace, and integration provenance', async () => {
    const owner = await integrationAuth('Isolation owner');
    const mapping = await learner(owner.auth, 'shared-external-id');
    await evidence({ integrationId: owner.integration.id, learnerId: mapping.learnerId!, skillId: fixtureIds.skill,
      outcomes: ['correct', 'correct', 'correct'], offset: 50 });

    const noScope = await integrationAuth('No insight scope', ['external_users:write']);
    for (const endpoint of ['profile', 'progress', 'skills', 'activity']) {
      await request(app.getHttpServer()).get(`/v1/learner-intelligence/${endpoint}`).set(noScope.auth)
        .query({ externalUserId: 'shared-external-id' }).expect(403);
    }

    const otherIntegration = await integrationAuth('Other integration');
    await database.db.insert(externalUsers).values({
      organizationId: fixtureIds.organization,
      workspaceId: fixtureIds.workspace,
      integrationId: otherIntegration.integration.id,
      learnerId: mapping.learnerId,
      externalUserId: 'shared-external-id',
    });
    const isolated = await request(app.getHttpServer()).get('/v1/learner-intelligence/profile')
      .set(otherIntegration.auth).query({ externalUserId: 'shared-external-id' }).expect(200);
    expect(isolated.body.activity.evidenceCount).toBe(0);
    expect(isolated.body.skills.observed).toBe(0);

    await database.db.update(externalUsers).set({ status: 'inactive' }).where(and(
      eq(externalUsers.integrationId, otherIntegration.integration.id),
      eq(externalUsers.externalUserId, 'shared-external-id'),
    ));
    const inactive = await request(app.getHttpServer()).get('/v1/learner-intelligence/profile')
      .set(otherIntegration.auth).query({ externalUserId: 'shared-external-id' }).expect(404);
    expect(inactive.body.code).toBe('LEARNER_NOT_FOUND');

    const tenancy = app.get(TenancyService);
    const organization = await tenancy.createOrganization('Foreign organization');
    const workspace = await tenancy.createWorkspace(organization.id, 'Foreign workspace');
    const integration = await integrations.createIntegration(organization.id, workspace.id, 'Foreign integration');
    const key = await integrations.createApiKey({ organizationId: organization.id, workspaceId: workspace.id,
      integrationId: integration.id, name: 'Foreign key', scopes: ['learner_intelligence:read'] });
    const foreign = await request(app.getHttpServer()).get('/v1/learner-intelligence/profile')
      .set({ Authorization: `Bearer ${key.secret}` }).query({ externalUserId: 'shared-external-id' }).expect(404);
    expect(foreign.body.code).toBe('LEARNER_NOT_FOUND');
  });

  it('returns zero summaries for an active learner without evidence and hides unknown provenance', async () => {
    const owner = await integrationAuth('Empty learner integration');
    const mapping = await learner(owner.auth, 'empty-learner');
    await learning.recordExternalResultFacts({
      workspaceId: fixtureIds.workspace,
      integrationId: owner.integration.id,
      learnerId: mapping.learnerId!,
      taskVersionId: fixtureIds.version,
      courseId: fixtureIds.course,
      skillId: fixtureIds.skill,
      observationId: uuid(90),
      outcome: 'correct',
      occurredAt: new Date('2026-09-01T10:00:00.000Z'),
    });
    await database.db.update(learningEvents).set({ integrationId: null }).where(eq(learningEvents.sourceId, uuid(90)));
    const response = await request(app.getHttpServer()).get('/v1/learner-intelligence/profile')
      .set(owner.auth).query({ externalUserId: 'empty-learner' }).expect(200);
    expect(response.body.activity.evidenceCount).toBe(0);
    expect(response.body.strengths).toEqual([]);
    expect(response.body.needsPractice).toEqual([]);
  });
});
