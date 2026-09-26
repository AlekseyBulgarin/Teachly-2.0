import { Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DatabaseService } from '../../infrastructure/database/database';
import { courses, skills, subjects, taskVersions, tasks, topics } from '../../infrastructure/database/schema';
import type { PublishedTaskContext, PublishedTaskVersion, PublicTaskVersion } from './education.types';

@Injectable()
export class EducationService {
  constructor(private readonly database: DatabaseService) {}

  async findPublishedTaskVersion(taskVersionId: string): Promise<PublishedTaskContext | null> {
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
    return row ? this.toPublishedTaskContext(row) : null;
  }

  async getPublishedTaskVersion(taskVersionId: string): Promise<PublishedTaskContext> {
    const task = await this.findPublishedTaskVersion(taskVersionId);
    if (!task) throw new NotFoundException('Published task version not found');
    return task;
  }

  async listPublishedTaskVersions(): Promise<PublishedTaskContext[]> {
    const rows = await this.database.db
      .select({ taskVersion: taskVersions, task: tasks, subject: subjects, course: courses, topic: topics, skill: skills })
      .from(taskVersions)
      .innerJoin(tasks, eq(tasks.id, taskVersions.taskId))
      .innerJoin(subjects, eq(subjects.id, tasks.subjectId))
      .innerJoin(courses, eq(courses.id, tasks.courseId))
      .innerJoin(topics, eq(topics.id, tasks.topicId))
      .innerJoin(skills, eq(skills.id, tasks.skillId))
      .where(eq(taskVersions.status, 'published'));
    return rows.map((row) => this.toPublishedTaskContext(row));
  }

  toPublicTaskVersion(taskVersion: PublishedTaskVersion): PublicTaskVersion {
    return {
      ...taskVersion,
      content: { statement: taskVersion.content.statement, options: taskVersion.content.options },
    };
  }

  private toPublishedTaskContext(row: {
    taskVersion: typeof taskVersions.$inferSelect;
    task: typeof tasks.$inferSelect;
    subject: typeof subjects.$inferSelect;
    course: typeof courses.$inferSelect;
    topic: typeof topics.$inferSelect;
    skill: typeof skills.$inferSelect;
  }): PublishedTaskContext {
    return {
      taskVersion: {
        id: row.taskVersion.id,
        taskId: row.taskVersion.taskId,
        version: row.taskVersion.version,
        taskType: row.taskVersion.taskType,
        status: 'published',
        content: row.taskVersion.content,
        evaluationRule: row.taskVersion.evaluationRule,
        publishedAt: row.taskVersion.publishedAt!,
        createdAt: row.taskVersion.createdAt,
      },
      task: {
        id: row.task.id,
        subjectId: row.task.subjectId,
        courseId: row.task.courseId,
        topicId: row.task.topicId,
        skillId: row.task.skillId,
      },
      subject: { id: row.subject.id, code: row.subject.code, name: row.subject.name },
      course: { id: row.course.id, subjectId: row.course.subjectId, name: row.course.name },
      topic: { id: row.topic.id, courseId: row.topic.courseId, name: row.topic.name },
      skill: { id: row.skill.id, topicId: row.skill.topicId, name: row.skill.name },
    };
  }
}
