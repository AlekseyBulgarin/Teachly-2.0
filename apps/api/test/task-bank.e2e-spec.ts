import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/http-exception.filter';
import { requestIdMiddleware } from '../src/common/request-id.middleware';
import { DatabaseService } from '../src/infrastructure/database/database';
import { and, eq } from 'drizzle-orm';
import { attempts, externalResultObservations, learningEvents, results, skillEvidence, taskVersions } from '../src/infrastructure/database/schema';
import { fixtureIds } from '../src/infrastructure/database/seed';
import { expectDatabaseError } from './database-error';
import {
  assessmentTaskBankScopes,
  buildGenericRawTask,
  buildKompegeCurriculumMappings,
  createAssessmentTenant,
  createFixtureWorkspaceApiKey,
  createTaskSource,
  importTask,
  kompegeFixtureScopes,
} from './fixtures/assessment.fixture';
import { kompegeLikeTasks, kompegeUnmappedTask } from './fixtures/kompege-like.tasks';
import { resetTestDatabase, startTestApp, testDatabase } from './postgres-test';

jest.setTimeout(120_000);

describe('Assessment Task Bank V1 (PostgreSQL)', () => {
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

  async function tenant(name: string) {
    return createAssessmentTenant(app, name, {
      workspaceName: 'Assessment workspace',
      integrationName: 'Task source integration',
      keyName: 'Assessment key',
      scopes: assessmentTaskBankScopes,
    });
  }

  it('isolates sources and preserves source-scoped external identity', async () => {
    const a = await tenant('Organization A');
    const b = await tenant('Organization B');
    await request(app.getHttpServer()).get('/v1/assessment/task-sources')
      .set(a.auth).query({ limit: 101 }).expect(400);
    await request(app.getHttpServer()).get('/v1/assessment/curriculum-mappings')
      .set(a.auth).query({ limit: 101 }).expect(400);
    const sourceA = await createTaskSource(app, a.auth, 'A source', 'json');
    const sourceB = await createTaskSource(app, b.auth, 'B source', 'json');
    const importedA = await request(app.getHttpServer()).post(`/v1/assessment/task-sources/${sourceA.body.id}/import`).set(a.auth)
      .send({ externalTaskId: 'same-id', idempotencyKey: 'a-1', rawPayload: buildGenericRawTask() }).expect(201);
    const importedB = await request(app.getHttpServer()).post(`/v1/assessment/task-sources/${sourceB.body.id}/import`).set(b.auth)
      .send({ externalTaskId: 'same-id', idempotencyKey: 'b-1', rawPayload: buildGenericRawTask('single-choice', 'B task') }).expect(201);
    expect(importedA.body.taskId).not.toBe(importedB.body.taskId);
    await request(app.getHttpServer()).get(`/v1/assessment/task-sources/${sourceA.body.id}`).set(b.auth).expect(404);
    await request(app.getHttpServer()).post(`/v1/assessment/task-sources/${sourceA.body.id}/import`).set(b.auth)
      .send({ externalTaskId: 'foreign', idempotencyKey: 'foreign', rawPayload: buildGenericRawTask() }).expect(404);
  });

  it('imports idempotently, keeps raw provenance, separates answers, and supports publication editing', async () => {
    const fixture = await tenant('Organization A');
    const source = await createTaskSource(app, fixture.auth, 'JSON source', 'partner-json', 'external_reference');
    const payload = { externalTaskId: 'task-1', idempotencyKey: 'sync-1', rawPayload: buildGenericRawTask() };
    const first = await request(app.getHttpServer()).post(`/v1/assessment/task-sources/${source.body.id}/import`).set(fixture.auth).send(payload).expect(201);
    const replay = await request(app.getHttpServer()).post(`/v1/assessment/task-sources/${source.body.id}/import`).set(fixture.auth).send(payload).expect(201);
    expect(replay.body.id).toBe(first.body.id);
    expect(replay.body.idempotentReplay).toBe(true);
    expect(first.body.provenance).toMatchObject({ taskSourceId: source.body.id, externalTaskId: 'task-1' });
    expect(first.body.rawSnapshotId).toBeTruthy();

    const published = await request(app.getHttpServer()).post(`/v1/assessment/task-drafts/${first.body.id}/publish`).set(fixture.auth).expect(201);
    const read = await request(app.getHttpServer()).get(`/v1/assessment/tasks/${published.body.id}`).set(fixture.auth).expect(200);
    expect(read.body.content.correctOptionId).toBeUndefined();
    expect(read.body.answerSchema).not.toHaveProperty('answer');
    const answer = await request(app.getHttpServer()).get(`/v1/assessment/tasks/${published.body.id}/answer`).set(fixture.auth).expect(200);
    expect(answer.body.answer).toEqual({ optionId: 'a' });

    const edited = await request(app.getHttpServer()).patch(`/v1/assessment/task-drafts/${published.body.id}`).set(fixture.auth)
      .send({ content: { statement: 'Edited', options: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], correctOptionId: 'b' } }).expect(200);
    expect(edited.body.id).not.toBe(published.body.id);
    expect(edited.body.status).toBe('draft');
    await request(app.getHttpServer()).post(`/v1/assessment/task-drafts/${edited.body.id}/publish`).set(fixture.auth).expect(201);
    await expectDatabaseError(
      database.db.update(taskVersions).set({ taskType: 'mutated' }).where(eq(taskVersions.id, published.body.id)),
      /immutable/i,
    );
  });

  it('exposes unsupported task types without claiming automatic evaluation', async () => {
    const fixture = await tenant('Organization A');
    const source = await createTaskSource(app, fixture.auth, 'Open response source', 'json');
    const imported = await request(app.getHttpServer()).post(`/v1/assessment/task-sources/${source.body.id}/import`).set(fixture.auth)
      .send({ externalTaskId: 'open-1', idempotencyKey: 'open-1', rawPayload: buildGenericRawTask('structured-answer', 'Explain your reasoning') }).expect(201);
    expect(imported.body.evaluatorCapability).toBe('unsupported');
    expect(imported.body.evaluationRule).toBe('manual-review');
  });

  it('runs a Kompege-like imported task through Assignment to Learning and keeps external observations outside Attempts', async () => {
    const { auth } = await createFixtureWorkspaceApiKey(app, {
      integrationName: 'Fixture task database',
      keyName: 'Fixture assessment key',
      scopes: kompegeFixtureScopes,
    });
    const source = await createTaskSource(app, auth, 'Local Kompege-like fixture', 'local-json');
    for (const mapping of buildKompegeCurriculumMappings(fixtureIds.workspace, source.body.id)) {
      await request(app.getHttpServer()).post('/v1/assessment/curriculum-mappings').set(auth).send(mapping).expect(201);
    }

    const imported = [] as Array<{ id: string; taskId: string }>;
    for (const [index, task] of kompegeLikeTasks.entries()) {
      const response = await importTask(app, auth, source.body.id, {
        externalTaskId: task.externalTaskId, idempotencyKey: `fixture-${index}`, rawPayload: task,
      });
      imported.push(response.body);
    }
    const publishedSupported = await request(app.getHttpServer()).post(`/v1/assessment/task-drafts/${imported[0]!.id}/publish`).set(auth).expect(201);
    const publishedRich = await request(app.getHttpServer()).post(`/v1/assessment/task-drafts/${imported[1]!.id}/publish`).set(auth).expect(201);
    const publishedManual = await request(app.getHttpServer()).post(`/v1/assessment/task-drafts/${imported[2]!.id}/publish`).set(auth).expect(201);
    const richRead = await request(app.getHttpServer()).get(`/v1/assessment/tasks/${publishedRich.body.id}`).set(auth).expect(200);
    expect(richRead.body.content.blocks).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'formula' }),
      expect.objectContaining({ type: 'table' }),
      expect.objectContaining({ type: 'image' }),
      expect.objectContaining({ type: 'file' }),
    ]));
    expect(richRead.body.content.correctOptionId).toBeUndefined();

    const assignment = await request(app.getHttpServer()).post('/assignments').set('x-dev-user', 'teacher').send({
      studentId: fixtureIds.student, taskVersionId: publishedSupported.body.id,
    }).expect(201);
    expect(assignment.body.taskVersionId).toBe(publishedSupported.body.id);
    const started = await request(app.getHttpServer()).post('/attempts').set('x-dev-user', 'student').send({
      taskVersionId: publishedSupported.body.id, assignmentId: assignment.body.id,
    }).expect(201);
    expect(started.body.task.content.correctOptionId).toBeUndefined();
    const submitted = await request(app.getHttpServer()).post(`/attempts/${started.body.attempt.id}/submissions`).set('x-dev-user', 'student').send({
      idempotencyKey: 'fixture-supported-submit', answer: { optionId: 'b' },
    }).expect(201);
    expect(submitted.body.result).toMatchObject({ outcome: 'correct', score: 1, evaluationRule: 'single-choice.v1', learningHandoff: 'recorded' });
    const evidence = await database.db.select().from(skillEvidence).where(and(
      eq(skillEvidence.workspaceId, fixtureIds.workspace), eq(skillEvidence.learnerId, fixtureIds.student), eq(skillEvidence.skillId, fixtureIds.skill),
    ));
    expect(evidence.length).toBeGreaterThan(0);

    const unmappedImport = await importTask(app, auth, source.body.id, {
      externalTaskId: kompegeUnmappedTask.externalTaskId,
      idempotencyKey: 'fixture-unmapped-4',
      rawPayload: kompegeUnmappedTask,
    });
    const unmappedPublished = await request(app.getHttpServer()).post(`/v1/assessment/task-drafts/${unmappedImport.body.id}/publish`).set(auth).expect(201);
    const unmappedAssignment = await request(app.getHttpServer()).post('/assignments').set('x-dev-user', 'teacher').send({
      studentId: fixtureIds.student, taskVersionId: unmappedPublished.body.id,
    }).expect(201);
    const unmappedAttempt = await request(app.getHttpServer()).post('/attempts').set('x-dev-user', 'student').send({
      taskVersionId: unmappedPublished.body.id, assignmentId: unmappedAssignment.body.id,
    }).expect(201);
    const unmappedResult = await request(app.getHttpServer()).post(`/attempts/${unmappedAttempt.body.attempt.id}/submissions`).set('x-dev-user', 'student').send({
      idempotencyKey: 'fixture-unmapped-submit', answer: { optionId: 'a' },
    }).expect(201);
    expect(unmappedResult.body.result).toMatchObject({ outcome: 'correct', learningHandoff: 'skipped_skill_unmapped' });
    expect(await database.db.select().from(learningEvents).where(eq(learningEvents.sourceId, unmappedResult.body.result.id))).toHaveLength(0);

    const manualAssignment = await request(app.getHttpServer()).post('/assignments').set('x-dev-user', 'teacher').send({
      studentId: fixtureIds.student, taskVersionId: publishedManual.body.id,
    }).expect(201);
    const manualAttempt = await request(app.getHttpServer()).post('/attempts').set('x-dev-user', 'student').send({
      taskVersionId: publishedManual.body.id, assignmentId: manualAssignment.body.id,
    }).expect(201);
    const manualSubmission = await request(app.getHttpServer()).post(`/attempts/${manualAttempt.body.attempt.id}/submissions`).set('x-dev-user', 'student').send({
      idempotencyKey: 'fixture-manual-submit', answer: { explanation: 'Human review required' },
    }).expect(201);
    expect(manualSubmission.body).toMatchObject({ result: null, manualReviewStatus: 'pending' });
    const manualResult = await request(app.getHttpServer()).get(`/attempts/${manualAttempt.body.attempt.id}/result`).set('x-dev-user', 'student').expect(200);
    expect(manualResult.body).toMatchObject({ result: null, manualReviewStatus: 'pending' });
    expect(await database.db.select().from(results).where(eq(results.attemptId, manualAttempt.body.attempt.id))).toHaveLength(0);

    const externalUser = await request(app.getHttpServer()).post('/v1/external-users').set(auth).send({ externalUserId: 'kompege-learner-1' }).expect(201);
    const attemptsBeforeObservation = await database.db.select().from(attempts).where(eq(attempts.taskVersionId, publishedRich.body.id));
    const observationPayload = {
      externalLearnerId: 'kompege-learner-1', taskSourceId: source.body.id, externalTaskId: kompegeLikeTasks[1]!.externalTaskId,
      idempotencyKey: 'external-observation-1', outcome: 'correct', score: 1, observedAt: '2026-01-01T00:00:00.000Z', sourceMetadata: { provider: 'local-fixture' },
    };
    const observation = await request(app.getHttpServer()).post('/v1/assessment/results/external').set(auth).send(observationPayload).expect(201);
    expect(observation.body.learningHandoff).toBe('recorded');
    const replay = await request(app.getHttpServer()).post('/v1/assessment/results/external').set(auth).send(observationPayload).expect(201);
    expect(replay.body.id).toBe(observation.body.id);
    expect(replay.body.idempotentReplay).toBe(true);
    expect(externalUser.body.externalUserId).toBe('kompege-learner-1');
    expect(await database.db.select().from(attempts).where(eq(attempts.taskVersionId, publishedRich.body.id))).toHaveLength(attemptsBeforeObservation.length);
    expect(await database.db.select().from(externalResultObservations).where(eq(externalResultObservations.id, observation.body.id))).toHaveLength(1);
    expect(await database.db.select().from(learningEvents).where(and(
      eq(learningEvents.sourceType, 'external_result_observation'), eq(learningEvents.sourceId, observation.body.id),
    ))).toHaveLength(1);
  });
});
