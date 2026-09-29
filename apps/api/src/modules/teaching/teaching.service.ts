import { ForbiddenException, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DatabaseService } from '../../infrastructure/database/database';
import {
  assignments,
  teacherStudentRelationships,
} from '../../infrastructure/database/schema';
import { EducationService } from '../education/education.service';
import { AuditService } from '../audit/audit.service';
import { developmentAuthEnabled } from '../../common/config';
import { IdentityService } from '../identity/identity.service';
import { TenancyService } from '../tenancy/tenancy.service';
import { UsersService } from '../users/users.service';
import type { TenantContext } from '../core/core.types';
import type { AssignmentView, StudentAssignmentItem, StudentRelationshipItem, StudentView } from './teaching.types';

@Injectable()
export class TeachingService {
  constructor(
    private readonly database: DatabaseService,
    private readonly education: EducationService,
    private readonly audit: AuditService,
    private readonly identity: IdentityService,
    private readonly tenancy: TenancyService,
    private readonly users: UsersService,
  ) {}

  private async assertTeacher(userId: string): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user || user.type !== 'teacher') throw new ForbiddenException('Teacher access required');
  }

  async createStudent(teacherId: string, displayName: string): Promise<StudentView> {
    await this.assertTeacher(teacherId);
    const student = await this.database.transaction(async () => {
      const student = await this.users.createStudent(displayName);
      if (developmentAuthEnabled()) {
        await this.identity.createDevelopmentIdentity(student.id, `dev-student-${student.id}`);
      }
      await this.database.db.insert(teacherStudentRelationships).values({ teacherId, studentId: student.id });
      await this.audit.record(teacherId, 'student_relationship_created', 'student', student.id, { studentId: student.id });
      return student;
    });
    return { ...student, type: 'student' };
  }

  async listStudents(teacherId: string): Promise<StudentRelationshipItem[]> {
    await this.assertTeacher(teacherId);
    const relationships = await this.database.db
      .select()
      .from(teacherStudentRelationships)
      .where(and(eq(teacherStudentRelationships.teacherId, teacherId), eq(teacherStudentRelationships.status, 'active')));
    const rows = await Promise.all(relationships.map(async (relationship) => {
      const student = await this.users.getById(relationship.studentId);
      if (student.type !== 'student') return null;
      return {
        student,
        relationship: { id: relationship.id, status: relationship.status, createdAt: relationship.createdAt },
      };
    }));
    return rows.filter((row): row is StudentRelationshipItem => row !== null);
  }

  async assertManagesStudent(teacherId: string, studentId: string, context?: TenantContext): Promise<void> {
    if (context) await this.tenancy.assertUserCanAccessWorkspace(teacherId, context);
    const [relationship] = await this.database.db
      .select()
      .from(teacherStudentRelationships)
      .where(and(eq(teacherStudentRelationships.teacherId, teacherId), eq(teacherStudentRelationships.studentId, studentId), eq(teacherStudentRelationships.status, 'active')))
      .limit(1);
    if (!relationship) throw new ForbiddenException('Teacher does not manage this student');
  }

  async createAssignment(teacherId: string, studentId: string, taskVersionId: string, context?: TenantContext): Promise<AssignmentView> {
    await this.assertManagesStudent(teacherId, studentId, context);
    const publishedTask = await this.education.getPublishedTaskVersion(taskVersionId, context);
    if (context) await this.tenancy.assertUserCanAccessWorkspace(teacherId, context);
    else await this.tenancy.assertUserCanAccessWorkspaceId(teacherId, publishedTask.workspaceId);
    return this.database.db.transaction(async (tx) => {
      const [relationship] = await tx.select().from(teacherStudentRelationships)
        .where(and(eq(teacherStudentRelationships.teacherId, teacherId), eq(teacherStudentRelationships.studentId, studentId), eq(teacherStudentRelationships.status, 'active'))).limit(1);
      if (!relationship) throw new ForbiddenException('Teacher does not manage this student');
      const [assignment] = await tx.insert(assignments).values({
        teacherId,
        studentId,
        taskVersionId,
        workspaceId: context?.workspaceId ?? publishedTask.workspaceId,
      }).returning();
      if (!assignment) throw new Error('Assignment creation failed');
      await this.audit.recordIn(
        tx,
        teacherId,
        'assignment_created',
        'assignment',
        assignment.id,
        { studentId, taskVersionId },
        context?.workspaceId,
      );
      return this.toAssignmentView(assignment);
    });
  }

  async findAssignmentForStudent(studentId: string, assignmentId: string, context?: TenantContext): Promise<AssignmentView | null> {
    const [assignment] = await this.database.db
      .select()
      .from(assignments)
      .where(and(
        eq(assignments.id, assignmentId),
        eq(assignments.studentId, studentId),
        context ? eq(assignments.workspaceId, context.workspaceId) : undefined,
      ))
      .limit(1);
    return assignment ? this.toAssignmentView(assignment) : null;
  }

  async listAssignmentsForStudent(studentId: string, context?: TenantContext): Promise<StudentAssignmentItem[]> {
    const rows = await this.database.db.select().from(assignments).where(and(
      eq(assignments.studentId, studentId),
      context ? eq(assignments.workspaceId, context.workspaceId) : undefined,
    ));
    const resolved = await Promise.all(rows.map(async (assignment) => {
      const task = await this.education.findPublishedTaskVersion(assignment.taskVersionId, context);
      if (!task) return null;
      return {
        assignment: this.toAssignmentView(assignment),
        taskVersion: this.education.toPublicTaskVersion(task.taskVersion),
      };
    }));
    return resolved.filter((item): item is StudentAssignmentItem => item !== null);
  }

  private toAssignmentView(assignment: typeof assignments.$inferSelect): AssignmentView {
    return {
      id: assignment.id,
      studentId: assignment.studentId,
      taskVersionId: assignment.taskVersionId,
      createdAt: assignment.createdAt,
    };
  }
}
