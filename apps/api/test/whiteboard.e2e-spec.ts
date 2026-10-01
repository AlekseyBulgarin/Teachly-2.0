import { ValidationPipe } from '@nestjs/common';
import { NestApplication } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { and, eq } from 'drizzle-orm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/http-exception.filter';
import { requestIdMiddleware } from '../src/common/request-id.middleware';
import { DatabaseService } from '../src/infrastructure/database/database';
import { auditEvents, taskVersions, tasks, theoryMaterials, theoryVersions } from '../src/infrastructure/database/schema';
import { fixtureIds } from '../src/infrastructure/database/seed';
import { IntegrationsService } from '../src/modules/integrations/integrations.service';
import type { IntegrationScope } from '../src/modules/integrations/integrations.types';
import { TenancyService } from '../src/modules/tenancy/tenancy.service';
import { resetTestDatabase, startTestApp, testDatabase } from './postgres-test';

jest.setTimeout(120_000);

const scopes: IntegrationScope[] = ['whiteboard:read', 'whiteboard:write', 'theory:write', 'theory:manage'];

describe('Whiteboard V1 (PostgreSQL)', () => {
  let app: NestApplication;
  let database: ReturnType<typeof testDatabase>;

  beforeEach(async () => {
    database = testDatabase();
    await resetTestDatabase(database);
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DatabaseService).useValue(database).compile();
    app = moduleRef.createNestApplication<NestApplication>();
    app.useBodyParser('json', { limit: '2mb' });
    app.use(requestIdMiddleware);
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
    await startTestApp(app);
  });

  afterEach(async () => app?.close());

  async function fixtureAuth() {
    const integrations = app.get(IntegrationsService);
    const integration = await integrations.createIntegration(fixtureIds.organization, fixtureIds.workspace, 'Whiteboard integration');
    const key = await integrations.createApiKey({
      organizationId: fixtureIds.organization,
      workspaceId: fixtureIds.workspace,
      integrationId: integration.id,
      name: 'Whiteboard API key',
      scopes,
    });
    return { auth: { Authorization: `Bearer ${key.secret}` } };
  }

  async function createBoard(auth: Record<string, string>, title = 'Integration board') {
    const created = await request(app.getHttpServer()).post('/v1/whiteboards').set(auth)
      .send({ title, externalReference: 'board-ext-1' }).expect(201);
    return created.body as { id: string; currentRevision: number };
  }

  function boardData(marker: string) {
    return {
      elements: [{ id: `rect-${marker}`, type: 'rectangle', x: 12, y: 24 }],
      appState: { viewBackgroundColor: '#ffffff' },
      files: {},
    };
  }

  async function createTheory(auth: Record<string, string>, title: string, publish = true) {
    const created = await request(app.getHttpServer()).post('/v1/theory/editor/materials').set(auth).send({
      title,
      subjectId: fixtureIds.subject,
      courseId: fixtureIds.course,
      topicId: fixtureIds.topic,
      skillId: fixtureIds.skill,
      taskIds: [fixtureIds.task],
      content: { blocks: [{ type: 'paragraph', text: 'Whiteboard resource fixture.' }] },
    }).expect(201);
    if (publish) await request(app.getHttpServer()).post(`/v1/theory/editor/materials/${created.body.id}/publish`).set(auth).expect(201);
    return created.body as { id: string; version: { id: string; status: string } };
  }

  function attachResource(auth: Record<string, string>, boardId: string, type: 'task' | 'theory', resourceId: string) {
    return request(app.getHttpServer()).post(`/v1/whiteboards/${boardId}/resources`).set(auth)
      .send({ type, resourceId });
  }

  function taskVersionValues(workspaceId: string, sourceKind: string, status: 'draft' | 'published') {
    return {
      workspaceId,
      version: 1,
      taskType: 'single-choice',
      status,
      ...(status === 'published' ? { publishedAt: new Date() } : {}),
      content: { statement: `${sourceKind} task`, options: [{ id: 'a', label: 'A' }], correctOptionId: 'a' },
      answerSchema: { type: 'single-choice' },
      evaluationRule: 'single-choice.v1',
      provenance: { sourceKind, sourceIdentifier: sourceKind },
    };
  }

  async function insertTaskVersion(workspaceId: string, sourceKind: string, status: 'draft' | 'published') {
    const [task] = await database.db.insert(tasks).values({ workspaceId, sourceKind }).returning();
    const [version] = await database.db.insert(taskVersions)
      .values({ taskId: task!.id, ...taskVersionValues(workspaceId, sourceKind, status) }).returning();
    return version!;
  }

  it('creates a board at revision 0, saves state, reloads persisted state, and increments revisions', async () => {
    const { auth } = await fixtureAuth();
    const board = await createBoard(auth);
    expect(board).toMatchObject({ currentRevision: 0 });

    const initial = await request(app.getHttpServer()).get(`/v1/whiteboards/${board.id}/state`).set(auth).expect(200);
    expect(initial.body).toEqual({ id: board.id, revision: 0, data: null });

    const first = boardData('first');
    const save1 = await request(app.getHttpServer()).put(`/v1/whiteboards/${board.id}/state`).set(auth)
      .send({ expectedRevision: 0, data: first }).expect(200);
    expect(save1.body).toEqual({ revision: 1 });

    const reloaded = await request(app.getHttpServer()).get(`/v1/whiteboards/${board.id}/state`).set(auth).expect(200);
    expect(reloaded.body.revision).toBe(1);
    expect(reloaded.body.data).toEqual(first);

    const second = boardData('second');
    const save2 = await request(app.getHttpServer()).put(`/v1/whiteboards/${board.id}/state`).set(auth)
      .send({ expectedRevision: 1, data: second }).expect(200);
    expect(save2.body).toEqual({ revision: 2 });

    const metadata = await request(app.getHttpServer()).get(`/v1/whiteboards/${board.id}`).set(auth).expect(200);
    expect(metadata.body).toMatchObject({ currentRevision: 2, status: 'active', title: 'Integration board' });
    const reloadedSecond = await request(app.getHttpServer()).get(`/v1/whiteboards/${board.id}/state`).set(auth).expect(200);
    expect(reloadedSecond.body).toEqual({ id: board.id, revision: 2, data: second });

    const listed = await request(app.getHttpServer()).get('/v1/whiteboards').set(auth).expect(200);
    expect(listed.body).toHaveLength(1);
    expect(listed.body[0]).toMatchObject({ id: board.id, currentRevision: 2 });

    const savedEvents = await database.db.select().from(auditEvents).where(and(
      eq(auditEvents.action, 'whiteboard_state_saved'), eq(auditEvents.resourceId, board.id),
    ));
    expect(savedEvents).toHaveLength(2);
  });

  it('rejects a stale expected revision without overwriting the current state', async () => {
    const { auth } = await fixtureAuth();
    const board = await createBoard(auth);
    const current = boardData('current');
    await request(app.getHttpServer()).put(`/v1/whiteboards/${board.id}/state`).set(auth)
      .send({ expectedRevision: 0, data: current }).expect(200);

    const stale = await request(app.getHttpServer()).put(`/v1/whiteboards/${board.id}/state`).set(auth)
      .send({ expectedRevision: 0, data: boardData('stale') }).expect(409);
    expect(String(stale.body.message)).toMatch(/revision conflict/i);
    expect(String(stale.body.message)).toMatch(/expected revision 0/);
    expect(String(stale.body.message)).toMatch(/current revision is 1/);

    const future = await request(app.getHttpServer()).put(`/v1/whiteboards/${board.id}/state`).set(auth)
      .send({ expectedRevision: 99, data: boardData('future') }).expect(409);
    expect(String(future.body.message)).toMatch(/revision conflict/i);

    const state = await request(app.getHttpServer()).get(`/v1/whiteboards/${board.id}/state`).set(auth).expect(200);
    expect(state.body).toEqual({ id: board.id, revision: 1, data: current });

    const metadata = await request(app.getHttpServer()).get(`/v1/whiteboards/${board.id}`).set(auth).expect(200);
    expect(metadata.body.currentRevision).toBe(1);
  });

  it('keeps whiteboards isolated by workspace', async () => {
    const a = await fixtureAuth();
    const board = await createBoard(a.auth);

    const tenancy = app.get(TenancyService);
    const integrations = app.get(IntegrationsService);
    const organization = await tenancy.createOrganization('Other whiteboard organization');
    const workspace = await tenancy.createWorkspace(organization.id, 'Other whiteboard workspace');
    const integration = await integrations.createIntegration(organization.id, workspace.id, 'Other whiteboard integration');
    const key = await integrations.createApiKey({
      organizationId: organization.id, workspaceId: workspace.id, integrationId: integration.id,
      name: 'Other whiteboard key', scopes,
    });
    const otherAuth = { Authorization: `Bearer ${key.secret}` };

    await request(app.getHttpServer()).get(`/v1/whiteboards/${board.id}`).set(otherAuth).expect(404);
    await request(app.getHttpServer()).get(`/v1/whiteboards/${board.id}/state`).set(otherAuth).expect(404);
    await request(app.getHttpServer()).patch(`/v1/whiteboards/${board.id}`).set(otherAuth).send({ title: 'Taken over' }).expect(404);
    await request(app.getHttpServer()).put(`/v1/whiteboards/${board.id}/state`).set(otherAuth)
      .send({ expectedRevision: 0, data: boardData('intruder') }).expect(404);
    const listed = await request(app.getHttpServer()).get('/v1/whiteboards').set(otherAuth).expect(200);
    expect(listed.body).toEqual([]);
  });

  it('keeps whiteboards isolated by integration inside the same workspace', async () => {
    const a = await fixtureAuth();
    const board = await createBoard(a.auth);

    const integrations = app.get(IntegrationsService);
    const second = await integrations.createIntegration(fixtureIds.organization, fixtureIds.workspace, 'Second whiteboard integration');
    const key = await integrations.createApiKey({
      organizationId: fixtureIds.organization, workspaceId: fixtureIds.workspace, integrationId: second.id,
      name: 'Second whiteboard key', scopes,
    });
    const otherAuth = { Authorization: `Bearer ${key.secret}` };

    await request(app.getHttpServer()).get(`/v1/whiteboards/${board.id}`).set(otherAuth).expect(404);
    await request(app.getHttpServer()).get(`/v1/whiteboards/${board.id}/state`).set(otherAuth).expect(404);
    await request(app.getHttpServer()).put(`/v1/whiteboards/${board.id}/state`).set(otherAuth)
      .send({ expectedRevision: 0, data: boardData('other-integration') }).expect(404);
    const listed = await request(app.getHttpServer()).get('/v1/whiteboards').set(otherAuth).expect(200);
    expect(listed.body).toEqual([]);
  });

  it('refuses to modify an archived whiteboard while still serving reads', async () => {
    const { auth } = await fixtureAuth();
    const board = await createBoard(auth);
    const first = boardData('before-archive');
    await request(app.getHttpServer()).put(`/v1/whiteboards/${board.id}/state`).set(auth)
      .send({ expectedRevision: 0, data: first }).expect(200);

    const archived = await request(app.getHttpServer()).patch(`/v1/whiteboards/${board.id}`).set(auth)
      .send({ status: 'archived' }).expect(200);
    expect(archived.body).toMatchObject({ status: 'archived', currentRevision: 1 });

    const rename = await request(app.getHttpServer()).patch(`/v1/whiteboards/${board.id}`).set(auth)
      .send({ title: 'Renamed after archive' }).expect(409);
    expect(String(rename.body.message)).toMatch(/archived/i);
    const save = await request(app.getHttpServer()).put(`/v1/whiteboards/${board.id}/state`).set(auth)
      .send({ expectedRevision: 1, data: boardData('after-archive') }).expect(409);
    expect(String(save.body.message)).toMatch(/archived/i);

    const state = await request(app.getHttpServer()).get(`/v1/whiteboards/${board.id}/state`).set(auth).expect(200);
    expect(state.body).toEqual({ id: board.id, revision: 1, data: first });

    const active = await request(app.getHttpServer()).get('/v1/whiteboards?status=active').set(auth).expect(200);
    expect(active.body).toEqual([]);
    const onlyArchived = await request(app.getHttpServer()).get('/v1/whiteboards?status=archived').set(auth).expect(200);
    expect(onlyArchived.body).toHaveLength(1);
    expect(onlyArchived.body[0]).toMatchObject({ id: board.id, status: 'archived' });
  });

  it('attaches a published TaskVersion and exposes only the safe link contract', async () => {
    const { auth } = await fixtureAuth();
    const board = await createBoard(auth);
    const attached = await attachResource(auth, board.id, 'task', fixtureIds.version).expect(201);
    expect(Object.keys(attached.body).sort()).toEqual(['id', 'resourceId', 'type']);
    expect(attached.body).toMatchObject({ type: 'task', resourceId: fixtureIds.version });
  });

  it('attaches a published TheoryVersion', async () => {
    const { auth } = await fixtureAuth();
    const board = await createBoard(auth);
    const theory = await createTheory(auth, 'Published theory for whiteboard');
    const attached = await attachResource(auth, board.id, 'theory', theory.version.id).expect(201);
    expect(attached.body).toMatchObject({ type: 'theory', resourceId: theory.version.id });
  });

  it('lists attached resources and deletes a link', async () => {
    const { auth } = await fixtureAuth();
    const board = await createBoard(auth);
    const theory = await createTheory(auth, 'Listed theory for whiteboard');
    const taskLink = await attachResource(auth, board.id, 'task', fixtureIds.version).expect(201);
    const theoryLink = await attachResource(auth, board.id, 'theory', theory.version.id).expect(201);

    const listed = await request(app.getHttpServer()).get(`/v1/whiteboards/${board.id}/resources`).set(auth).expect(200);
    expect(listed.body).toHaveLength(2);
    expect(listed.body).toEqual(expect.arrayContaining([
      { id: taskLink.body.id, type: 'task', resourceId: fixtureIds.version },
      { id: theoryLink.body.id, type: 'theory', resourceId: theory.version.id },
    ]));

    await request(app.getHttpServer())
      .delete(`/v1/whiteboards/${board.id}/resources/${taskLink.body.id}`).set(auth).expect(204);
    const afterDelete = await request(app.getHttpServer()).get(`/v1/whiteboards/${board.id}/resources`).set(auth).expect(200);
    expect(afterDelete.body).toEqual([{ id: theoryLink.body.id, type: 'theory', resourceId: theory.version.id }]);

    await request(app.getHttpServer())
      .delete(`/v1/whiteboards/${board.id}/resources/${taskLink.body.id}`).set(auth).expect(404);
  });

  it('treats duplicate attachment as idempotent', async () => {
    const { auth } = await fixtureAuth();
    const board = await createBoard(auth);
    const first = await attachResource(auth, board.id, 'task', fixtureIds.version).expect(201);
    const second = await attachResource(auth, board.id, 'task', fixtureIds.version).expect(201);
    expect(second.body).toEqual(first.body);
    const listed = await request(app.getHttpServer()).get(`/v1/whiteboards/${board.id}/resources`).set(auth).expect(200);
    expect(listed.body).toHaveLength(1);
  });

  it('rejects an unpublished TaskVersion attachment', async () => {
    const { auth } = await fixtureAuth();
    const board = await createBoard(auth);
    const draft = await insertTaskVersion(fixtureIds.workspace, 'whiteboard-draft', 'draft');
    await attachResource(auth, board.id, 'task', draft.id).expect(404);
    const listed = await request(app.getHttpServer()).get(`/v1/whiteboards/${board.id}/resources`).set(auth).expect(200);
    expect(listed.body).toEqual([]);
  });

  it('rejects an unpublished TheoryVersion attachment', async () => {
    const { auth } = await fixtureAuth();
    const board = await createBoard(auth);
    const draft = await createTheory(auth, 'Draft theory for whiteboard', false);
    expect(draft.version.status).toBe('draft');
    await attachResource(auth, board.id, 'theory', draft.version.id).expect(404);
    const listed = await request(app.getHttpServer()).get(`/v1/whiteboards/${board.id}/resources`).set(auth).expect(200);
    expect(listed.body).toEqual([]);
  });

  it('rejects cross-workspace TaskVersion and TheoryVersion attachments', async () => {
    const { auth } = await fixtureAuth();
    const board = await createBoard(auth);

    const tenancy = app.get(TenancyService);
    const organization = await tenancy.createOrganization('Foreign resource organization');
    const workspace = await tenancy.createWorkspace(organization.id, 'Foreign resource workspace');

    const foreignTask = await insertTaskVersion(workspace.id, 'whiteboard-foreign', 'published');
    await attachResource(auth, board.id, 'task', foreignTask.id).expect(404);

    const [material] = await database.db.insert(theoryMaterials).values({
      organizationId: organization.id, workspaceId: workspace.id, title: 'Foreign theory', status: 'published',
    }).returning();
    const [foreignTheory] = await database.db.insert(theoryVersions).values({
      materialId: material!.id,
      workspaceId: workspace.id,
      version: 1,
      status: 'published',
      content: { blocks: [{ type: 'paragraph', text: 'Foreign theory content.' }] },
      metadata: { title: 'Foreign theory', description: '', category: null, subjectId: null, courseId: null, topicId: null, skillId: null, taskIds: [] },
      publishedAt: new Date(),
      publishedByPrincipal: 'api_key:cross-workspace-fixture',
    }).returning();
    await attachResource(auth, board.id, 'theory', foreignTheory!.id).expect(404);

    const listed = await request(app.getHttpServer()).get(`/v1/whiteboards/${board.id}/resources`).set(auth).expect(200);
    expect(listed.body).toEqual([]);
  });

  it('keeps resource endpoints isolated by board integration', async () => {
    const { auth } = await fixtureAuth();
    const board = await createBoard(auth);
    const link = await attachResource(auth, board.id, 'task', fixtureIds.version).expect(201);

    const integrations = app.get(IntegrationsService);
    const second = await integrations.createIntegration(fixtureIds.organization, fixtureIds.workspace, 'Second resources integration');
    const key = await integrations.createApiKey({
      organizationId: fixtureIds.organization, workspaceId: fixtureIds.workspace, integrationId: second.id,
      name: 'Second resources key', scopes,
    });
    const otherAuth = { Authorization: `Bearer ${key.secret}` };

    await request(app.getHttpServer()).get(`/v1/whiteboards/${board.id}/resources`).set(otherAuth).expect(404);
    await attachResource(otherAuth, board.id, 'task', fixtureIds.version).expect(404);
    await request(app.getHttpServer())
      .delete(`/v1/whiteboards/${board.id}/resources/${link.body.id}`).set(otherAuth).expect(404);
  });
});
