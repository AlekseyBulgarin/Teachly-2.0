import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { and, eq } from 'drizzle-orm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/http-exception.filter';
import { requestIdMiddleware } from '../src/common/request-id.middleware';
import { DatabaseService } from '../src/infrastructure/database/database';
import { learningEvents, skillEvidence, tasks, taskVersions, theoryVersions } from '../src/infrastructure/database/schema';
import { fixtureIds } from '../src/infrastructure/database/seed';
import { IntegrationsService } from '../src/modules/integrations/integrations.service';
import type { IntegrationScope } from '../src/modules/integrations/integrations.types';
import { TenancyService } from '../src/modules/tenancy/tenancy.service';
import { resetTestDatabase, startTestApp, testDatabase } from './postgres-test';

jest.setTimeout(120_000);

const scopes: IntegrationScope[] = [
  'external_users:read', 'external_users:write',
  'theory:read', 'theory:write', 'theory:manage',
  'trainer:read', 'trainer:write',
];

describe('Trainer V1 (PostgreSQL)', () => {
  let app: INestApplication;
  let database: ReturnType<typeof testDatabase>;

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
  });

  afterEach(async () => app?.close());

  async function fixtureAuth() {
    const integrations = app.get(IntegrationsService);
    const integration = await integrations.createIntegration(fixtureIds.organization, fixtureIds.workspace, 'Trainer integration');
    const key = await integrations.createApiKey({
      organizationId: fixtureIds.organization,
      workspaceId: fixtureIds.workspace,
      integrationId: integration.id,
      name: 'Trainer API key',
      scopes,
    });
    return { auth: { Authorization: `Bearer ${key.secret}` } };
  }

  async function publishTheory(auth: Record<string, string>, title: string, publish = true) {
    const created = await request(app.getHttpServer()).post('/v1/theory/editor/materials').set(auth).send({
      title,
      subjectId: fixtureIds.subject,
      courseId: fixtureIds.course,
      topicId: fixtureIds.topic,
      skillId: fixtureIds.skill,
      taskIds: [fixtureIds.task],
      content: { blocks: [{ type: 'paragraph', text: 'Проверенный материал для повторения.' }] },
    }).expect(201);
    if (publish) await request(app.getHttpServer()).post(`/v1/theory/editor/materials/${created.body.id}/publish`).set(auth).expect(201);
    return created.body;
  }

  async function createSession(auth: Record<string, string>, externalLearnerId: string, key: string) {
    return request(app.getHttpServer()).post('/v1/trainer/sessions').set(auth).send({
      externalLearnerId,
      idempotencyKey: key,
      skillId: fixtureIds.skill,
      taskIds: [fixtureIds.task],
    }).expect(201);
  }

  it('creates an idempotent session, serves stable published tasks, evaluates answers, and exposes only published Theory', async () => {
    const { auth } = await fixtureAuth();
    await request(app.getHttpServer()).post('/v1/external-users').set(auth).send({ externalUserId: 'learner-1' }).expect(201);
    const [draftTask] = await database.db.insert(tasks).values({ workspaceId: fixtureIds.workspace, sourceKind: 'trainer-draft' }).returning();
    await database.db.insert(taskVersions).values({
      taskId: draftTask!.id,
      workspaceId: fixtureIds.workspace,
      version: 1,
      taskType: 'single-choice',
      status: 'draft',
      content: { statement: 'Draft task', options: [{ id: 'a', label: 'A' }], correctOptionId: 'a' },
      answerSchema: { type: 'single-choice' },
      evaluationRule: 'single-choice.v1',
      provenance: { sourceKind: 'trainer-draft', sourceIdentifier: draftTask!.id },
    });
    await request(app.getHttpServer()).post('/v1/trainer/sessions').set(auth).send({
      externalLearnerId: 'learner-1', idempotencyKey: 'draft-task-session', taskIds: [draftTask!.id],
    }).expect(422);
    const publishedTheory = await publishTheory(auth, 'Опубликованная теория');
    await publishTheory(auth, 'Черновик теории', false);

    const created = await createSession(auth, 'learner-1', 'trainer-session-1');
    expect(created.body).toMatchObject({ status: 'active', progress: { completed: 0, total: 1 }, idempotentReplay: false });
    const replay = await createSession(auth, 'learner-1', 'trainer-session-1');
    expect(replay.body).toMatchObject({ id: created.body.id, idempotentReplay: true });

    const current = await request(app.getHttpServer()).get(`/v1/trainer/sessions/${created.body.id}/current`).set(auth).expect(200);
    expect(current.body.current.task).toMatchObject({ id: fixtureIds.version, status: 'published' });
    expect(current.body.current.task.content.correctOptionId).toBeUndefined();
    const itemId = current.body.current.id;
    const attemptId = current.body.current.attemptId;
    expect(attemptId).toBeTruthy();

    const submitted = await request(app.getHttpServer()).post(`/v1/trainer/sessions/${created.body.id}/submissions`).set(auth).send({
      itemId, idempotencyKey: 'trainer-answer-1', answer: { optionId: 'b' },
    }).expect(201);
    expect(submitted.body.submitted).toMatchObject({ idempotentReplay: false, result: { outcome: 'incorrect' } });
    expect(submitted.body.theory).toHaveLength(1);
    expect(submitted.body.theory[0].id).toBe(publishedTheory.id);
    expect(submitted.body.theory[0].status).toBe('published');
    expect(await database.db.select().from(skillEvidence).where(and(
      eq(skillEvidence.workspaceId, fixtureIds.workspace), eq(skillEvidence.skillId, fixtureIds.skill),
    ))).toHaveLength(1);

    const repeated = await request(app.getHttpServer()).post(`/v1/trainer/sessions/${created.body.id}/submissions`).set(auth).send({
      itemId, idempotencyKey: 'trainer-answer-1', answer: { optionId: 'b' },
    }).expect(201);
    expect(repeated.body.submitted.idempotentReplay).toBe(true);
    expect(await database.db.select().from(learningEvents).where(and(
      eq(learningEvents.workspaceId, fixtureIds.workspace), eq(learningEvents.sourceId, repeated.body.submitted.result.submissionId),
    ))).toHaveLength(1);

    const next = await request(app.getHttpServer()).post(`/v1/trainer/sessions/${created.body.id}/next`).set(auth).expect(201);
    expect(next.body).toMatchObject({ current: null, canComplete: true });
    const completed = await request(app.getHttpServer()).post(`/v1/trainer/sessions/${created.body.id}/complete`).set(auth).expect(201);
    expect(completed.body).toMatchObject({ status: 'completed', canComplete: true });
    await request(app.getHttpServer()).post(`/v1/trainer/sessions/${created.body.id}/next`).set(auth).expect(409);
    await request(app.getHttpServer()).post(`/v1/trainer/sessions/${created.body.id}/submissions`).set(auth)
      .send({ itemId, idempotencyKey: 'after-complete', answer: { optionId: 'a' } }).expect(409);
    await expect(database.db.update(theoryVersions).set({ content: { blocks: [{ type: 'paragraph', text: 'mutated' }] } })
      .where(eq(theoryVersions.id, publishedTheory.version.id))).rejects.toThrow(/immutable/i);
  });

  it('keeps trainer sessions and integration-bound external learners isolated by workspace', async () => {
    const a = await fixtureAuth();
    await request(app.getHttpServer()).post('/v1/external-users').set(a.auth).send({ externalUserId: 'same-learner' }).expect(201);
    const session = await createSession(a.auth, 'same-learner', 'isolation-1');

    const tenancy = app.get(TenancyService);
    const integrations = app.get(IntegrationsService);
    const organization = await tenancy.createOrganization('Other trainer organization');
    const workspace = await tenancy.createWorkspace(organization.id, 'Other trainer workspace');
    const integration = await integrations.createIntegration(organization.id, workspace.id, 'Other trainer integration');
    const key = await integrations.createApiKey({ organizationId: organization.id, workspaceId: workspace.id, integrationId: integration.id, name: 'Other trainer key', scopes });
    const otherAuth = { Authorization: `Bearer ${key.secret}` };
    await request(app.getHttpServer()).post('/v1/external-users').set(otherAuth).send({ externalUserId: 'same-learner' }).expect(201);
    await request(app.getHttpServer()).get(`/v1/trainer/sessions/${session.body.id}`).set(otherAuth).expect(404);
    await request(app.getHttpServer()).post(`/v1/trainer/sessions/${session.body.id}/complete`).set(otherAuth).expect(404);
    await request(app.getHttpServer()).post('/v1/trainer/sessions').set(otherAuth).send({
      externalLearnerId: 'same-learner', idempotencyKey: 'no-published-tasks', taskIds: [fixtureIds.task],
    }).expect(422);
  });

  it('derives a deterministic needs-practice teacher signal from repeated incorrect Trainer results', async () => {
    const { auth } = await fixtureAuth();
    await request(app.getHttpServer()).post('/v1/external-users').set(auth).send({ externalUserId: 'learner-signal' }).expect(201);
    await publishTheory(auth, 'Теория для сигнала');
    for (const index of [1, 2, 3]) {
      const session = await createSession(auth, 'learner-signal', `signal-${index}`);
      const current = await request(app.getHttpServer()).get(`/v1/trainer/sessions/${session.body.id}/current`).set(auth).expect(200);
      const submitted = await request(app.getHttpServer()).post(`/v1/trainer/sessions/${session.body.id}/submissions`).set(auth).send({
        itemId: current.body.current.id, idempotencyKey: `signal-answer-${index}`, answer: { optionId: 'b' },
      }).expect(201);
      if (index < 3) expect(submitted.body.teacherSignal).toBeNull();
      else expect(submitted.body.teacherSignal).toMatchObject({ type: 'needs_practice', skillId: fixtureIds.skill, evidenceCount: 3 });
    }
  });
});
