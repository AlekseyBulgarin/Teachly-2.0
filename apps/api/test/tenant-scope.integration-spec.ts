import { and, eq } from 'drizzle-orm';
import { DatabaseService } from '../src/infrastructure/database/database';
import { fixtureIds } from '../src/infrastructure/database/seed';
import {
  assignments,
  attempts,
  auditEvents,
  courses,
  memberships,
  skills,
  subjects,
  taskVersions,
  tasks,
  topics,
  users,
} from '../src/infrastructure/database/schema';
import { AttemptsService } from '../src/modules/attempts/attempts.service';
import { AuditService } from '../src/modules/audit/audit.service';
import { EducationService } from '../src/modules/education/education.service';
import { IdentityService } from '../src/modules/identity/identity.service';
import type { AuthenticationAdapter } from '../src/modules/identity/auth.port';
import { IntegrationsService } from '../src/modules/integrations/integrations.service';
import { LearningService } from '../src/modules/learning/learning.service';
import { TeachingService } from '../src/modules/teaching/teaching.service';
import { TenancyService } from '../src/modules/tenancy/tenancy.service';
import { UsersService } from '../src/modules/users/users.service';
import { resetTestDatabase, testDatabase } from './postgres-test';

jest.setTimeout(120_000);

describe('Core resources are workspace scoped (PostgreSQL)', () => {
  let database: DatabaseService;
  let tenancy: TenancyService;
  let integrations: IntegrationsService;
  let education: EducationService;
  let teaching: TeachingService;
  let attemptsService: AttemptsService;
  let audit: AuditService;

  beforeEach(async () => {
    database = testDatabase();
    await resetTestDatabase(database);
    audit = new AuditService(database);
    tenancy = new TenancyService(database);
    integrations = new IntegrationsService(database, tenancy, audit);
    education = new EducationService(database);
    teaching = new TeachingService(
      database,
      education,
      audit,
      new IdentityService(database, { resolve: async () => null } as AuthenticationAdapter),
      tenancy,
      new UsersService(database),
    );
    attemptsService = new AttemptsService(database, education, audit, teaching, new LearningService(database, teaching));
  });

  afterEach(async () => { await database?.onModuleDestroy(); });

  async function tenantFixture(name: string) {
    const organization = await tenancy.createOrganization(name);
    const workspace = await tenancy.createWorkspace(organization.id, `${name} workspace`);
    const integration = await integrations.createIntegration(organization.id, workspace.id, `${name} integration`);
    const key = await integrations.createApiKey({
      organizationId: organization.id,
      workspaceId: workspace.id,
      integrationId: integration.id,
      name: `${name} key`,
      scopes: ['external_users:read', 'external_users:write'],
    });
    const context = await integrations.authenticateApiKey(key.secret);
    if (!context) throw new Error('Tenant fixture API key did not authenticate');
    await tenancy.createMembership({
      userId: fixtureIds.teacher,
      organizationId: organization.id,
      workspaceId: workspace.id,
      role: 'educator',
    });
    const taskVersion = await createWorkspaceTask(workspace.id, name.toLowerCase().replace(/\W+/g, '-'));
    return { organization, workspace, context, taskVersion };
  }

  async function createWorkspaceTask(workspaceId: string, slug: string) {
    const [subject] = await database.db.insert(subjects)
      .values({ code: `subject-${slug}`, name: `Subject ${slug}` }).returning();
    const [course] = await database.db.insert(courses)
      .values({ workspaceId, subjectId: subject!.id, name: `Course ${slug}` }).returning();
    const [topic] = await database.db.insert(topics)
      .values({ courseId: course!.id, name: `Topic ${slug}` }).returning();
    const [skill] = await database.db.insert(skills)
      .values({ topicId: topic!.id, name: `Skill ${slug}` }).returning();
    const [task] = await database.db.insert(tasks).values({
      workspaceId,
      subjectId: subject!.id,
      courseId: course!.id,
      topicId: topic!.id,
      skillId: skill!.id,
      sourceKind: 'internal_fixture',
    }).returning();
    const [version] = await database.db.insert(taskVersions).values({
      workspaceId,
      taskId: task!.id,
      version: 1,
      taskType: 'single-choice',
      status: 'published',
      content: {
        statement: `Statement for ${slug}`,
        options: [{ id: 'a', label: 'Yes' }, { id: 'b', label: 'No' }],
        correctOptionId: 'a',
      },
      answerSchema: { type: 'single-choice', required: true },
      evaluationRule: 'single-choice.v1',
      provenance: {
        sourceKind: 'internal_fixture',
        sourceIdentifier: slug,
        licenseStatus: 'development_only',
        fixtureVersion: '1',
      },
      publishedAt: new Date('2026-01-01T00:00:00.000Z'),
    }).returning();
    return { subject, course, topic, skill, task, version };
  }

  it('creates assignments only inside the workspace that owns the task version', async () => {
    const tenantA = await tenantFixture('Organization A');
    const tenantB = await tenantFixture('Organization B');

    const scoped = await teaching.createAssignment(
      fixtureIds.teacher,
      fixtureIds.student,
      tenantA.taskVersion.version!.id,
      tenantA.context,
    );
    const [stored] = await database.db.select().from(assignments).where(eq(assignments.id, scoped.id));
    expect(stored?.workspaceId).toBe(tenantA.workspace.id);

    await expect(teaching.createAssignment(
      fixtureIds.teacher,
      fixtureIds.student,
      tenantA.taskVersion.version!.id,
      tenantB.context,
    )).rejects.toThrow('Published task version not found');

    const unscoped = await teaching.createAssignment(fixtureIds.teacher, fixtureIds.student, fixtureIds.version);
    expect((await database.db.select().from(assignments).where(eq(assignments.id, unscoped.id)))[0]?.workspaceId)
      .toBe(fixtureIds.workspace);
  });

  it('fails closed when the acting user is not a member of the requesting workspace', async () => {
    const tenantA = await tenantFixture('Organization A');
    const tenantB = await tenantFixture('Organization B');
    const organizationB = tenantB.organization;
    await database.db.delete(memberships).where(and(
      eq(memberships.userId, fixtureIds.teacher),
      eq(memberships.organizationId, organizationB.id),
    ));

    await expect(teaching.createAssignment(
      fixtureIds.teacher,
      fixtureIds.student,
      tenantB.taskVersion.version!.id,
      tenantB.context,
    )).rejects.toThrow('User is not a member of this workspace');
    await expect(teaching.createAssignment(
      fixtureIds.teacher,
      fixtureIds.student,
      tenantA.taskVersion.version!.id,
      tenantA.context,
    )).resolves.toBeDefined();
  });

  it('keeps attempts, submissions, and results invisible to a foreign workspace context', async () => {
    const tenantA = await tenantFixture('Organization A');
    const tenantB = await tenantFixture('Organization B');
    const assignment = await teaching.createAssignment(
      fixtureIds.teacher,
      fixtureIds.student,
      tenantA.taskVersion.version!.id,
      tenantA.context,
    );

    await expect(attemptsService.start(
      fixtureIds.student,
      tenantA.taskVersion.version!.id,
      assignment.id,
      tenantB.context,
    )).rejects.toThrow('Assignment does not grant access');

    const started = await attemptsService.start(
      fixtureIds.student,
      tenantA.taskVersion.version!.id,
      assignment.id,
      tenantA.context,
    );
    const submitted = await attemptsService.submit(
      fixtureIds.student,
      started.attempt.id,
      'tenant-a-answer',
      { optionId: 'a' },
      tenantA.context,
    );
    expect(submitted.result.id).toBeDefined();

    await expect(attemptsService.getResult(
      fixtureIds.student,
      started.attempt.id,
      tenantB.context,
    )).rejects.toThrow('Result not found');
    await expect(attemptsService.submit(
      fixtureIds.student,
      started.attempt.id,
      'tenant-b-answer',
      { optionId: 'b' },
      tenantB.context,
    )).rejects.toThrow('Attempt not found');
    await expect(attemptsService.listResultsForTeacher(
      fixtureIds.teacher,
      fixtureIds.student,
      tenantB.context,
    )).resolves.toEqual([]);

    const tenantAResults = await attemptsService.listResultsForTeacher(
      fixtureIds.teacher,
      fixtureIds.student,
      tenantA.context,
    );
    expect(tenantAResults.map((row) => row.attempt.id)).toContain(started.attempt.id);

    const [outsider] = await database.db.insert(users)
      .values({ type: 'teacher', displayName: 'Outsider teacher' }).returning();
    await expect(attemptsService.listResultsForTeacher(
      outsider!.id,
      fixtureIds.student,
      tenantA.context,
    )).rejects.toThrow('User is not a member of this workspace');
  });

  it('keeps idempotent retries inside the workspace that originated them', async () => {
    const tenantA = await tenantFixture('Organization A');
    const tenantB = await tenantFixture('Organization B');
    const assignment = await teaching.createAssignment(
      fixtureIds.teacher,
      fixtureIds.student,
      tenantA.taskVersion.version!.id,
      tenantA.context,
    );
    const started = await attemptsService.start(
      fixtureIds.student,
      tenantA.taskVersion.version!.id,
      assignment.id,
      tenantA.context,
    );

    const [first, second] = await Promise.all([
      attemptsService.submit(fixtureIds.student, started.attempt.id, 'same', { optionId: 'a' }, tenantA.context),
      attemptsService.submit(fixtureIds.student, started.attempt.id, 'same', { optionId: 'a' }, tenantA.context),
    ]);
    expect(first.result.id).toBe(second.result.id);
    expect([first.idempotentReplay, second.idempotentReplay].sort()).toEqual([false, true]);
    await expect(attemptsService.submit(
      fixtureIds.student,
      started.attempt.id,
      'same',
      { optionId: 'b' },
      tenantB.context,
    )).rejects.toThrow('Attempt not found');
  });

  it('rejects cross-workspace lineage at the database boundary', async () => {
    const tenantA = await tenantFixture('Organization A');
    const tenantB = await tenantFixture('Organization B');
    const assignment = await teaching.createAssignment(
      fixtureIds.teacher,
      fixtureIds.student,
      tenantA.taskVersion.version!.id,
      tenantA.context,
    );
    const started = await attemptsService.start(
      fixtureIds.student,
      tenantA.taskVersion.version!.id,
      assignment.id,
      tenantA.context,
    );

    await expect(database.db.insert(attempts).values({
      studentId: fixtureIds.student,
      taskVersionId: tenantA.taskVersion.version!.id,
      assignmentId: assignment.id,
      workspaceId: tenantB.workspace.id,
    })).rejects.toThrow();
    await expect(database.db.insert(assignments).values({
      teacherId: fixtureIds.teacher,
      studentId: fixtureIds.student,
      taskVersionId: tenantA.taskVersion.version!.id,
      workspaceId: tenantB.workspace.id,
    })).rejects.toThrow();
    await expect(database.db.insert(taskVersions).values({
      taskId: tenantA.taskVersion.task!.id,
      workspaceId: tenantB.workspace.id,
      version: 2,
      taskType: 'single-choice',
      status: 'published',
      content: {
        statement: 'Foreign workspace version',
        options: [{ id: 'a', label: 'Yes' }, { id: 'b', label: 'No' }],
        correctOptionId: 'a',
      },
      answerSchema: { type: 'single-choice', required: true },
      evaluationRule: 'single-choice.v1',
      provenance: {
        sourceKind: 'internal_fixture',
        sourceIdentifier: 'foreign-workspace-version',
        licenseStatus: 'development_only',
        fixtureVersion: '1',
      },
      publishedAt: new Date('2026-01-01T00:00:00.000Z'),
    })).rejects.toThrow();

    const [storedAttempt] = await database.db.select().from(attempts)
      .where(eq(attempts.id, started.attempt.id));
    expect(storedAttempt?.workspaceId).toBe(tenantA.workspace.id);
  });

  it('attributes tenant-scoped activity to its workspace and scopes published reads', async () => {
    const tenantA = await tenantFixture('Organization A');
    const tenantB = await tenantFixture('Organization B');
    const assignment = await teaching.createAssignment(
      fixtureIds.teacher,
      fixtureIds.student,
      tenantA.taskVersion.version!.id,
      tenantA.context,
    );
    const started = await attemptsService.start(
      fixtureIds.student,
      tenantA.taskVersion.version!.id,
      assignment.id,
      tenantA.context,
    );
    await attemptsService.submit(
      fixtureIds.student,
      started.attempt.id,
      'audit',
      { optionId: 'a' },
      tenantA.context,
    );

    const scoped = await education.listPublishedTaskVersions(tenantA.context);
    expect(scoped.map((row) => row.taskVersion.id)).toEqual([tenantA.taskVersion.version!.id]);
    expect(await education.findPublishedTaskVersion(tenantB.taskVersion.version!.id, tenantA.context)).toBeNull();

    const assignmentAudit = await database.db.select().from(auditEvents)
      .where(and(
        eq(auditEvents.action, 'assignment_created'),
        eq(auditEvents.resourceId, assignment.id),
      ));
    expect(assignmentAudit).toHaveLength(1);
    expect(assignmentAudit[0]?.workspaceId).toBe(tenantA.workspace.id);

    const attemptAudit = await database.db.select().from(auditEvents)
      .where(eq(auditEvents.action, 'attempt_submitted'));
    expect(attemptAudit).toHaveLength(1);
    expect(attemptAudit[0]?.workspaceId).toBe(tenantA.workspace.id);
  });
});
