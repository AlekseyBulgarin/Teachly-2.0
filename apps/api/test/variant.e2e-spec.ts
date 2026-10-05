import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/http-exception.filter';
import { requestIdMiddleware } from '../src/common/request-id.middleware';
import { DatabaseService } from '../src/infrastructure/database/database';
import { variantItems, variantVersions } from '../src/infrastructure/database/schema';
import {
  createAssessmentTenant,
  createTaskSource,
  importAndPublishTask,
  variantAssessmentScopes,
} from './fixtures/assessment.fixture';
import { kompegeRichTask, kompegeTextTask } from './fixtures/kompege-like.tasks';
import { kompegeLikeVariant, kompegeUnresolvedVariant, kompegeUnresolvedVariantId } from './fixtures/kompege-like.variant';
import { resetTestDatabase, startTestApp, testDatabase } from './postgres-test';
import { expectDatabaseError } from './database-error';

jest.setTimeout(120_000);

describe('Assessment Variants V1 (PostgreSQL)', () => {
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

  async function tenant(name: string) {
    return createAssessmentTenant(app, name, {
      workspaceName: 'Variant workspace',
      integrationName: 'Variant integration',
      keyName: 'Variant key',
      scopes: variantAssessmentScopes,
    });
  }

  it('verifies import, resolution, publication, isolation, immutability, editing, and answer safety', async () => {
    const primary = await tenant('Variant primary');
    const foreign = await tenant('Variant foreign');
    const source = await createTaskSource(app, primary.auth, 'Kompege-like source');
    const collidingSource = await createTaskSource(app, primary.auth, 'Colliding source');
    const publishedRich = await importAndPublishTask(app, primary.auth, source.body.id, kompegeRichTask, 'rich-primary');
    const publishedText = await importAndPublishTask(app, primary.auth, source.body.id, kompegeTextTask, 'text-primary');
    const collidingRich = await importAndPublishTask(app, primary.auth, collidingSource.body.id, kompegeRichTask, 'rich-collision');

    const payload = {
      taskSourceId: source.body.id,
      externalVariantId: kompegeLikeVariant.externalVariantId,
      idempotencyKey: 'variant-import-1',
      rawPayload: kompegeLikeVariant,
    };
    const imported = await request(app.getHttpServer()).post('/v1/assessment/variants').set(primary.auth).send(payload).expect(201);
    const replay = await request(app.getHttpServer()).post('/v1/assessment/variants').set(primary.auth).send(payload).expect(201);
    expect(replay.body).toMatchObject({ id: imported.body.id, idempotentReplay: true });
    expect(imported.body.items.map((item: { externalTaskId: string }) => item.externalTaskId)).toEqual([
      kompegeRichTask.externalTaskId,
      kompegeTextTask.externalTaskId,
    ]);

    const published = await request(app.getHttpServer()).post(`/v1/assessment/variants/${imported.body.id}/publish`).set(primary.auth).expect(201);
    expect(published.body.items.map((item: { taskVersionId: string }) => item.taskVersionId)).toEqual([
      publishedRich.body.id,
      publishedText.body.id,
    ]);
    expect(published.body.items[0].taskVersionId).not.toBe(collidingRich.body.id);
    expect(JSON.stringify(published.body)).not.toMatch(/correctOptionId|answerSchema|"answer"/);

    const read = await request(app.getHttpServer()).get(`/v1/assessment/variants/${published.body.id}`).set(primary.auth).expect(200);
    expect(read.body.items.map((item: { position: number }) => item.position)).toEqual([0, 1]);
    expect(JSON.stringify(read.body)).not.toMatch(/correctOptionId|answerSchema|"answer"/);
    await request(app.getHttpServer()).get('/v1/assessment/variants')
      .set(primary.auth).query({ limit: 101 }).expect(400);

    const unresolved = await request(app.getHttpServer()).post('/v1/assessment/variants').set(primary.auth).send({
      taskSourceId: source.body.id,
      externalVariantId: kompegeUnresolvedVariantId,
      idempotencyKey: 'variant-unresolved-1',
      rawPayload: kompegeUnresolvedVariant,
    }).expect(201);
    const blocked = await request(app.getHttpServer()).post(`/v1/assessment/variants/${unresolved.body.id}/publish`).set(primary.auth).expect(400);
    expect(blocked.body.message).toBe('Variant has unresolved task references');
    expect(blocked.body.details).toEqual([expect.objectContaining({ position: 0, externalTaskId: 'missing-task' })]);

    await request(app.getHttpServer()).post('/v1/assessment/variants').set(primary.auth).send({
      title: 'Foreign task reference',
      items: [{ taskVersionId: (await importAndPublishTask(app, foreign.auth, (await createTaskSource(app, foreign.auth, 'Foreign source')).body.id, kompegeTextTask, 'foreign-task')).body.id }],
    }).expect(404);

    await expectDatabaseError(
      database.db.update(variantVersions).set({ title: 'Mutated' }).where(eq(variantVersions.id, published.body.id)),
      /immutable/i,
    );
    await expectDatabaseError(
      database.db.update(variantItems).set({ section: 'Mutated' }).where(eq(variantItems.variantVersionId, published.body.id)),
      /immutable/i,
    );
    await request(app.getHttpServer()).post(`/v1/assessment/variants/${published.body.id}/publish`).set(primary.auth).expect(403);

    const edited = await request(app.getHttpServer()).patch(`/v1/assessment/variants/${published.body.id}`).set(primary.auth)
      .send({ title: 'Edited variant' }).expect(200);
    expect(edited.body).toMatchObject({ variantId: published.body.variantId, version: 2, status: 'draft', title: 'Edited variant' });
    expect(edited.body.id).not.toBe(published.body.id);
    const original = await request(app.getHttpServer()).get(`/v1/assessment/variants/${published.body.id}`).set(primary.auth).expect(200);
    expect(original.body).toMatchObject({ version: 1, status: 'published', title: kompegeLikeVariant.title });
  });
});
