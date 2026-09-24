import {
  boolean,
  check,
  foreignKey,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const userTypeEnum = pgEnum('user_type', ['teacher', 'student']);
export const relationshipStatusEnum = pgEnum('relationship_status', ['active', 'revoked']);
export const taskVersionStatusEnum = pgEnum('task_version_status', ['draft', 'published', 'archived']);
export const attemptStatusEnum = pgEnum('attempt_status', ['started', 'submitted']);
export const resultOutcomeEnum = pgEnum('result_outcome', ['correct', 'incorrect', 'invalid']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: userTypeEnum('type').notNull(),
  displayName: text('display_name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const externalIdentities = pgTable(
  'external_identities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    subject: text('subject').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    providerSubjectUnique: uniqueIndex('external_identities_provider_subject_unique').on(
      table.provider,
      table.subject,
    ),
  }),
);

export const teacherStudentRelationships = pgTable(
  'teacher_student_relationships',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    teacherId: uuid('teacher_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    status: relationshipStatusEnum('status').default('active').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    teacherStudentUnique: uniqueIndex('teacher_student_relationship_unique').on(
      table.teacherId,
      table.studentId,
    ),
  }),
);

export const subjects = pgTable('subjects', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const courses = pgTable('courses', {
  id: uuid('id').defaultRandom().primaryKey(),
  subjectId: uuid('subject_id').notNull().references(() => subjects.id, { onDelete: 'restrict' }),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const topics = pgTable('topics', {
  id: uuid('id').defaultRandom().primaryKey(),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'restrict' }),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const skills = pgTable('skills', {
  id: uuid('id').defaultRandom().primaryKey(),
  topicId: uuid('topic_id').notNull().references(() => topics.id, { onDelete: 'restrict' }),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  subjectId: uuid('subject_id').notNull().references(() => subjects.id, { onDelete: 'restrict' }),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'restrict' }),
  topicId: uuid('topic_id').notNull().references(() => topics.id, { onDelete: 'restrict' }),
  skillId: uuid('skill_id').notNull().references(() => skills.id, { onDelete: 'restrict' }),
  sourceKind: text('source_kind').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const taskVersions = pgTable(
  'task_versions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'restrict' }),
    version: integer('version').notNull(),
    taskType: text('task_type').notNull(),
    status: taskVersionStatusEnum('status').default('draft').notNull(),
    content: jsonb('content').$type<{ statement: string; options: Array<{ id: string; label: string }>; correctOptionId: string }>().notNull(),
    answerSchema: jsonb('answer_schema').$type<{ type: 'single-choice'; required: true }>().notNull(),
    evaluationRule: text('evaluation_rule').notNull(),
    provenance: jsonb('provenance').$type<{
      sourceKind: 'internal_fixture';
      sourceIdentifier: string;
      licenseStatus: 'development_only';
      fixtureVersion: string;
    }>().notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    taskVersionUnique: uniqueIndex('task_versions_task_version_unique').on(table.taskId, table.version),
    publishedDate: check('task_versions_published_date', sql`${table.status} <> 'published' OR ${table.publishedAt} IS NOT NULL`),
  }),
);

export const assignments = pgTable('assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  teacherId: uuid('teacher_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  studentId: uuid('student_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  taskVersionId: uuid('task_version_id').notNull().references(() => taskVersions.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const attempts = pgTable('attempts', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  taskVersionId: uuid('task_version_id').notNull().references(() => taskVersions.id, { onDelete: 'restrict' }),
  assignmentId: uuid('assignment_id').notNull().references(() => assignments.id, { onDelete: 'restrict' }),
  status: attemptStatusEnum('status').default('started').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
}, (table) => ({
  oneAttemptPerAssignment: uniqueIndex('attempts_one_per_assignment').on(table.assignmentId),
}));

export const submissions = pgTable(
  'submissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    attemptId: uuid('attempt_id').notNull().references(() => attempts.id, { onDelete: 'cascade' }),
    idempotencyKey: text('idempotency_key').notNull(),
    answer: jsonb('answer').$type<{ optionId: string }>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    oneSubmissionPerAttempt: uniqueIndex('submissions_one_per_attempt').on(table.attemptId),
    attemptSubmissionPair: uniqueIndex('submissions_attempt_id_id_unique').on(table.attemptId, table.id),
    attemptIdempotencyUnique: uniqueIndex('submissions_attempt_idempotency_unique').on(
      table.attemptId,
      table.idempotencyKey,
    ),
  }),
);

export const results = pgTable('results', {
  id: uuid('id').defaultRandom().primaryKey(),
  attemptId: uuid('attempt_id').notNull().unique().references(() => attempts.id, { onDelete: 'cascade' }),
  submissionId: uuid('submission_id').notNull().unique().references(() => submissions.id, { onDelete: 'restrict' }),
  evaluationRule: text('evaluation_rule').notNull(),
  outcome: resultOutcomeEnum('outcome').notNull(),
  isCorrect: boolean('is_correct').notNull(),
  score: integer('score').notNull(),
  details: jsonb('details').$type<{ selectedOptionId?: string; correctOptionId?: string; reason?: string }>(),
  evaluatedAt: timestamp('evaluated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  submissionBelongsToAttempt: foreignKey({
    name: 'results_submission_attempt_fk',
    columns: [table.attemptId, table.submissionId],
    foreignColumns: [submissions.attemptId, submissions.id],
  }),
}));

export const auditEvents = pgTable('audit_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  resourceType: text('resource_type').notNull(),
  resourceId: uuid('resource_id'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type TaskVersion = typeof taskVersions.$inferSelect;
export type Attempt = typeof attempts.$inferSelect;
export type Result = typeof results.$inferSelect;
