import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/http-exception.filter';
import { DatabaseService } from '../src/infrastructure/database/database';
import { externalIdentities, taskVersions, users } from '../src/infrastructure/database/schema';
import { fixtureIds } from '../src/infrastructure/database/seed';
import { resetTestDatabase, testDatabase } from './postgres-test';

jest.setTimeout(120_000);

describe('teacher to student vertical slice (PostgreSQL)', () => {
  let app: INestApplication;
  let database: DatabaseService;

  beforeEach(async () => {
    database = testDatabase();
    await resetTestDatabase(database);
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
    await database?.onModuleDestroy();
  });

  async function provisionStudent(name: string) {
    const response = await request(app.getHttpServer()).post('/students').set('x-dev-user', 'teacher')
      .send({ displayName: name }).expect(201);
    return response.body.id as string;
  }

  it('authenticates, assigns, evaluates, replays, and lets the managing teacher review', async () => {
    await request(app.getHttpServer()).get('/users/me').expect(401);
    const studentId = await provisionStudent('Student A');
    const assignment = await request(app.getHttpServer()).post('/assignments').set('x-dev-user', 'teacher')
      .send({ studentId, taskVersionId: fixtureIds.version }).expect(201);
    const student = `student:${studentId}`;
    const started = await request(app.getHttpServer()).post('/attempts').set('x-dev-user', student)
      .send({ taskVersionId: fixtureIds.version, assignmentId: assignment.body.id }).expect(201);
    const attemptId = started.body.attempt.id as string;
    expect(started.body.task.content.correctOptionId).toBeUndefined();

    const submitted = await request(app.getHttpServer()).post(`/attempts/${attemptId}/submissions`).set('x-dev-user', student)
      .send({ idempotencyKey: 'one', answer: { optionId: 'a' } }).expect(201);
    expect(submitted.body.result).toMatchObject({ outcome: 'correct', score: 1, attemptId, evaluationRule: 'single-choice.v1' });
    const replay = await request(app.getHttpServer()).post(`/attempts/${attemptId}/submissions`).set('x-dev-user', student)
      .send({ idempotencyKey: 'one', answer: { optionId: 'a' } }).expect(201);
    expect(replay.body.result.id).toBe(submitted.body.result.id);
    expect(replay.body.idempotentReplay).toBe(true);
    const teacherResults = await request(app.getHttpServer()).get(`/students/${studentId}/results`).set('x-dev-user', 'teacher').expect(200);
    expect(teacherResults.body).toHaveLength(1);
    expect(teacherResults.body[0].attempt.taskVersionId).toBe(fixtureIds.version);
    expect(teacherResults.body[0].result.submissionId).toBe(submitted.body.result.submissionId);
  });

  it('rejects missing, foreign, or mismatched assignments and cross-user result/submission access', async () => {
    const studentId = await provisionStudent('Student A');
    const otherId = await provisionStudent('Student B');
    const assignment = await request(app.getHttpServer()).post('/assignments').set('x-dev-user', 'teacher')
      .send({ studentId, taskVersionId: fixtureIds.version }).expect(201);
    const student = `student:${studentId}`;
    await request(app.getHttpServer()).post('/attempts').set('x-dev-user', student)
      .send({ taskVersionId: fixtureIds.version }).expect(400);
    await request(app.getHttpServer()).post('/attempts').set('x-dev-user', `student:${otherId}`)
      .send({ taskVersionId: fixtureIds.version, assignmentId: assignment.body.id }).expect(403);

    const [secondVersion] = await database.db.insert(taskVersions).values({
      taskId: fixtureIds.task, version: 2, taskType: 'single-choice', status: 'published',
      content: { statement: 'Second version', options: [{ id: 'a', label: 'Yes' }, { id: 'b', label: 'No' }], correctOptionId: 'a' },
      answerSchema: { type: 'single-choice', required: true }, evaluationRule: 'single-choice.v1',
      provenance: { sourceKind: 'internal_fixture', sourceIdentifier: 'second-version', licenseStatus: 'development_only', fixtureVersion: '2' },
      publishedAt: new Date('2026-01-01T00:00:00.000Z'),
    }).returning();
    await request(app.getHttpServer()).post('/attempts').set('x-dev-user', student)
      .send({ taskVersionId: secondVersion!.id, assignmentId: assignment.body.id }).expect(403);

    const started = await request(app.getHttpServer()).post('/attempts').set('x-dev-user', student)
      .send({ taskVersionId: fixtureIds.version, assignmentId: assignment.body.id }).expect(201);
    const attemptId = started.body.attempt.id as string;
    await request(app.getHttpServer()).post(`/attempts/${attemptId}/submissions`).set('x-dev-user', `student:${otherId}`)
      .send({ idempotencyKey: 'foreign', answer: { optionId: 'a' } }).expect(404);
    await request(app.getHttpServer()).post(`/attempts/${attemptId}/submissions`).set('x-dev-user', student)
      .send({ idempotencyKey: 'own', answer: { optionId: 'b' } }).expect(201);
    await request(app.getHttpServer()).get(`/attempts/${attemptId}/result`).set('x-dev-user', `student:${otherId}`).expect(404);

    const [otherTeacher] = await database.db.insert(users).values({ type: 'teacher', displayName: 'Other teacher' }).returning();
    await database.db.insert(externalIdentities).values({ userId: otherTeacher!.id, provider: 'development', subject: `dev-teacher-${otherTeacher!.id}` });
    await request(app.getHttpServer()).get(`/students/${studentId}/results`).set('x-dev-user', `teacher:${otherTeacher!.id}`).expect(403);
  });
});
