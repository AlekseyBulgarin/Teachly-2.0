import 'dotenv/config';
import { and, eq } from 'drizzle-orm';
import { developmentAuthEnabled, requiredEnvironment } from '../../common/config';
import { buildInternalFixture } from '../../modules/education/fixtures/internal-fixture';
import { SKILL_EVIDENCE_RULE } from '../../modules/learning/learning.rules';
import { DatabaseService } from './database';
import { apiKeyPrefix, hashApiKey } from '../../modules/integrations/api-key.crypto';
import {
  apiKeys, assignments, courses, externalIdentities, externalUsers,
  integrations, knowledgeChunks, knowledgeDocumentVersions, knowledgeDocuments,
  knowledgeRawImports, knowledgeSources, learningEvents, memberships, organizations,
  results, skills, subjects, submissions, taskVersions, tasks, topics,
  teacherStudentRelationships, theoryMaterials, theoryMaterialTasks, theoryVersions,
  users, workspaces, attempts, skillEvidence,
  trainerSessions, trainerSessionItems,
} from './schema';

const id = (n: number) => `00000000-0000-4000-8000-${n.toString().padStart(12, '0')}`;
export const fixtureIds = {
  teacher: id(1), student: id(2), subject: id(3), course: id(4),
  topic: id(5), skill: id(6), task: id(7), version: id(8),
  organization: id(9), workspace: id(10), integration: id(11), externalUser: id(12),
  assignment: id(13), attempt: id(14), submission: id(15), result: id(16),
  knowledgeSource: id(17), knowledgeDocument: id(18), knowledgeRawImport: id(19),
  knowledgeVersion: id(20), knowledgeChunk: id(21), attemptEvent: id(22),
  resultEvent: id(23), evidence: id(24), apiKey: id(25),
  secondTask: id(26), secondVersion: id(27),
  firstTheory: id(28), firstTheoryVersion: id(29), firstTheoryTask: id(30),
  secondTheory: id(31), secondTheoryVersion: id(32), secondTheoryTask: id(33),
  secondSkill: id(34), trainerSession: id(35), trainerItem: id(36),
  trainerAttempt: id(240), trainerSubmission: id(241), trainerResult: id(242),
  trainerResultEvent: id(243), trainerEvidence: id(244),
};

type SeedAssessmentChain = {
  skillId: string;
  taskVersionId: string;
  at: string;
  selectedOptionId: string;
  correctOptionId: string;
  outcome: 'correct' | 'incorrect';
};

const SEED_ASSESSMENT_CHAINS: SeedAssessmentChain[] = [
  { skillId: fixtureIds.skill, taskVersionId: fixtureIds.version, at: '2026-09-03T10:00:00.000Z', selectedOptionId: 'b', correctOptionId: 'a', outcome: 'incorrect' },
  { skillId: fixtureIds.skill, taskVersionId: fixtureIds.version, at: '2026-09-06T10:00:00.000Z', selectedOptionId: 'b', correctOptionId: 'a', outcome: 'incorrect' },
  { skillId: fixtureIds.skill, taskVersionId: fixtureIds.version, at: '2026-09-08T10:00:00.000Z', selectedOptionId: 'a', correctOptionId: 'a', outcome: 'correct' },
  { skillId: fixtureIds.skill, taskVersionId: fixtureIds.version, at: '2026-09-11T10:00:00.000Z', selectedOptionId: 'b', correctOptionId: 'a', outcome: 'incorrect' },
  { skillId: fixtureIds.skill, taskVersionId: fixtureIds.version, at: '2026-09-14T10:00:00.000Z', selectedOptionId: 'b', correctOptionId: 'a', outcome: 'incorrect' },
  { skillId: fixtureIds.skill, taskVersionId: fixtureIds.version, at: '2026-09-17T10:00:00.000Z', selectedOptionId: 'b', correctOptionId: 'a', outcome: 'incorrect' },
  { skillId: fixtureIds.secondSkill, taskVersionId: fixtureIds.secondVersion, at: '2026-09-05T10:00:00.000Z', selectedOptionId: 'a', correctOptionId: 'b', outcome: 'incorrect' },
  { skillId: fixtureIds.secondSkill, taskVersionId: fixtureIds.secondVersion, at: '2026-09-07T10:00:00.000Z', selectedOptionId: 'a', correctOptionId: 'b', outcome: 'incorrect' },
  { skillId: fixtureIds.secondSkill, taskVersionId: fixtureIds.secondVersion, at: '2026-09-09T10:00:00.000Z', selectedOptionId: 'b', correctOptionId: 'b', outcome: 'correct' },
  { skillId: fixtureIds.secondSkill, taskVersionId: fixtureIds.secondVersion, at: '2026-09-12T10:00:00.000Z', selectedOptionId: 'b', correctOptionId: 'b', outcome: 'correct' },
  { skillId: fixtureIds.secondSkill, taskVersionId: fixtureIds.secondVersion, at: '2026-09-15T10:00:00.000Z', selectedOptionId: 'b', correctOptionId: 'b', outcome: 'correct' },
  { skillId: fixtureIds.secondSkill, taskVersionId: fixtureIds.secondVersion, at: '2026-09-18T10:00:00.000Z', selectedOptionId: 'b', correctOptionId: 'b', outcome: 'correct' },
];

export const demoApiKey = 'tlk_00000000000000dd.teachly-demo-key';

export const demoApiKeyScopes = [
  'assessment:read',
  'theory:read',
  'trainer:read',
  'trainer:write',
  'learner_intelligence:read',
  'whiteboard:read',
  'whiteboard:write',
] as const;

export async function seedDevelopmentFixtures(
  database: DatabaseService,
  options: { includeDemoRecords?: boolean; apiKey?: string; allowProductionDemo?: boolean } = {},
): Promise<void> {
  if (!developmentAuthEnabled() && !options.allowProductionDemo) {
    throw new Error('Development fixture seeding requires explicitly enabled development authentication');
  }
  const includeDemoRecords = options.includeDemoRecords ?? true;
  const seededApiKey = options.apiKey ?? demoApiKey;
  const fixture = buildInternalFixture();
  await database.db.transaction(async (tx) => {
    await tx.insert(users).values([
      { id: fixtureIds.teacher, type: 'teacher', displayName: 'Teachly Development Teacher' },
      { id: fixtureIds.student, type: 'student', displayName: 'Teachly Development Student' },
    ]).onConflictDoNothing();

    const identities = [
      { userId: fixtureIds.teacher, provider: 'development', subject: process.env.DEV_TEACHER_EXTERNAL_SUBJECT ?? 'dev-teacher' },
      { userId: fixtureIds.student, provider: 'development', subject: process.env.DEV_STUDENT_EXTERNAL_SUBJECT ?? 'dev-student' },
    ];
    await tx.insert(externalIdentities).values(identities).onConflictDoNothing();
    for (const identity of identities) {
      const [stored] = await tx.select().from(externalIdentities)
        .where(and(eq(externalIdentities.provider, identity.provider), eq(externalIdentities.subject, identity.subject))).limit(1);
      if (!stored || stored.provider !== identity.provider || stored.userId !== identity.userId) {
        throw new Error('Development fixture identity already maps to another user');
      }
    }
    await tx.insert(teacherStudentRelationships).values({ teacherId: fixtureIds.teacher, studentId: fixtureIds.student }).onConflictDoNothing();
    await tx.insert(organizations).values({
      id: fixtureIds.organization,
      name: 'Teachly Development Organization',
    }).onConflictDoNothing();
    await tx.insert(workspaces).values({
      id: fixtureIds.workspace,
      organizationId: fixtureIds.organization,
      name: 'Teachly Development Workspace',
    }).onConflictDoNothing();
    await tx.insert(memberships).values([
      { userId: fixtureIds.teacher, organizationId: fixtureIds.organization, role: 'organization_admin' },
      { userId: fixtureIds.student, organizationId: fixtureIds.organization, workspaceId: fixtureIds.workspace, role: 'educator' },
    ]).onConflictDoNothing();
    await tx.insert(subjects).values({ id: fixtureIds.subject, ...fixture.subject }).onConflictDoNothing();
    await tx.insert(courses).values({ id: fixtureIds.course, workspaceId: fixtureIds.workspace, subjectId: fixtureIds.subject, ...fixture.course }).onConflictDoNothing();
    await tx.insert(topics).values({ id: fixtureIds.topic, courseId: fixtureIds.course, ...fixture.topic }).onConflictDoNothing();
    await tx.insert(skills).values({ id: fixtureIds.skill, topicId: fixtureIds.topic, ...fixture.skill }).onConflictDoNothing();
    await tx.insert(tasks).values({
      id: fixtureIds.task, workspaceId: fixtureIds.workspace, subjectId: fixtureIds.subject,
      courseId: fixtureIds.course, topicId: fixtureIds.topic, skillId: fixtureIds.skill, ...fixture.task,
    }).onConflictDoNothing();
    await tx.insert(taskVersions).values({ id: fixtureIds.version, taskId: fixtureIds.task, workspaceId: fixtureIds.workspace, ...fixture.taskVersion }).onConflictDoNothing();
    if (!includeDemoRecords) return;

    await tx.insert(integrations).values({
      id: fixtureIds.integration,
      organizationId: fixtureIds.organization,
      workspaceId: fixtureIds.workspace,
      name: 'Demo Customer Platform',
    }).onConflictDoNothing();
    await tx.insert(apiKeys).values({
      id: fixtureIds.apiKey,
      organizationId: fixtureIds.organization,
      workspaceId: fixtureIds.workspace,
      integrationId: fixtureIds.integration,
      name: 'Demo reference client key',
      keyPrefix: seededApiKey.slice(0, seededApiKey.indexOf('.')),
      keyHash: hashApiKey(seededApiKey),
      scopes: [...demoApiKeyScopes],
    }).onConflictDoUpdate({
      target: apiKeys.id,
      set: {
        name: 'Demo reference client key',
        keyPrefix: seededApiKey.slice(0, seededApiKey.indexOf('.')),
        keyHash: hashApiKey(seededApiKey),
        scopes: [...demoApiKeyScopes],
        status: 'active',
        revokedAt: null,
      },
    });
    await tx.insert(externalUsers).values({
      id: fixtureIds.externalUser,
      organizationId: fixtureIds.organization,
      workspaceId: fixtureIds.workspace,
      integrationId: fixtureIds.integration,
      learnerId: fixtureIds.student,
      externalUserId: 'demo-learner-01',
    }).onConflictDoNothing();
    await tx.insert(skills).values({
      id: fixtureIds.secondSkill,
      topicId: fixtureIds.topic,
      name: 'Keep authority on the server',
    }).onConflictDoNothing();
    await tx.insert(tasks).values({
      id: fixtureIds.secondTask,
      workspaceId: fixtureIds.workspace,
      subjectId: fixtureIds.subject,
      courseId: fixtureIds.course,
      topicId: fixtureIds.topic,
      skillId: fixtureIds.secondSkill,
      sourceKind: 'internal_fixture',
    }).onConflictDoUpdate({ target: tasks.id, set: { skillId: fixtureIds.secondSkill } });
    await tx.insert(taskVersions).values({
      id: fixtureIds.secondVersion,
      taskId: fixtureIds.secondTask,
      workspaceId: fixtureIds.workspace,
      version: 1,
      taskType: 'single-choice',
      status: 'published',
      content: {
        statement: 'Which action keeps an educational evaluation authoritative?',
        options: [
          { id: 'a', label: 'Let the browser decide whether the answer is correct' },
          { id: 'b', label: 'Evaluate the submitted answer on the server' },
          { id: 'c', label: 'Store only the selected option in local state' },
        ],
        correctOptionId: 'b',
      },
      answerSchema: { type: 'single-choice', required: true },
      evaluationRule: 'single-choice.v1',
      provenance: {
        sourceKind: 'internal_fixture',
        sourceIdentifier: 'teachly-demo-authoritative-evaluation',
        licenseStatus: 'development_only',
        fixtureVersion: '1',
      },
      publishedAt: new Date('2026-01-01T00:01:00.000Z'),
    }).onConflictDoNothing();

    const theoryFixtures = [
      {
        materialId: fixtureIds.firstTheory,
        versionId: fixtureIds.firstTheoryVersion,
        linkId: fixtureIds.firstTheoryTask,
        taskId: fixtureIds.task,
        title: 'Deterministic evaluation',
        description: 'Why the same answer must produce the same result.',
        category: 'Evaluation',
        blocks: [
          { type: 'heading', text: 'A predictable learning rule' },
          { type: 'paragraph', text: 'A deterministic evaluator returns the same outcome for the same task version and answer.' },
          { type: 'callout', text: 'The server evaluates the answer; the browser only displays the result.' },
        ],
        publishedAt: new Date('2026-01-01T00:02:00.000Z'),
      },
      {
        materialId: fixtureIds.secondTheory,
        versionId: fixtureIds.secondTheoryVersion,
        linkId: fixtureIds.secondTheoryTask,
        taskId: fixtureIds.secondTask,
        title: 'Authoritative assessment',
        description: 'How Teachly keeps evaluation rules outside the client.',
        category: 'Architecture',
        blocks: [
          { type: 'heading', text: 'One source of truth' },
          { type: 'paragraph', text: 'The published task version and server-side rule define how a submission is evaluated.' },
          { type: 'list', items: ['The client sends an answer.', 'Teachly evaluates it.', 'The learner receives the recorded outcome.'] },
        ],
        publishedAt: new Date('2026-01-01T00:03:00.000Z'),
      },
    ];
    for (const theory of theoryFixtures) {
      const metadata = {
        title: theory.title,
        description: theory.description,
        category: theory.category,
        subjectId: fixtureIds.subject,
        courseId: fixtureIds.course,
        topicId: fixtureIds.topic,
        skillId: fixtureIds.skill,
        taskIds: [theory.taskId],
      };
      await tx.insert(theoryMaterials).values({
        id: theory.materialId,
        organizationId: fixtureIds.organization,
        workspaceId: fixtureIds.workspace,
        title: theory.title,
        description: theory.description,
        category: theory.category,
        subjectId: fixtureIds.subject,
        courseId: fixtureIds.course,
        topicId: fixtureIds.topic,
        skillId: fixtureIds.skill,
        status: 'published',
        createdByUserId: fixtureIds.teacher,
        createdAt: theory.publishedAt,
        updatedAt: theory.publishedAt,
      }).onConflictDoNothing();
      await tx.insert(theoryVersions).values({
        id: theory.versionId,
        materialId: theory.materialId,
        workspaceId: fixtureIds.workspace,
        version: 1,
        status: 'published',
        content: { blocks: theory.blocks },
        metadata,
        createdByUserId: fixtureIds.teacher,
        publishedByUserId: fixtureIds.teacher,
        publishedByPrincipal: 'seed:demo',
        publishedAt: theory.publishedAt,
        createdAt: theory.publishedAt,
        updatedAt: theory.publishedAt,
      }).onConflictDoNothing();
      await tx.insert(theoryMaterialTasks).values({
        id: theory.linkId,
        materialId: theory.materialId,
        workspaceId: fixtureIds.workspace,
        taskId: theory.taskId,
        createdAt: theory.publishedAt,
      }).onConflictDoNothing();
    }
    await tx.insert(assignments).values({
      id: fixtureIds.assignment,
      workspaceId: fixtureIds.workspace,
      teacherId: fixtureIds.teacher,
      studentId: fixtureIds.student,
      taskVersionId: fixtureIds.version,
    }).onConflictDoNothing();
    await tx.insert(attempts).values({
      id: fixtureIds.attempt,
      workspaceId: fixtureIds.workspace,
      integrationId: fixtureIds.integration,
      studentId: fixtureIds.student,
      taskVersionId: fixtureIds.version,
      assignmentId: fixtureIds.assignment,
      status: 'submitted',
      startedAt: new Date('2026-01-02T10:00:00.000Z'),
      submittedAt: new Date('2026-01-02T10:04:00.000Z'),
    }).onConflictDoUpdate({ target: attempts.id, set: { integrationId: fixtureIds.integration } });
    await tx.insert(submissions).values({
      id: fixtureIds.submission,
      attemptId: fixtureIds.attempt,
      workspaceId: fixtureIds.workspace,
      idempotencyKey: 'demo-submission-1',
      answer: { optionId: 'b' },
      createdAt: new Date('2026-01-02T10:04:00.000Z'),
    }).onConflictDoNothing();
    await tx.insert(results).values({
      id: fixtureIds.result,
      attemptId: fixtureIds.attempt,
      submissionId: fixtureIds.submission,
      workspaceId: fixtureIds.workspace,
      evaluationRule: 'single-choice.v1',
      outcome: 'incorrect',
      isCorrect: false,
      score: 0,
      details: { selectedOptionId: 'b', correctOptionId: 'a', learningHandoff: 'recorded' },
      evaluatedAt: new Date('2026-01-02T10:04:01.000Z'),
    }).onConflictDoUpdate({ target: results.id, set: {
      details: { selectedOptionId: 'b', correctOptionId: 'a', learningHandoff: 'recorded' },
    } });
    await tx.insert(learningEvents).values([
      {
        id: fixtureIds.attemptEvent,
        workspaceId: fixtureIds.workspace,
        integrationId: fixtureIds.integration,
        eventType: 'attempt_submitted',
        learnerId: fixtureIds.student,
        source: 'teachly_authoritative', sourceType: 'submission', sourceId: fixtureIds.submission,
        taskVersionId: fixtureIds.version, courseId: fixtureIds.course, skillId: fixtureIds.skill,
        occurredAt: new Date('2026-01-02T10:04:00.000Z'),
      },
      {
        id: fixtureIds.resultEvent,
        workspaceId: fixtureIds.workspace,
        integrationId: fixtureIds.integration,
        eventType: 'result_recorded',
        learnerId: fixtureIds.student,
        source: 'teachly_authoritative', sourceType: 'result', sourceId: fixtureIds.result,
        taskVersionId: fixtureIds.version, courseId: fixtureIds.course, skillId: fixtureIds.skill,
        outcome: 'incorrect', evaluationRule: 'single-choice.v1',
        occurredAt: new Date('2026-01-02T10:04:01.000Z'),
      },
    ]).onConflictDoUpdate({ target: [learningEvents.workspaceId, learningEvents.eventType, learningEvents.sourceType, learningEvents.sourceId], set: {
      integrationId: fixtureIds.integration,
    } });
    await tx.insert(skillEvidence).values({
      id: fixtureIds.evidence,
      workspaceId: fixtureIds.workspace,
      learnerId: fixtureIds.student,
      courseId: fixtureIds.course,
      skillId: fixtureIds.skill,
      learningEventId: fixtureIds.resultEvent,
      rule: SKILL_EVIDENCE_RULE,
      outcome: 'incorrect',
      occurredAt: new Date('2026-01-02T10:04:01.000Z'),
    }).onConflictDoNothing();

    const assessmentChains = SEED_ASSESSMENT_CHAINS.map((chain, index) => {
      const startedAt = new Date(chain.at);
      return {
        ...chain,
        index,
        startedAt,
        submittedAt: new Date(startedAt.getTime() + 120_000),
        evaluatedAt: new Date(startedAt.getTime() + 121_000),
        attemptId: id(100 + index),
        submissionId: id(120 + index),
        resultId: id(140 + index),
        learningEventId: id(160 + index),
        evidenceId: id(180 + index),
      };
    });
    const attemptRows: Array<typeof attempts.$inferInsert> = assessmentChains.map((row) => ({
      id: row.attemptId,
      workspaceId: fixtureIds.workspace,
      integrationId: fixtureIds.integration,
      studentId: fixtureIds.student,
      taskVersionId: row.taskVersionId,
      status: 'submitted',
      startedAt: row.startedAt,
      submittedAt: row.submittedAt,
    }));
    await tx.insert(attempts).values(attemptRows).onConflictDoNothing();
    const submissionRows: Array<typeof submissions.$inferInsert> = assessmentChains.map((row) => ({
      id: row.submissionId,
      attemptId: row.attemptId,
      workspaceId: fixtureIds.workspace,
      idempotencyKey: `demo-li-assessment-${row.index}`,
      answer: { optionId: row.selectedOptionId },
      createdAt: row.submittedAt,
    }));
    await tx.insert(submissions).values(submissionRows).onConflictDoNothing();
    const resultRows: Array<typeof results.$inferInsert> = assessmentChains.map((row) => ({
      id: row.resultId,
      attemptId: row.attemptId,
      submissionId: row.submissionId,
      workspaceId: fixtureIds.workspace,
      evaluationRule: 'single-choice.v1',
      outcome: row.outcome,
      isCorrect: row.outcome === 'correct',
      score: row.outcome === 'correct' ? 1 : 0,
      details: { selectedOptionId: row.selectedOptionId, correctOptionId: row.correctOptionId, learningHandoff: 'recorded' },
      evaluatedAt: row.evaluatedAt,
    }));
    await tx.insert(results).values(resultRows).onConflictDoNothing();
    const learningEventRows: Array<typeof learningEvents.$inferInsert> = assessmentChains.map((row) => ({
      id: row.learningEventId,
      workspaceId: fixtureIds.workspace,
      integrationId: fixtureIds.integration,
      eventType: 'result_recorded',
      learnerId: fixtureIds.student,
      source: 'teachly_authoritative',
      sourceType: 'result',
      sourceId: row.resultId,
      taskVersionId: row.taskVersionId,
      courseId: fixtureIds.course,
      skillId: row.skillId,
      outcome: row.outcome,
      evaluationRule: 'single-choice.v1',
      occurredAt: row.evaluatedAt,
      createdAt: row.evaluatedAt,
    }));
    await tx.insert(learningEvents).values(learningEventRows).onConflictDoNothing();
    const evidenceRows: Array<typeof skillEvidence.$inferInsert> = assessmentChains.map((row) => ({
      id: row.evidenceId,
      workspaceId: fixtureIds.workspace,
      learnerId: fixtureIds.student,
      courseId: fixtureIds.course,
      skillId: row.skillId,
      learningEventId: row.learningEventId,
      rule: SKILL_EVIDENCE_RULE,
      outcome: row.outcome,
      occurredAt: row.evaluatedAt,
      createdAt: row.evaluatedAt,
    }));
    await tx.insert(skillEvidence).values(evidenceRows).onConflictDoNothing();

    const trainerAttemptStartedAt = new Date('2026-09-20T10:00:00.000Z');
    const trainerSubmittedAt = new Date('2026-09-20T10:02:00.000Z');
    const trainerEvaluatedAt = new Date('2026-09-20T10:02:01.000Z');
    await tx.insert(attempts).values([{
      id: fixtureIds.trainerAttempt,
      workspaceId: fixtureIds.workspace,
      integrationId: fixtureIds.integration,
      studentId: fixtureIds.student,
      taskVersionId: fixtureIds.secondVersion,
      status: 'submitted',
      startedAt: trainerAttemptStartedAt,
      submittedAt: trainerSubmittedAt,
    } satisfies typeof attempts.$inferInsert]).onConflictDoNothing();
    await tx.insert(submissions).values([{
      id: fixtureIds.trainerSubmission,
      attemptId: fixtureIds.trainerAttempt,
      workspaceId: fixtureIds.workspace,
      idempotencyKey: 'demo-trainer-submission-1',
      answer: { optionId: 'b' },
      createdAt: trainerSubmittedAt,
    } satisfies typeof submissions.$inferInsert]).onConflictDoNothing();
    await tx.insert(results).values([{
      id: fixtureIds.trainerResult,
      attemptId: fixtureIds.trainerAttempt,
      submissionId: fixtureIds.trainerSubmission,
      workspaceId: fixtureIds.workspace,
      evaluationRule: 'single-choice.v1',
      outcome: 'correct',
      isCorrect: true,
      score: 1,
      details: { selectedOptionId: 'b', correctOptionId: 'b', learningHandoff: 'recorded' },
      evaluatedAt: trainerEvaluatedAt,
    } satisfies typeof results.$inferInsert]).onConflictDoNothing();
    await tx.insert(learningEvents).values([{
      id: fixtureIds.trainerResultEvent,
      workspaceId: fixtureIds.workspace,
      integrationId: fixtureIds.integration,
      eventType: 'result_recorded',
      learnerId: fixtureIds.student,
      source: 'teachly_authoritative',
      sourceType: 'result',
      sourceId: fixtureIds.trainerResult,
      taskVersionId: fixtureIds.secondVersion,
      courseId: fixtureIds.course,
      skillId: fixtureIds.secondSkill,
      outcome: 'correct',
      evaluationRule: 'single-choice.v1',
      occurredAt: trainerEvaluatedAt,
      createdAt: trainerEvaluatedAt,
    } satisfies typeof learningEvents.$inferInsert]).onConflictDoNothing();
    await tx.insert(skillEvidence).values([{
      id: fixtureIds.trainerEvidence,
      workspaceId: fixtureIds.workspace,
      learnerId: fixtureIds.student,
      courseId: fixtureIds.course,
      skillId: fixtureIds.secondSkill,
      learningEventId: fixtureIds.trainerResultEvent,
      rule: SKILL_EVIDENCE_RULE,
      outcome: 'correct',
      occurredAt: trainerEvaluatedAt,
      createdAt: trainerEvaluatedAt,
    } satisfies typeof skillEvidence.$inferInsert]).onConflictDoNothing();
    const [storedTrainerItem] = await tx.select({ id: trainerSessionItems.id }).from(trainerSessionItems)
      .where(eq(trainerSessionItems.id, fixtureIds.trainerItem)).limit(1);
    if (!storedTrainerItem) {
      await tx.insert(trainerSessions).values([{
        id: fixtureIds.trainerSession,
        organizationId: fixtureIds.organization,
        workspaceId: fixtureIds.workspace,
        integrationId: fixtureIds.integration,
        externalUserId: fixtureIds.externalUser,
        learnerId: fixtureIds.student,
        subjectId: fixtureIds.subject,
        courseId: fixtureIds.course,
        topicId: fixtureIds.topic,
        skillId: fixtureIds.secondSkill,
        idempotencyKey: 'demo-trainer-session-1',
        status: 'active',
        startedAt: new Date('2026-09-20T09:55:00.000Z'),
      } satisfies typeof trainerSessions.$inferInsert]).onConflictDoNothing();
      await tx.insert(trainerSessionItems).values([{
        id: fixtureIds.trainerItem,
        sessionId: fixtureIds.trainerSession,
        workspaceId: fixtureIds.workspace,
        position: 1,
        taskVersionId: fixtureIds.secondVersion,
        attemptId: fixtureIds.trainerAttempt,
        resultId: fixtureIds.trainerResult,
        status: 'submitted',
        createdAt: trainerAttemptStartedAt,
        updatedAt: trainerEvaluatedAt,
      } satisfies typeof trainerSessionItems.$inferInsert]).onConflictDoNothing();
      await tx.update(trainerSessions).set({
        status: 'completed',
        completedAt: new Date('2026-09-20T10:05:00.000Z'),
      }).where(eq(trainerSessions.id, fixtureIds.trainerSession));
    }

    await tx.insert(knowledgeSources).values({
      id: fixtureIds.knowledgeSource,
      workspaceId: fixtureIds.workspace,
      name: 'Demo approved curriculum',
      sourceType: 'manual',
      licenseStatus: 'allowed',
    }).onConflictDoNothing();
    await tx.insert(knowledgeDocuments).values({
      id: fixtureIds.knowledgeDocument,
      workspaceId: fixtureIds.workspace,
      sourceId: fixtureIds.knowledgeSource,
      documentKey: 'deterministic-evaluation',
      title: 'Deterministic evaluation basics',
    }).onConflictDoNothing();
    await tx.insert(knowledgeRawImports).values({
      id: fixtureIds.knowledgeRawImport,
      workspaceId: fixtureIds.workspace,
      documentId: fixtureIds.knowledgeDocument,
      idempotencyKey: 'demo-knowledge-1',
      rawContent: 'Approved demo curriculum material.',
      contentChecksum: 'demo-knowledge-raw',
      sourceReference: 'demo-curriculum',
    }).onConflictDoNothing();
    await tx.insert(knowledgeDocumentVersions).values({
      id: fixtureIds.knowledgeVersion,
      workspaceId: fixtureIds.workspace,
      documentId: fixtureIds.knowledgeDocument,
      rawImportId: fixtureIds.knowledgeRawImport,
      version: 1,
      normalizedContent: 'A deterministic evaluation produces the same result for the same input.',
      contentChecksum: 'demo-knowledge-normalized',
      licenseStatus: 'allowed',
      externalAiPermission: 'allowed',
      status: 'draft',
    }).onConflictDoNothing();
    const [storedChunk] = await tx.select({ id: knowledgeChunks.id }).from(knowledgeChunks)
      .where(eq(knowledgeChunks.id, fixtureIds.knowledgeChunk)).limit(1);
    if (!storedChunk) {
      await tx.insert(knowledgeChunks).values({
        id: fixtureIds.knowledgeChunk,
        workspaceId: fixtureIds.workspace,
        documentId: fixtureIds.knowledgeDocument,
        documentVersionId: fixtureIds.knowledgeVersion,
        ordinal: 0,
        section: 'Core concept',
        content: 'A deterministic evaluation produces the same result for the same input.',
        contentChecksum: 'demo-knowledge-chunk',
      });
    }
    await tx.update(knowledgeDocumentVersions).set({
      status: 'approved',
      approvedAt: new Date('2026-01-01T00:00:00.000Z'),
      approvedByPrincipal: 'seed:demo',
      approvalNote: 'Deterministic demo fixture',
    }).where(and(
      eq(knowledgeDocumentVersions.id, fixtureIds.knowledgeVersion),
      eq(knowledgeDocumentVersions.status, 'draft'),
    ));
  });
}

export async function seedProductionDemoFixtures(database: DatabaseService): Promise<void> {
  if (process.env.NODE_ENV !== 'production' || process.env.DEV_AUTH_ENABLED !== 'false') {
    throw new Error('Production demo seeding requires NODE_ENV=production and DEV_AUTH_ENABLED=false');
  }
  if (process.env.TEACHLY_DEMO_SEED_ENABLED !== 'true') {
    throw new Error('Production demo seeding requires TEACHLY_DEMO_SEED_ENABLED=true');
  }
  const productionApiKey = process.env.TEACHLY_DEMO_API_KEY;
  const productionKeySecret = productionApiKey?.split('.')[1];
  if (!productionApiKey || !apiKeyPrefix(productionApiKey) || !productionKeySecret || productionKeySecret.length < 32 || productionApiKey === demoApiKey) {
    throw new Error('TEACHLY_DEMO_API_KEY must be a non-development Teachly API key');
  }
  await seedDevelopmentFixtures(database, {
    apiKey: productionApiKey,
    allowProductionDemo: true,
  });
}

if (require.main === module) {
  void (async () => {
    requiredEnvironment();
    const database = new DatabaseService();
    try {
      await seedDevelopmentFixtures(database);
    } finally {
      await database.onModuleDestroy();
    }
  })().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
