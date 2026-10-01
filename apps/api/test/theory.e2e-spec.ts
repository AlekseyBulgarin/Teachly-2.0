import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/http-exception.filter';
import { requestIdMiddleware } from '../src/common/request-id.middleware';
import { DatabaseService } from '../src/infrastructure/database/database';
import { memberships, theoryVersions, users } from '../src/infrastructure/database/schema';
import { fixtureIds } from '../src/infrastructure/database/seed';
import { IdentityService } from '../src/modules/identity/identity.service';
import { IntegrationsService } from '../src/modules/integrations/integrations.service';
import type { IntegrationScope } from '../src/modules/integrations/integrations.types';
import { TenancyService } from '../src/modules/tenancy/tenancy.service';
import { resetTestDatabase, startTestApp, testDatabase } from './postgres-test';

jest.setTimeout(120_000);

const theoryScopes: IntegrationScope[] = ['theory:read', 'theory:write', 'theory:manage'];
const content = (text: string) => ({
  blocks: [
    { type: 'heading', text: 'Квадратные уравнения', level: 2 },
    { type: 'paragraph', text },
    { type: 'formula', latex: 'x^2 + bx + c = 0' },
    { type: 'list', items: ['Определить коэффициенты', 'Найти дискриминант'] },
    { type: 'example', text: 'Решим x^2 - 5x + 6 = 0.' },
    { type: 'callout', text: 'Проверьте корни подстановкой.' },
    { type: 'image', reference: 'media://quadratic-graph' },
  ],
});

describe('Theory V1 (PostgreSQL)', () => {
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

  async function createTenant(name: string, scopes: IntegrationScope[] = theoryScopes) {
    const tenancy = app.get(TenancyService);
    const integrations = app.get(IntegrationsService);
    const organization = await tenancy.createOrganization(name);
    const workspace = await tenancy.createWorkspace(organization.id, `${name} workspace`);
    const integration = await integrations.createIntegration(organization.id, workspace.id, `${name} integration`);
    const key = await integrations.createApiKey({
      organizationId: organization.id,
      workspaceId: workspace.id,
      integrationId: integration.id,
      name: `${name} key`,
      scopes,
    });
    return { organization, workspace, auth: { Authorization: `Bearer ${key.secret}` } };
  }

  it('creates, edits, publishes, filters by curriculum, links tasks, and protects published versions', async () => {
    const integrations = app.get(IntegrationsService);
    const integration = await integrations.createIntegration(fixtureIds.organization, fixtureIds.workspace, 'Theory fixture integration');
    const key = await integrations.createApiKey({
      organizationId: fixtureIds.organization,
      workspaceId: fixtureIds.workspace,
      integrationId: integration.id,
      name: 'Theory fixture key',
      scopes: theoryScopes,
    });
    const auth = { Authorization: `Bearer ${key.secret}` };
    const created = await request(app.getHttpServer()).post('/v1/theory/editor/materials').set(auth).send({
      title: 'Квадратные уравнения',
      description: 'Опорный материал к теме',
      category: 'Алгебра',
      subjectId: fixtureIds.subject,
      courseId: fixtureIds.course,
      topicId: fixtureIds.topic,
      skillId: fixtureIds.skill,
      taskIds: [fixtureIds.task],
      content: content('Черновое объяснение.'),
    }).expect(201);
    expect(created.body).toMatchObject({ status: 'draft', taskIds: [fixtureIds.task] });
    expect(created.body.curriculum).toMatchObject({ subjectId: fixtureIds.subject, skillId: fixtureIds.skill });

    await request(app.getHttpServer()).get('/v1/theory/materials').set(auth).expect(200, []);
    await request(app.getHttpServer()).get(`/v1/theory/materials/${created.body.id}`).set(auth).expect(404);

    const updated = await request(app.getHttpServer()).patch(`/v1/theory/editor/materials/${created.body.id}/draft`).set(auth)
      .send({ content: content('Проверенное редактором объяснение.') }).expect(200);
    expect(updated.body.version.content.blocks[1]).toMatchObject({ text: 'Проверенное редактором объяснение.' });

    const published = await request(app.getHttpServer()).post(`/v1/theory/editor/materials/${created.body.id}/publish`).set(auth).expect(201);
    expect(published.body.version).toMatchObject({ version: 1, status: 'published' });
    const listed = await request(app.getHttpServer()).get(`/v1/theory/materials?skillId=${fixtureIds.skill}`).set(auth).expect(200);
    expect(listed.body).toHaveLength(1);
    expect(listed.body[0].version.content.blocks[1].text).toBe('Проверенное редактором объяснение.');

    await expect(database.db.update(theoryVersions).set({ content: content('Недопустимое изменение') })
      .where(eq(theoryVersions.id, published.body.version.id))).rejects.toThrow(/immutable/i);

    const nextDraft = await request(app.getHttpServer()).patch(`/v1/theory/editor/materials/${created.body.id}/draft`).set(auth)
      .send({ title: 'Новое черновое название', taskIds: [], content: content('Еще не опубликованное объяснение.') }).expect(200);
    expect(nextDraft.body.version).toMatchObject({ version: 2, status: 'draft' });
    const publicRead = await request(app.getHttpServer()).get(`/v1/theory/materials/${created.body.id}`).set(auth).expect(200);
    expect(publicRead.body.version).toMatchObject({ version: 1, status: 'published' });
    expect(publicRead.body.title).toBe('Квадратные уравнения');
    expect(publicRead.body.taskIds).toEqual([fixtureIds.task]);
    expect(publicRead.body.version.content.blocks[1].text).toBe('Проверенное редактором объяснение.');
  });

  it('isolates workspaces and rejects cross-workspace reads and writes', async () => {
    const a = await createTenant('Theory A');
    const b = await createTenant('Theory B');
    const created = await request(app.getHttpServer()).post('/v1/theory/editor/materials').set(a.auth)
      .send({ title: 'A material', content: content('A content') }).expect(201);
    await request(app.getHttpServer()).get(`/v1/theory/editor/materials/${created.body.id}`).set(b.auth).expect(404);
    await request(app.getHttpServer()).patch(`/v1/theory/editor/materials/${created.body.id}/draft`).set(b.auth)
      .send({ content: content('Foreign edit') }).expect(404);
    await request(app.getHttpServer()).get('/v1/theory/editor/materials').set(b.auth).expect(200, []);
  });

  it('rejects unauthorized roles and allows a workspace content_editor to publish', async () => {
    await request(app.getHttpServer()).post('/v1/theory/editor/materials').set('x-dev-user', 'student').send({
      organizationId: fixtureIds.organization,
      workspaceId: fixtureIds.workspace,
      title: 'Forbidden material',
      content: content('Should fail'),
    }).expect(403);

    const [editor] = await database.db.insert(users).values({ type: 'teacher', displayName: 'Theory Editor' }).returning();
    await database.db.insert(memberships).values({
      userId: editor!.id,
      organizationId: fixtureIds.organization,
      workspaceId: fixtureIds.workspace,
      role: 'content_editor',
    });
    await app.get(IdentityService).createDevelopmentIdentity(editor!.id, `dev-teacher-${editor!.id}`);
    const created = await request(app.getHttpServer()).post('/v1/theory/editor/materials').set('x-dev-user', `teacher:${editor!.id}`).send({
      organizationId: fixtureIds.organization,
      workspaceId: fixtureIds.workspace,
      title: 'Editor material',
      content: content('Editor content'),
    }).expect(201);
    await request(app.getHttpServer()).post(`/v1/theory/editor/materials/${created.body.id}/publish`)
      .set('x-dev-user', `teacher:${editor!.id}`).expect(201);
  });

  it('requires the declared API scope', async () => {
    const tenant = await createTenant('Read only', ['theory:read']);
    await request(app.getHttpServer()).get('/v1/theory/editor/materials').set(tenant.auth).expect(403);
    await request(app.getHttpServer()).post('/v1/theory/editor/materials').set(tenant.auth)
      .send({ title: 'No write scope', content: content('Should fail') }).expect(403);
  });
});
