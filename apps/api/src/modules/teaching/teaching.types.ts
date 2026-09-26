import type { PublicTaskVersion } from '../education/education.types';

export type StudentView = {
  id: string;
  type: 'student';
  displayName: string;
  createdAt: Date;
};

export type StudentRelationshipView = {
  id: string;
  status: 'active' | 'revoked';
  createdAt: Date;
};

export type StudentRelationshipItem = {
  student: StudentView;
  relationship: StudentRelationshipView;
};

export type AssignmentView = {
  id: string;
  studentId: string;
  taskVersionId: string;
  createdAt: Date;
};

export type StudentAssignmentItem = {
  assignment: AssignmentView;
  taskVersion: PublicTaskVersion;
};
