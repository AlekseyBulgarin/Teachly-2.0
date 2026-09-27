import 'dotenv/config';
import { and, eq } from 'drizzle-orm';
import { developmentAuthEnabled, requiredEnvironment } from '../../common/config';
import { buildInternalFixture } from '../../modules/education/fixtures/internal-fixture';
import { DatabaseService } from './database';
import { hashApiKey } from '../../modules/integrations/api-key.crypto';
import {
  apiKeys, assignments, courses, externalIdentities, externalUsers,
  integrations, knowledgeChunks, knowledgeDocumentVersions, knowledgeDocuments,
  knowledgeRawImports, knowledgeSources, learningEvents, memberships, organizations,
  results, skills, subjects, submissions, taskVersions, tasks, topics,
  teacherStudentRelationships, users, workspaces, attempts, skillEvidence,
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
};

export const demoApiKey = 'tlk_00000000000000dd.teachly-demo-key';

export async function seedDevelopmentFixtures(database: DatabaseService): Promise<void> {
  if (!developmentAuthEnabled()) throw new Error('Development fixture seeding requires explicitly enabled development authentication');
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
      keyPrefix: demoApiKey.slice(0, demoApiKey.indexOf('.')),
      keyHash: hashApiKey(demoApiKey),
      scopes: ['external_users:read', 'external_users:write', 'remediation:write'],
    }).onConflictDoNothing();
    await tx.insert(externalUsers).values({
      id: fixtureIds.externalUser,
      organizationId: fixtureIds.organization,
      workspaceId: fixtureIds.workspace,
      integrationId: fixtureIds.integration,
      learnerId: fixtureIds.student,
      externalUserId: 'demo-learner-01',
    }).onConflictDoNothing();
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
      studentId: fixtureIds.student,
      taskVersionId: fixtureIds.version,
      assignmentId: fixtureIds.assignment,
      status: 'submitted',
      startedAt: new Date('2026-01-02T10:00:00.000Z'),
      submittedAt: new Date('2026-01-02T10:04:00.000Z'),
    }).onConflictDoNothing();
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
      details: { selectedOptionId: 'b', correctOptionId: 'a' },
      evaluatedAt: new Date('2026-01-02T10:04:01.000Z'),
    }).onConflictDoNothing();
    await tx.insert(learningEvents).values([
      {
        id: fixtureIds.attemptEvent,
        workspaceId: fixtureIds.workspace,
        eventType: 'attempt_submitted',
        learnerId: fixtureIds.student,
        source: 'teachly_authoritative', sourceType: 'submission', sourceId: fixtureIds.submission,
        taskVersionId: fixtureIds.version, courseId: fixtureIds.course, skillId: fixtureIds.skill,
        occurredAt: new Date('2026-01-02T10:04:00.000Z'),
      },
      {
        id: fixtureIds.resultEvent,
        workspaceId: fixtureIds.workspace,
        eventType: 'result_recorded',
        learnerId: fixtureIds.student,
        source: 'teachly_authoritative', sourceType: 'result', sourceId: fixtureIds.result,
        taskVersionId: fixtureIds.version, courseId: fixtureIds.course, skillId: fixtureIds.skill,
        outcome: 'incorrect', evaluationRule: 'single-choice.v1',
        occurredAt: new Date('2026-01-02T10:04:01.000Z'),
      },
    ]).onConflictDoNothing();
    await tx.insert(skillEvidence).values({
      id: fixtureIds.evidence,
      workspaceId: fixtureIds.workspace,
      learnerId: fixtureIds.student,
      courseId: fixtureIds.course,
      skillId: fixtureIds.skill,
      learningEventId: fixtureIds.resultEvent,
      rule: 'result-recorded.v1',
      outcome: 'incorrect',
      occurredAt: new Date('2026-01-02T10:04:01.000Z'),
    }).onConflictDoNothing();
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
