import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { DatabaseService } from '../../infrastructure/database/database';
import {
  assignments,
  attempts,
  externalIdentities,
  results,
  taskVersions,
  teacherStudentRelationships,
  users,
} from '../../infrastructure/database/schema';
import { EducationService } from '../education/education.service';
import { AuditService } from '../audit/audit.service';
import { developmentAuthEnabled } from '../../common/config';

@Injectable()
export class TeachingService {
  constructor(
    private readonly database: DatabaseService,
    private readonly education: EducationService,
    private readonly audit: AuditService,
  ) {}

  toPublicTaskVersion(taskVersion: typeof taskVersions.$inferSelect) {
    return this.education.toPublicTaskVersion(taskVersion);
  }

  private async assertTeacher(userId: string): Promise<void> {
    const [user] = await this.database.db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user || user.type !== 'teacher') throw new ForbiddenException('Teacher access required');
  }

  async createStudent(teacherId: string, displayName: string) {
    await this.assertTeacher(teacherId);
    const student = await this.database.db.transaction(async (tx) => {
      const [student] = await tx.insert(users).values({ type: 'student', displayName }).returning();
      if (!student) throw new Error('Student creation failed');
      await tx.insert(teacherStudentRelationships).values({ teacherId, studentId: student.id });
      if (developmentAuthEnabled()) {
        await tx.insert(externalIdentities).values({ provider: 'development', subject: `dev-student-${student.id}`, userId: student.id });
      }
      await this.audit.recordIn(tx, teacherId, 'student_relationship_created', 'student', student.id, { studentId: student.id });
      return student;
    });
    return student;
  }

  async listStudents(teacherId: string) {
    await this.assertTeacher(teacherId);
    return this.database.db
      .select({ student: users, relationship: teacherStudentRelationships })
      .from(teacherStudentRelationships)
      .innerJoin(users, eq(users.id, teacherStudentRelationships.studentId))
      .where(and(eq(teacherStudentRelationships.teacherId, teacherId), eq(teacherStudentRelationships.status, 'active')));
  }

  async assertManagesStudent(teacherId: string, studentId: string): Promise<void> {
    const [relationship] = await this.database.db
      .select()
      .from(teacherStudentRelationships)
      .where(and(eq(teacherStudentRelationships.teacherId, teacherId), eq(teacherStudentRelationships.studentId, studentId), eq(teacherStudentRelationships.status, 'active')))
      .limit(1);
    if (!relationship) throw new ForbiddenException('Teacher does not manage this student');
  }

  async createAssignment(teacherId: string, studentId: string, taskVersionId: string) {
    await this.assertManagesStudent(teacherId, studentId);
    await this.education.getPublishedTaskVersion(taskVersionId);
    return this.database.db.transaction(async (tx) => {
      const [relationship] = await tx.select().from(teacherStudentRelationships)
        .where(and(eq(teacherStudentRelationships.teacherId, teacherId), eq(teacherStudentRelationships.studentId, studentId), eq(teacherStudentRelationships.status, 'active'))).limit(1);
      if (!relationship) throw new ForbiddenException('Teacher does not manage this student');
      const [assignment] = await tx.insert(assignments).values({ teacherId, studentId, taskVersionId }).returning();
      if (!assignment) throw new Error('Assignment creation failed');
      await this.audit.recordIn(tx, teacherId, 'assignment_created', 'assignment', assignment.id, { studentId, taskVersionId });
      return assignment;
    });
  }

  async getAssignmentForStudent(studentId: string, assignmentId: string) {
    const rows = await this.database.db
      .select({ assignment: assignments, taskVersion: taskVersions })
      .from(assignments)
      .innerJoin(taskVersions, eq(taskVersions.id, assignments.taskVersionId))
      .where(and(eq(assignments.id, assignmentId), eq(assignments.studentId, studentId)))
      .limit(1);
    const row = rows[0];
    if (!row) throw new NotFoundException('Assignment not found');
    if (row.taskVersion.status !== 'published') throw new ForbiddenException('Assignment task is not available');
    return row;
  }

  async listAssignmentsForStudent(studentId: string) {
    return this.database.db
      .select({ assignment: assignments, taskVersion: taskVersions })
      .from(assignments)
      .innerJoin(taskVersions, eq(taskVersions.id, assignments.taskVersionId))
      .where(and(eq(assignments.studentId, studentId), eq(taskVersions.status, 'published')));
  }

  async listResultsForTeacher(teacherId: string, studentId: string) {
    await this.assertManagesStudent(teacherId, studentId);
    return this.database.db
      .select({ result: results, attempt: attempts, taskVersion: taskVersions })
      .from(results)
      .innerJoin(attempts, eq(attempts.id, results.attemptId))
      .innerJoin(taskVersions, eq(taskVersions.id, attempts.taskVersionId))
      .where(eq(attempts.studentId, studentId))
      .orderBy(desc(results.evaluatedAt));
  }
}
