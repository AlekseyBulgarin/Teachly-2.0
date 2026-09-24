import { and, eq, sql } from 'drizzle-orm';
import { DatabaseService } from '../src/infrastructure/database/database';
import { fixtureIds, seedDevelopmentFixtures } from '../src/infrastructure/database/seed';
import { applyMigrations } from '../src/infrastructure/database/migrate';
import { attempts, auditEvents, results, submissions, taskVersions, tasks, users } from '../src/infrastructure/database/schema';
import { AttemptsService } from '../src/modules/attempts/attempts.service';
import { AuditService } from '../src/modules/audit/audit.service';
import { EducationService } from '../src/modules/education/education.service';
import { TeachingService } from '../src/modules/teaching/teaching.service';
import { resetTestDatabase, testDatabase } from './postgres-test';

jest.setTimeout(120_000);

describe('Phase 2 PostgreSQL invariants', () => {
  let database: DatabaseService;
  let attemptsService: AttemptsService;
  let audit: AuditService;
  let teaching: TeachingService;

  beforeEach(async () => {
    database = testDatabase();
    await resetTestDatabase(database);
    const education = new EducationService(database);
    audit = new AuditService(database);
    attemptsService = new AttemptsService(database, education, audit);
    teaching = new TeachingService(database, education, audit);
  });

  afterEach(async () => { await database?.onModuleDestroy(); });

  async function assignedAttempt() {
    const student = await teaching.createStudent(fixtureIds.teacher, 'Integration student');
    const assignment = await teaching.createAssignment(fixtureIds.teacher, student.id, fixtureIds.version);
    const started = await attemptsService.start(student.id, fixtureIds.version, assignment.id);
    return { student, assignment, attempt: started.attempt };
  }

  it('runs clean migrations and converges when seeded twice', async () => {
    await applyMigrations(database);
    await seedDevelopmentFixtures(database);
    for (const table of [users, tasks, taskVersions]) {
      const rows = await database.db.select({ count: sql<number>`count(*)::int` }).from(table);
      expect(rows[0]?.count).toBe(table === users ? 2 : 1);
    }
    const version = await database.db.select().from(taskVersions).where(eq(taskVersions.id, fixtureIds.version));
    expect(version[0]?.provenance.licenseStatus).toBe('development_only');
  });

  it('keeps published content immutable and attempts pinned to the exact version', async () => {
    const { attempt } = await assignedAttempt();
    const original = (await database.db.select().from(taskVersions).where(eq(taskVersions.id, fixtureIds.version)))[0]!;
    await expect(database.db.update(taskVersions).set({ content: { ...original.content, statement: 'Changed' } }).where(eq(taskVersions.id, original.id))).rejects.toThrow();
    await expect(database.db.delete(taskVersions).where(eq(taskVersions.id, original.id))).rejects.toThrow();
    const [second] = await database.db.insert(taskVersions).values({
      taskId: original.taskId, version: 2, taskType: original.taskType, status: 'published',
      content: { ...original.content, statement: 'New version' }, answerSchema: original.answerSchema,
      evaluationRule: original.evaluationRule, provenance: original.provenance, publishedAt: original.publishedAt,
    }).returning();
    expect(second!.id).not.toBe(original.id);
    expect((await database.db.select().from(attempts).where(eq(attempts.id, attempt.id)))[0]?.taskVersionId).toBe(original.id);
    expect((await database.db.select().from(taskVersions).where(eq(taskVersions.id, original.id)))[0]?.content.statement).toBe(original.content.statement);
  });

  it('requires an owned, matching assignment for attempts', async () => {
    const student = await teaching.createStudent(fixtureIds.teacher, 'Owner');
    const other = await teaching.createStudent(fixtureIds.teacher, 'Other');
    const assignment = await teaching.createAssignment(fixtureIds.teacher, student.id, fixtureIds.version);
    await expect(attemptsService.start(student.id, fixtureIds.version, '')).rejects.toThrow('assignment is required');
    await expect(attemptsService.start(other.id, fixtureIds.version, assignment.id)).rejects.toThrow('does not grant access');
    await expect(attemptsService.start(student.id, other.id, assignment.id)).rejects.toThrow('does not grant access');
    const started = await attemptsService.start(student.id, fixtureIds.version, assignment.id);
    const replay = await attemptsService.start(student.id, fixtureIds.version, assignment.id);
    expect(replay.attempt.id).toBe(started.attempt.id);
    expect((await database.db.select().from(attempts).where(eq(attempts.assignmentId, assignment.id)))).toHaveLength(1);
  });

  it('rejects invalid answers without finalizing and persists a valid wrong answer with exact lineage', async () => {
    const { student, attempt } = await assignedAttempt();
    await expect(attemptsService.submit(student.id, attempt.id, 'bad', { optionId: 'unknown' })).rejects.toMatchObject({ code: 'INVALID_ANSWER', statusCode: 422 });
    await expect(attemptsService.submit(student.id, attempt.id, 'malformed', {})).rejects.toMatchObject({ code: 'INVALID_ANSWER' });
    expect((await database.db.select().from(attempts).where(eq(attempts.id, attempt.id)))[0]?.status).toBe('started');
    expect(await database.db.select().from(submissions).where(eq(submissions.attemptId, attempt.id))).toHaveLength(0);
    expect(await database.db.select().from(results).where(eq(results.attemptId, attempt.id))).toHaveLength(0);

    const submitted = await attemptsService.submit(student.id, attempt.id, 'valid', { optionId: 'b' });
    expect(submitted.result.outcome).toBe('incorrect');
    const [submission] = await database.db.select().from(submissions).where(eq(submissions.attemptId, attempt.id));
    expect(submitted.result.submissionId).toBe(submission!.id);
    expect(submission!.answer).toEqual({ optionId: 'b' });
    expect(submitted.result.evaluationRule).toBe('single-choice.v1');
    expect(attempt.taskVersionId).toBe(fixtureIds.version);
    expect((await database.db.select().from(auditEvents).where(and(eq(auditEvents.resourceId, attempt.id), eq(auditEvents.action, 'attempt_submitted'))))).toHaveLength(1);
  });

  it('rolls back submission state when its audit write fails', async () => {
    const { student, attempt } = await assignedAttempt();
    jest.spyOn(audit, 'recordIn').mockRejectedValueOnce(new Error('Injected audit failure'));

    await expect(attemptsService.submit(student.id, attempt.id, 'audit-failure', { optionId: 'a' }))
      .rejects.toThrow('Injected audit failure');

    expect((await database.db.select().from(attempts).where(eq(attempts.id, attempt.id)))[0]?.status).toBe('started');
    expect(await database.db.select().from(submissions).where(eq(submissions.attemptId, attempt.id))).toHaveLength(0);
    expect(await database.db.select().from(results).where(eq(results.attemptId, attempt.id))).toHaveLength(0);
    expect(await database.db.select().from(auditEvents)
      .where(and(eq(auditEvents.resourceId, attempt.id), eq(auditEvents.action, 'attempt_submitted')))).toHaveLength(0);
  });

  it('rejects a result referencing a submission from another attempt', async () => {
    const first = await assignedAttempt();
    const secondStudent = await teaching.createStudent(fixtureIds.teacher, 'Second');
    const secondAssignment = await teaching.createAssignment(fixtureIds.teacher, secondStudent.id, fixtureIds.version);
    const secondAttempt = await attemptsService.start(secondStudent.id, fixtureIds.version, secondAssignment.id);
    await attemptsService.submit(first.student.id, first.attempt.id, 'first', { optionId: 'a' });
    const [submission] = await database.db.select().from(submissions).where(eq(submissions.attemptId, first.attempt.id));
    await expect(database.db.insert(results).values({
      attemptId: secondAttempt.attempt.id, submissionId: submission!.id,
      evaluationRule: 'single-choice.v1', outcome: 'correct', isCorrect: true, score: 1,
    })).rejects.toThrow();
  });

  it('replays identical submissions, rejects changed payloads and serializes concurrent identical requests', async () => {
    const { student, attempt } = await assignedAttempt();
    const [first, second] = await Promise.all([
      attemptsService.submit(student.id, attempt.id, 'same', { optionId: 'a' }),
      attemptsService.submit(student.id, attempt.id, 'same', { optionId: 'a' }),
    ]);
    expect(first.result.id).toBe(second.result.id);
    expect([first.idempotentReplay, second.idempotentReplay].sort()).toEqual([false, true]);
    expect((await attemptsService.submit(student.id, attempt.id, 'same', { optionId: 'a' })).result.id).toBe(first.result.id);
    await expect(attemptsService.submit(student.id, attempt.id, 'same', { optionId: 'b' })).rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT', statusCode: 409 });
    await expect(attemptsService.submit(student.id, attempt.id, 'other-key', { optionId: 'a' })).rejects.toMatchObject({ code: 'ATTEMPT_ALREADY_SUBMITTED' });
    expect(await database.db.select().from(submissions).where(eq(submissions.attemptId, attempt.id))).toHaveLength(1);
    expect(await database.db.select().from(results).where(eq(results.attemptId, attempt.id))).toHaveLength(1);
  });

  it('enforces teacher and student relationships on service reads and writes', async () => {
    const { student, attempt } = await assignedAttempt();
    const unrelated = await teaching.createStudent(fixtureIds.teacher, 'Unrelated');
    const [otherTeacher] = await database.db.insert(users).values({ type: 'teacher', displayName: 'Unrelated teacher' }).returning();
    await expect(teaching.listResultsForTeacher(otherTeacher!.id, student.id)).rejects.toThrow('does not manage');
    await expect(teaching.createAssignment(otherTeacher!.id, student.id, fixtureIds.version)).rejects.toThrow('does not manage');
    await expect(attemptsService.submit(unrelated.id, attempt.id, 'foreign', { optionId: 'a' })).rejects.toThrow('Attempt not found');
    await attemptsService.submit(student.id, attempt.id, 'own', { optionId: 'a' });
    await expect(attemptsService.getResult(unrelated.id, attempt.id)).rejects.toThrow('Result not found');
    const studentAudit = await database.db.select().from(auditEvents).where(eq(auditEvents.action, 'student_relationship_created'));
    const assignmentAudit = await database.db.select().from(auditEvents).where(eq(auditEvents.action, 'assignment_created'));
    expect(studentAudit).toHaveLength(2);
    expect(assignmentAudit).toHaveLength(1);
  });
});
