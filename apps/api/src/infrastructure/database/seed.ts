import 'dotenv/config';
import { and, eq } from 'drizzle-orm';
import { developmentAuthEnabled, requiredEnvironment } from '../../common/config';
import { buildInternalFixture } from '../../modules/education/fixtures/internal-fixture';
import { DatabaseService } from './database';
import {
  courses, externalIdentities, skills, subjects, taskVersions, tasks,
  topics, teacherStudentRelationships, users,
} from './schema';

const id = (n: number) => `00000000-0000-4000-8000-${n.toString().padStart(12, '0')}`;
export const fixtureIds = {
  teacher: id(1), student: id(2), subject: id(3), course: id(4),
  topic: id(5), skill: id(6), task: id(7), version: id(8),
};

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
    await tx.insert(subjects).values({ id: fixtureIds.subject, ...fixture.subject }).onConflictDoNothing();
    await tx.insert(courses).values({ id: fixtureIds.course, subjectId: fixtureIds.subject, ...fixture.course }).onConflictDoNothing();
    await tx.insert(topics).values({ id: fixtureIds.topic, courseId: fixtureIds.course, ...fixture.topic }).onConflictDoNothing();
    await tx.insert(skills).values({ id: fixtureIds.skill, topicId: fixtureIds.topic, ...fixture.skill }).onConflictDoNothing();
    await tx.insert(tasks).values({
      id: fixtureIds.task, subjectId: fixtureIds.subject, courseId: fixtureIds.course,
      topicId: fixtureIds.topic, skillId: fixtureIds.skill, ...fixture.task,
    }).onConflictDoNothing();
    await tx.insert(taskVersions).values({ id: fixtureIds.version, taskId: fixtureIds.task, ...fixture.taskVersion }).onConflictDoNothing();
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
