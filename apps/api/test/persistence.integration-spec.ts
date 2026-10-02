import { and, desc, eq, sql } from 'drizzle-orm';
import { DatabaseService } from '../src/infrastructure/database/database';
import { fixtureIds, seedDevelopmentFixtures } from '../src/infrastructure/database/seed';
import { applyMigrations } from '../src/infrastructure/database/migrate';
import { apiKeys, assignments, attempts, auditEvents, externalIdentities, learningEvents, results, skillEvidence, submissions, taskVersions, tasks, teacherStudentRelationships, theoryMaterials, theoryMaterialTasks, theoryVersions, trainerSessionItems, trainerSessions, users } from '../src/infrastructure/database/schema';
import { AttemptsService } from '../src/modules/attempts/attempts.service';
import { AuditService } from '../src/modules/audit/audit.service';
import { EducationService } from '../src/modules/education/education.service';
import { LearningService } from '../src/modules/learning/learning.service';
import { IdentityService } from '../src/modules/identity/identity.service';
import { TeachingService } from '../src/modules/teaching/teaching.service';
import { TenancyService } from '../src/modules/tenancy/tenancy.service';
import type { AuthenticationAdapter } from '../src/modules/identity/auth.port';
import { UsersService } from '../src/modules/users/users.service';
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
    const identity = new IdentityService(database, { resolve: async () => null } as AuthenticationAdapter);
    teaching = new TeachingService(database, education, audit, identity, new TenancyService(database), new UsersService(database));
    attemptsService = new AttemptsService(database, education, audit, teaching, new LearningService(database, teaching));
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
    await seedDevelopmentFixtures(database);
    expect((await database.db.select({ count: sql<number>`count(*)::int` }).from(users))[0]?.count).toBe(2);
    expect((await database.db.select({ count: sql<number>`count(*)::int` }).from(tasks))[0]?.count).toBe(2);
    expect((await database.db.select({ count: sql<number>`count(*)::int` }).from(taskVersions))[0]?.count).toBe(2);
    expect((await database.db.select({ count: sql<number>`count(*)::int` }).from(theoryMaterials))[0]?.count).toBe(2);
    expect((await database.db.select({ count: sql<number>`count(*)::int` }).from(theoryVersions))[0]?.count).toBe(2);
    expect((await database.db.select({ count: sql<number>`count(*)::int` }).from(theoryMaterialTasks))[0]?.count).toBe(2);
    const seededVersions = await database.db.select().from(taskVersions);
    expect(seededVersions.find((row) => row.id === fixtureIds.version)?.content.correctOptionId).toBe('a');
    expect(seededVersions.find((row) => row.id === fixtureIds.secondVersion)?.content.correctOptionId).toBe('b');
    const seededTheory = await database.db.select().from(theoryVersions);
    expect(seededTheory.map((row) => row.metadata.taskIds).sort()).toEqual([
      [fixtureIds.secondTask],
      [fixtureIds.task],
    ].sort());
    const [demoKey] = await database.db.select().from(apiKeys).where(eq(apiKeys.id, fixtureIds.apiKey));
    expect(demoKey?.scopes).toEqual([
      'assessment:read', 'theory:read', 'trainer:read', 'trainer:write', 'learner_intelligence:read',
    ]);
    expect(await database.db.select().from(attempts)).toHaveLength(14);
    expect(await database.db.select().from(submissions)).toHaveLength(14);
    expect(await database.db.select().from(results)).toHaveLength(14);
    expect(await database.db.select().from(learningEvents)).toHaveLength(15);
    expect(await database.db.select().from(skillEvidence)).toHaveLength(14);
    expect(await database.db.select().from(trainerSessions)).toHaveLength(1);
    expect(await database.db.select().from(trainerSessionItems)).toHaveLength(1);
    const skillAEvidence = await database.db.select().from(skillEvidence)
      .where(and(eq(skillEvidence.learnerId, fixtureIds.student), eq(skillEvidence.skillId, fixtureIds.skill)))
      .orderBy(desc(skillEvidence.occurredAt));
    expect(skillAEvidence).toHaveLength(7);
    expect(skillAEvidence.slice(0, 3).map((row) => row.outcome)).toEqual(['incorrect', 'incorrect', 'incorrect']);
    const skillBEvidence = await database.db.select().from(skillEvidence)
      .where(and(eq(skillEvidence.learnerId, fixtureIds.student), eq(skillEvidence.skillId, fixtureIds.secondSkill)))
      .orderBy(desc(skillEvidence.occurredAt));
    expect(skillBEvidence).toHaveLength(7);
    expect(skillBEvidence.slice(0, 3).map((row) => row.outcome)).toEqual(['correct', 'correct', 'correct']);
    const version = await database.db.select().from(taskVersions).where(eq(taskVersions.id, fixtureIds.version));
    expect(version[0]?.provenance.licenseStatus).toBe('development_only');
  });

  it('rolls back student, identity, relationship, and audit state as one unit', async () => {
    const beforeUsers = await database.db.select().from(users);
    const beforeIdentities = await database.db.select().from(externalIdentities);
    const beforeRelationships = await database.db.select().from(teacherStudentRelationships);
    jest.spyOn(audit, 'record').mockRejectedValueOnce(new Error('Injected student audit failure'));

    await expect(teaching.createStudent(fixtureIds.teacher, 'Rollback student'))
      .rejects.toThrow('Injected student audit failure');

    expect(await database.db.select().from(users)).toHaveLength(beforeUsers.length);
    expect(await database.db.select().from(externalIdentities)).toHaveLength(beforeIdentities.length);
    expect(await database.db.select().from(teacherStudentRelationships)).toHaveLength(beforeRelationships.length);
  });

  it('keeps published content immutable and attempts pinned to the exact version', async () => {
    const { attempt } = await assignedAttempt();
    const original = (await database.db.select().from(taskVersions).where(eq(taskVersions.id, fixtureIds.version)))[0]!;
    await expect(database.db.update(taskVersions).set({ content: { ...original.content, statement: 'Changed' } }).where(eq(taskVersions.id, original.id))).rejects.toThrow();
    await expect(database.db.delete(taskVersions).where(eq(taskVersions.id, original.id))).rejects.toThrow();
    const [second] = await database.db.insert(taskVersions).values({
      workspaceId: fixtureIds.workspace,
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

  it('enforces assignment and task-version lineage at the database boundary', async () => {
    const student = await teaching.createStudent(fixtureIds.teacher, 'Lineage student');
    const assignment = await teaching.createAssignment(fixtureIds.teacher, student.id, fixtureIds.version);
    const [original] = await database.db.select().from(taskVersions).where(eq(taskVersions.id, fixtureIds.version));
    const [secondVersion] = await database.db.insert(taskVersions).values({
      workspaceId: fixtureIds.workspace,
      taskId: original!.taskId,
      version: 2,
      taskType: original!.taskType,
      status: 'published',
      content: original!.content,
      answerSchema: original!.answerSchema,
      evaluationRule: original!.evaluationRule,
      provenance: original!.provenance,
      publishedAt: original!.publishedAt,
    }).returning();

    await expect(database.db.insert(attempts).values({
      workspaceId: fixtureIds.workspace,
      studentId: student.id,
      taskVersionId: secondVersion!.id,
      assignmentId: assignment.id,
    })).rejects.toThrow();

    await attemptsService.start(student.id, fixtureIds.version, assignment.id);
    await expect(database.db.update(assignments).set({ taskVersionId: secondVersion!.id })
      .where(eq(assignments.id, assignment.id))).rejects.toThrow();
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
    jest.spyOn(audit, 'record').mockRejectedValueOnce(new Error('Injected audit failure'));

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
      attemptId: secondAttempt.attempt.id, submissionId: submission!.id, workspaceId: fixtureIds.workspace,
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
    await expect(attemptsService.listResultsForTeacher(otherTeacher!.id, student.id)).rejects.toThrow('does not manage');
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
