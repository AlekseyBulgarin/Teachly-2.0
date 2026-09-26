import { eq } from 'drizzle-orm';
import { DatabaseService } from '../src/infrastructure/database/database';
import { fixtureIds } from '../src/infrastructure/database/seed';
import {
  courses,
  learningEvents,
  results,
  skillEvidence,
  subjects,
  submissions,
  skills,
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
import {
  LEARNING_STATE_RECENT_WINDOW,
  LEARNING_STATE_RULE,
  SKILL_EVIDENCE_RULE,
} from '../src/modules/learning/learning.rules';
import { LearningService } from '../src/modules/learning/learning.service';
import type { ResultFactsInput } from '../src/modules/learning/learning.types';
import { TeachingService } from '../src/modules/teaching/teaching.service';
import { TenancyService } from '../src/modules/tenancy/tenancy.service';
import { UsersService } from '../src/modules/users/users.service';
import { resetTestDatabase, testDatabase } from './postgres-test';

jest.setTimeout(180_000);

describe('Learning events, skill evidence, and learning state (PostgreSQL)', () => {
  let database: DatabaseService;
  let tenancy: TenancyService;
  let integrations: IntegrationsService;
  let teaching: TeachingService;
  let attemptsService: AttemptsService;
  let learning: LearningService;

  beforeEach(async () => {
    database = testDatabase();
    await resetTestDatabase(database);
    const audit = new AuditService(database);
    tenancy = new TenancyService(database);
    integrations = new IntegrationsService(database, tenancy, audit);
    const education = new EducationService(database);
    teaching = new TeachingService(
      database,
      education,
      audit,
      new IdentityService(database, { resolve: async () => null } as AuthenticationAdapter),
      tenancy,
      new UsersService(database),
    );
    learning = new LearningService(database, teaching);
    attemptsService = new AttemptsService(database, education, audit, teaching, learning);
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

  async function submitAnswers(
    tenant: Awaited<ReturnType<typeof tenantFixture>>,
    answers: string[],
  ): Promise<string[]> {
    const outcomes: string[] = [];
    for (const optionId of answers) {
      const assignment = await teaching.createAssignment(
        fixtureIds.teacher,
        fixtureIds.student,
        tenant.taskVersion.version!.id,
        tenant.context,
      );
      const started = await attemptsService.start(
        fixtureIds.student,
        tenant.taskVersion.version!.id,
        assignment.id,
        tenant.context,
      );
      const submitted = await attemptsService.submit(
        fixtureIds.student,
        started.attempt.id,
        `answer-${assignment.id}`,
        { optionId },
        tenant.context,
      );
      outcomes.push(submitted.result.outcome);
    }
    return outcomes;
  }

  function factsFor(tenant: Awaited<ReturnType<typeof tenantFixture>>): ResultFactsInput {
    return {
      workspaceId: tenant.workspace.id,
      learnerId: fixtureIds.student,
      taskVersionId: tenant.taskVersion.version!.id,
      courseId: tenant.taskVersion.course!.id,
      skillId: tenant.taskVersion.skill!.id,
      submissionId: '11111111-1111-4111-8111-111111111111',
      resultId: '22222222-2222-4222-8222-222222222222',
      outcome: 'correct',
      evaluationRule: 'single-choice.v1',
      occurredAt: new Date('2026-02-01T10:00:00.000Z'),
    };
  }

  it('records learning facts traceable to the submission and result that produced them', async () => {
    const tenant = await tenantFixture('Organization A');
    const outcomes = await submitAnswers(tenant, ['a']);
    expect(outcomes).toEqual(['correct']);

    const [storedSubmission] = await database.db.select().from(submissions);
    const [storedResult] = await database.db.select().from(results);
    const events = await database.db.select().from(learningEvents)
      .where(eq(learningEvents.workspaceId, tenant.workspace.id));
    expect(events).toHaveLength(2);

    const attemptEvent = events.find((event) => event.eventType === 'attempt_submitted');
    const resultEvent = events.find((event) => event.eventType === 'result_recorded');
    expect(attemptEvent).toBeDefined();
    expect(resultEvent).toBeDefined();
    expect(attemptEvent).toMatchObject({
      source: 'teachly_authoritative',
      sourceType: 'submission',
      sourceId: storedSubmission!.id,
      learnerId: fixtureIds.student,
      taskVersionId: tenant.taskVersion.version!.id,
      courseId: tenant.taskVersion.course!.id,
      skillId: tenant.taskVersion.skill!.id,
      outcome: null,
      evaluationRule: null,
    });
    expect(resultEvent).toMatchObject({
      source: 'teachly_authoritative',
      sourceType: 'result',
      sourceId: storedResult!.id,
      outcome: 'correct',
      evaluationRule: 'single-choice.v1',
    });
  });

  it('ingests the same source operation once and reproduces its evidence', async () => {
    const tenant = await tenantFixture('Organization A');
    const facts = factsFor(tenant);

    const first = await learning.recordResultFacts(facts);
    expect(first.evidence).not.toBeNull();
    expect(first.evidence!.rule).toBe(SKILL_EVIDENCE_RULE);

    const replay = await learning.recordResultFacts(facts);
    expect(replay.attemptEvent.id).toBe(first.attemptEvent.id);
    expect(replay.resultEvent.id).toBe(first.resultEvent.id);

    await database.db.delete(skillEvidence).where(eq(skillEvidence.workspaceId, tenant.workspace.id));
    const regenerated = await learning.recordResultFacts(facts);

    const storedEvents = await database.db.select().from(learningEvents)
      .where(eq(learningEvents.workspaceId, tenant.workspace.id));
    const storedEvidence = await database.db.select().from(skillEvidence)
      .where(eq(skillEvidence.workspaceId, tenant.workspace.id));
    expect(storedEvents).toHaveLength(2);
    expect(storedEvidence).toHaveLength(1);
    expect(regenerated.evidence).toMatchObject({
      learningEventId: first.resultEvent.id,
      rule: SKILL_EVIDENCE_RULE,
      outcome: 'correct',
      occurredAt: facts.occurredAt,
    });
    expect(regenerated.evidence!.learnerId).toBe(fixtureIds.student);
    expect(regenerated.evidence!.courseId).toBe(tenant.taskVersion.course!.id);
  });

  it('projects explainable learning state from evidence without any AI involvement', async () => {
    const tenant = await tenantFixture('Organization A');
    const skillId = tenant.taskVersion.skill!.id;

    const empty = await learning.getLearningStateForTeacher(
      fixtureIds.teacher,
      fixtureIds.student,
      skillId,
      tenant.context,
    );
    expect(empty).toMatchObject({
      rule: LEARNING_STATE_RULE,
      evidenceCount: 0,
      recentOutcomes: [],
      lastObservedAt: null,
      status: 'insufficient_evidence',
      courseId: null,
    });

    const outcomes = await submitAnswers(tenant, ['a', 'a', 'b']);
    expect(outcomes).toEqual(['correct', 'correct', 'incorrect']);

    const state = await learning.getLearningStateForTeacher(
      fixtureIds.teacher,
      fixtureIds.student,
      skillId,
      tenant.context,
    );
    expect(state.evidenceCount).toBe(3);
    expect(state.recentOutcomes).toHaveLength(LEARNING_STATE_RECENT_WINDOW);
    expect(state.recentOutcomes[0]).toBe('incorrect');
    expect(state.recentOutcomes.slice(1)).toEqual(['correct', 'correct']);
    expect(state.status).toBe('showing_progress');
    expect(state.lastObservedAt).toBeInstanceOf(Date);
    expect(state.courseId).toBe(tenant.taskVersion.course!.id);
    expect(state.explanation.reason).toBe('2 of the last 3 outcomes were correct');
    expect(state.explanation.evidenceReferences).toHaveLength(LEARNING_STATE_RECENT_WINDOW);
  });

  it('keeps learning state inside the workspace that produced it', async () => {
    const tenantA = await tenantFixture('Organization A');
    const tenantB = await tenantFixture('Organization B');
    const skillId = tenantA.taskVersion.skill!.id;
    await submitAnswers(tenantA, ['a', 'a', 'b']);

    const scoped = await learning.getLearningStateForTeacher(
      fixtureIds.teacher,
      fixtureIds.student,
      skillId,
      tenantA.context,
    );
    expect(scoped.evidenceCount).toBe(3);
    expect(scoped.workspaceId).toBe(tenantA.workspace.id);

    const foreign = await learning.getLearningStateForTeacher(
      fixtureIds.teacher,
      fixtureIds.student,
      skillId,
      tenantB.context,
    );
    expect(foreign.evidenceCount).toBe(0);
    expect(foreign.status).toBe('insufficient_evidence');
    expect(foreign.workspaceId).toBe(tenantB.workspace.id);

    const [outsider] = await database.db.insert(users)
      .values({ type: 'teacher', displayName: 'Outsider teacher' }).returning();
    await expect(learning.getLearningStateForTeacher(
      outsider!.id,
      fixtureIds.student,
      skillId,
      tenantA.context,
    )).rejects.toThrow('User is not a member of this workspace');
  });

  it('rejects cross-workspace learning facts at the database boundary', async () => {
    const tenantA = await tenantFixture('Organization A');
    const tenantB = await tenantFixture('Organization B');

    await expect(database.db.insert(learningEvents).values({
      workspaceId: tenantB.workspace.id,
      eventType: 'attempt_submitted',
      learnerId: fixtureIds.student,
      source: 'teachly_authoritative',
      sourceType: 'submission',
      sourceId: '33333333-3333-4333-8333-333333333333',
      taskVersionId: tenantA.taskVersion.version!.id,
      courseId: tenantA.taskVersion.course!.id,
      skillId: tenantA.taskVersion.skill!.id,
    })).rejects.toThrow();

    const facts = factsFor(tenantA);
    const stored = await learning.recordResultFacts(facts);
    await expect(database.db.insert(skillEvidence).values({
      workspaceId: tenantB.workspace.id,
      learnerId: fixtureIds.student,
      courseId: tenantA.taskVersion.course!.id,
      skillId: tenantA.taskVersion.skill!.id,
      learningEventId: stored.resultEvent.id,
      rule: SKILL_EVIDENCE_RULE,
      outcome: 'correct',
      occurredAt: facts.occurredAt!,
    })).rejects.toThrow();
  });
});
