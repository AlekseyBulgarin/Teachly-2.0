import { Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DatabaseService } from '../../infrastructure/database/database';
import { courses, skills, subjects, taskVersions, tasks, topics } from '../../infrastructure/database/schema';

@Injectable()
export class EducationService {
  constructor(private readonly database: DatabaseService) {}

  async getPublishedTaskVersion(taskVersionId: string) {
    const rows = await this.database.db
      .select({ taskVersion: taskVersions, task: tasks, subject: subjects, course: courses, topic: topics, skill: skills })
      .from(taskVersions)
      .innerJoin(tasks, eq(tasks.id, taskVersions.taskId))
      .innerJoin(subjects, eq(subjects.id, tasks.subjectId))
      .innerJoin(courses, eq(courses.id, tasks.courseId))
      .innerJoin(topics, eq(topics.id, tasks.topicId))
      .innerJoin(skills, eq(skills.id, tasks.skillId))
      .where(and(eq(taskVersions.id, taskVersionId), eq(taskVersions.status, 'published')))
      .limit(1);
    const row = rows[0];
    if (!row) throw new NotFoundException('Published task version not found');
    return row;
  }

  async listPublishedTaskVersions() {
    return this.database.db
      .select({ taskVersion: taskVersions, task: tasks, subject: subjects, course: courses, topic: topics, skill: skills })
      .from(taskVersions)
      .innerJoin(tasks, eq(tasks.id, taskVersions.taskId))
      .innerJoin(subjects, eq(subjects.id, tasks.subjectId))
      .innerJoin(courses, eq(courses.id, tasks.courseId))
      .innerJoin(topics, eq(topics.id, tasks.topicId))
      .innerJoin(skills, eq(skills.id, tasks.skillId))
      .where(eq(taskVersions.status, 'published'));
  }

  toPublicTaskVersion(taskVersion: typeof taskVersions.$inferSelect) {
    const content = taskVersion.content as { statement: string; options: Array<{ id: string; label: string }>; correctOptionId: string };
    return {
      ...taskVersion,
      content: { statement: content.statement, options: content.options },
    };
  }
}
