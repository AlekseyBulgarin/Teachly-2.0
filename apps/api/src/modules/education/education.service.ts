import { Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { DatabaseService } from '../../infrastructure/database/database';
import { courses, skills, subjects, taskVersions, tasks, topics } from '../../infrastructure/database/schema';
import type { TenantContext } from '../core/core.types';
import type { CurriculumDescriptor, PublishedTaskContext, PublishedTaskVersion, PublicTaskVersion } from './education.types';

@Injectable()
export class EducationService {
  constructor(private readonly database: DatabaseService) {}

  async findPublishedTaskVersion(taskVersionId: string, context?: TenantContext): Promise<PublishedTaskContext | null> {
    const rows = await this.database.db
      .select({ taskVersion: taskVersions, task: tasks, subject: subjects, course: courses, topic: topics, skill: skills })
      .from(taskVersions)
      .innerJoin(tasks, eq(tasks.id, taskVersions.taskId))
        .leftJoin(subjects, eq(subjects.id, tasks.subjectId))
        .leftJoin(courses, eq(courses.id, tasks.courseId))
        .leftJoin(topics, eq(topics.id, tasks.topicId))
        .leftJoin(skills, eq(skills.id, tasks.skillId))
      .where(and(
        eq(taskVersions.id, taskVersionId),
        eq(taskVersions.status, 'published'),
        context ? eq(taskVersions.workspaceId, context.workspaceId) : undefined,
      ))
      .limit(1);
    const row = rows[0];
    return row ? this.toPublishedTaskContext(row) : null;
  }

  async getPublishedTaskVersion(taskVersionId: string, context?: TenantContext): Promise<PublishedTaskContext> {
    const task = await this.findPublishedTaskVersion(taskVersionId, context);
    if (!task) throw new NotFoundException('Published task version not found');
    return task;
  }

  async listPublishedTaskVersions(context?: TenantContext): Promise<PublishedTaskContext[]> {
    const rows = await this.database.db
      .select({ taskVersion: taskVersions, task: tasks, subject: subjects, course: courses, topic: topics, skill: skills })
      .from(taskVersions)
      .innerJoin(tasks, eq(tasks.id, taskVersions.taskId))
        .leftJoin(subjects, eq(subjects.id, tasks.subjectId))
        .leftJoin(courses, eq(courses.id, tasks.courseId))
        .leftJoin(topics, eq(topics.id, tasks.topicId))
        .leftJoin(skills, eq(skills.id, tasks.skillId))
      .where(and(
        eq(taskVersions.status, 'published'),
        context ? eq(taskVersions.workspaceId, context.workspaceId) : undefined,
      ));
    return rows.map((row) => this.toPublishedTaskContext(row));
  }

  async describeSkills(workspaceId: string, skillIds: string[]): Promise<Map<string, CurriculumDescriptor>> {
    if (!skillIds.length) return new Map();
    const rows = await this.database.db.select({ skill: skills, topic: topics, course: courses, subject: subjects })
      .from(skills)
      .innerJoin(topics, eq(topics.id, skills.topicId))
      .innerJoin(courses, eq(courses.id, topics.courseId))
      .innerJoin(subjects, eq(subjects.id, courses.subjectId))
      .where(and(eq(courses.workspaceId, workspaceId), inArray(skills.id, [...new Set(skillIds)])));
    return new Map(rows.map((row) => [row.skill.id, {
      subject: { code: row.subject.code, name: row.subject.name },
      course: { id: row.course.id, name: row.course.name },
      topic: { id: row.topic.id, name: row.topic.name },
      skill: { id: row.skill.id, name: row.skill.name },
    }]));
  }

  toPublicTaskVersion(taskVersion: PublishedTaskVersion): PublicTaskVersion {
    return {
      ...taskVersion,
      content: {
        statement: taskVersion.content.statement,
        ...(taskVersion.content.options ? { options: taskVersion.content.options } : {}),
        ...(taskVersion.content.title ? { title: taskVersion.content.title } : {}),
        ...(taskVersion.content.blocks ? { blocks: taskVersion.content.blocks } : {}),
        ...(taskVersion.content.attachments ? { attachments: taskVersion.content.attachments } : {}),
        ...(taskVersion.content.metadata ? { metadata: taskVersion.content.metadata } : {}),
      },
    };
  }

  private toPublishedTaskContext(row: {
    taskVersion: typeof taskVersions.$inferSelect;
    task: typeof tasks.$inferSelect;
    subject: typeof subjects.$inferSelect | null;
    course: typeof courses.$inferSelect | null;
    topic: typeof topics.$inferSelect | null;
    skill: typeof skills.$inferSelect | null;
  }): PublishedTaskContext {
    return {
      workspaceId: row.taskVersion.workspaceId,
      taskVersion: {
        id: row.taskVersion.id,
        taskId: row.taskVersion.taskId,
        version: row.taskVersion.version,
        taskType: row.taskVersion.taskType,
        status: 'published',
        content: row.taskVersion.content as PublishedTaskVersion['content'],
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
      subject: row.subject ? { id: row.subject.id, code: row.subject.code, name: row.subject.name } : null,
      course: row.course ? { id: row.course.id, subjectId: row.course.subjectId, name: row.course.name } : null,
      topic: row.topic ? { id: row.topic.id, courseId: row.topic.courseId, name: row.topic.name } : null,
      skill: row.skill ? { id: row.skill.id, topicId: row.skill.topicId, name: row.skill.name } : null,
    };
  }
}
