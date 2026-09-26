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
export const tenantStatusEnum = pgEnum('tenant_status', ['active', 'archived']);
export const membershipRoleEnum = pgEnum('membership_role', ['organization_admin', 'workspace_admin', 'educator']);
export const membershipStatusEnum = pgEnum('membership_status', ['active', 'revoked']);
export const integrationStatusEnum = pgEnum('integration_status', ['active', 'disabled']);
export const apiKeyStatusEnum = pgEnum('api_key_status', ['active', 'revoked']);
export const externalUserStatusEnum = pgEnum('external_user_status', ['active', 'inactive']);

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

export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  status: tenantStatusEnum('status').default('active').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const workspaces = pgTable('workspaces', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'restrict' }),
  name: text('name').notNull(),
  status: tenantStatusEnum('status').default('active').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  workspaceOrganizationUnique: uniqueIndex('workspaces_id_organization_unique').on(table.id, table.organizationId),
}));

export const memberships = pgTable('memberships', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'restrict' }),
  workspaceId: uuid('workspace_id'),
  role: membershipRoleEnum('role').notNull(),
  status: membershipStatusEnum('status').default('active').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  workspaceOrganizationFk: foreignKey({
    name: 'memberships_workspace_organization_fk',
    columns: [table.workspaceId, table.organizationId],
    foreignColumns: [workspaces.id, workspaces.organizationId],
  }).onDelete('restrict'),
  roleScope: check('memberships_role_scope_check', sql`
    (${table.role} = 'organization_admin' AND ${table.workspaceId} IS NULL)
    OR (${table.role} <> 'organization_admin' AND ${table.workspaceId} IS NOT NULL)
  `),
  organizationMembershipUnique: uniqueIndex('memberships_user_organization_unique')
    .on(table.userId, table.organizationId)
    .where(sql`${table.workspaceId} IS NULL`),
  workspaceMembershipUnique: uniqueIndex('memberships_user_workspace_unique')
    .on(table.userId, table.workspaceId)
    .where(sql`${table.workspaceId} IS NOT NULL`),
}));

export const integrations = pgTable('integrations', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull(),
  workspaceId: uuid('workspace_id').notNull(),
  name: text('name').notNull(),
  status: integrationStatusEnum('status').default('active').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  workspaceOrganizationFk: foreignKey({
    name: 'integrations_workspace_organization_fk',
    columns: [table.workspaceId, table.organizationId],
    foreignColumns: [workspaces.id, workspaces.organizationId],
  }).onDelete('restrict'),
  integrationTenantUnique: uniqueIndex('integrations_tenant_id_unique')
    .on(table.organizationId, table.workspaceId, table.id),
}));

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull(),
  workspaceId: uuid('workspace_id').notNull(),
  integrationId: uuid('integration_id').notNull(),
  name: text('name').notNull(),
  keyPrefix: text('key_prefix').notNull(),
  keyHash: text('key_hash').notNull(),
  scopes: text('scopes').array().notNull(),
  status: apiKeyStatusEnum('status').default('active').notNull(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
}, (table) => ({
  integrationTenantFk: foreignKey({
    name: 'api_keys_integration_tenant_fk',
    columns: [table.organizationId, table.workspaceId, table.integrationId],
    foreignColumns: [integrations.organizationId, integrations.workspaceId, integrations.id],
  }).onDelete('restrict'),
  keyPrefixUnique: uniqueIndex('api_keys_key_prefix_unique').on(table.keyPrefix),
  scopesRequired: check('api_keys_scopes_required_check', sql`cardinality(${table.scopes}) > 0`),
  revokedState: check('api_keys_revoked_state_check', sql`
    (${table.status} = 'active' AND ${table.revokedAt} IS NULL)
    OR (${table.status} = 'revoked' AND ${table.revokedAt} IS NOT NULL)
  `),
}));

export const externalUsers = pgTable('external_users', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull(),
  workspaceId: uuid('workspace_id').notNull(),
  integrationId: uuid('integration_id').notNull(),
  externalUserId: text('external_user_id').notNull(),
  status: externalUserStatusEnum('status').default('active').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  integrationTenantFk: foreignKey({
    name: 'external_users_integration_tenant_fk',
    columns: [table.organizationId, table.workspaceId, table.integrationId],
    foreignColumns: [integrations.organizationId, integrations.workspaceId, integrations.id],
  }).onDelete('restrict'),
  externalIdentityUnique: uniqueIndex('external_users_workspace_integration_external_unique')
    .on(table.workspaceId, table.integrationId, table.externalUserId),
}));

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
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'restrict' }),
  subjectId: uuid('subject_id').notNull().references(() => subjects.id, { onDelete: 'restrict' }),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  courseWorkspaceUnique: uniqueIndex('courses_id_workspace_unique').on(table.id, table.workspaceId),
}));

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
  workspaceId: uuid('workspace_id').notNull(),
  subjectId: uuid('subject_id').notNull().references(() => subjects.id, { onDelete: 'restrict' }),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'restrict' }),
  topicId: uuid('topic_id').notNull().references(() => topics.id, { onDelete: 'restrict' }),
  skillId: uuid('skill_id').notNull().references(() => skills.id, { onDelete: 'restrict' }),
  sourceKind: text('source_kind').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  courseWorkspaceFk: foreignKey({
    name: 'tasks_course_workspace_fk',
    columns: [table.courseId, table.workspaceId],
    foreignColumns: [courses.id, courses.workspaceId],
  }).onDelete('restrict'),
  taskWorkspaceUnique: uniqueIndex('tasks_id_workspace_unique').on(table.id, table.workspaceId),
}));

export const taskVersions = pgTable(
  'task_versions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'restrict' }),
    workspaceId: uuid('workspace_id').notNull(),
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
    taskWorkspaceFk: foreignKey({
      name: 'task_versions_task_workspace_fk',
      columns: [table.taskId, table.workspaceId],
      foreignColumns: [tasks.id, tasks.workspaceId],
    }).onDelete('restrict'),
    taskVersionWorkspaceUnique: uniqueIndex('task_versions_id_workspace_unique').on(table.id, table.workspaceId),
    publishedDate: check('task_versions_published_date', sql`${table.status} <> 'published' OR ${table.publishedAt} IS NOT NULL`),
  }),
);

export const assignments = pgTable('assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  teacherId: uuid('teacher_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  studentId: uuid('student_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  taskVersionId: uuid('task_version_id').notNull().references(() => taskVersions.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  assignmentTaskVersionUnique: uniqueIndex('assignments_id_task_version_unique').on(table.id, table.taskVersionId),
  taskVersionWorkspaceFk: foreignKey({
    name: 'assignments_task_version_workspace_fk',
    columns: [table.taskVersionId, table.workspaceId],
    foreignColumns: [taskVersions.id, taskVersions.workspaceId],
  }).onDelete('restrict'),
  assignmentWorkspaceUnique: uniqueIndex('assignments_id_workspace_unique').on(table.id, table.workspaceId),
  assignmentTaskVersionWorkspaceUnique: uniqueIndex('assignments_id_task_version_workspace_unique')
    .on(table.id, table.taskVersionId, table.workspaceId),
}));

export const attempts = pgTable('attempts', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  studentId: uuid('student_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  taskVersionId: uuid('task_version_id').notNull().references(() => taskVersions.id, { onDelete: 'restrict' }),
  assignmentId: uuid('assignment_id').notNull().references(() => assignments.id, { onDelete: 'restrict' }),
  status: attemptStatusEnum('status').default('started').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
}, (table) => ({
  oneAttemptPerAssignment: uniqueIndex('attempts_one_per_assignment').on(table.assignmentId),
  assignmentWorkspaceFk: foreignKey({
    name: 'attempts_assignment_workspace_fk',
    columns: [table.assignmentId, table.workspaceId],
    foreignColumns: [assignments.id, assignments.workspaceId],
  }).onDelete('restrict'),
  assignmentTaskVersionFk: foreignKey({
    name: 'attempts_assignment_task_version_fk',
    columns: [table.assignmentId, table.taskVersionId, table.workspaceId],
    foreignColumns: [assignments.id, assignments.taskVersionId, assignments.workspaceId],
  }).onDelete('restrict'),
  taskVersionWorkspaceFk: foreignKey({
    name: 'attempts_task_version_workspace_fk',
    columns: [table.taskVersionId, table.workspaceId],
    foreignColumns: [taskVersions.id, taskVersions.workspaceId],
  }).onDelete('restrict'),
  attemptWorkspaceUnique: uniqueIndex('attempts_id_workspace_unique').on(table.id, table.workspaceId),
}));

export const submissions = pgTable(
  'submissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    attemptId: uuid('attempt_id').notNull().references(() => attempts.id, { onDelete: 'cascade' }),
    workspaceId: uuid('workspace_id').notNull(),
    idempotencyKey: text('idempotency_key').notNull(),
    answer: jsonb('answer').$type<{ optionId: string }>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    oneSubmissionPerAttempt: uniqueIndex('submissions_one_per_attempt').on(table.attemptId),
    attemptSubmissionPair: uniqueIndex('submissions_attempt_id_id_unique').on(table.attemptId, table.id),
    attemptWorkspaceFk: foreignKey({
      name: 'submissions_attempt_workspace_fk',
      columns: [table.attemptId, table.workspaceId],
      foreignColumns: [attempts.id, attempts.workspaceId],
    }).onDelete('restrict'),
    submissionAttemptWorkspaceUnique: uniqueIndex('submissions_attempt_id_id_workspace_unique')
      .on(table.attemptId, table.id, table.workspaceId),
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
  workspaceId: uuid('workspace_id').notNull(),
  evaluationRule: text('evaluation_rule').notNull(),
  outcome: resultOutcomeEnum('outcome').notNull(),
  isCorrect: boolean('is_correct').notNull(),
  score: integer('score').notNull(),
  details: jsonb('details').$type<{ selectedOptionId?: string; correctOptionId?: string; reason?: string }>(),
  evaluatedAt: timestamp('evaluated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  attemptWorkspaceFk: foreignKey({
    name: 'results_attempt_workspace_fk',
    columns: [table.attemptId, table.workspaceId],
    foreignColumns: [attempts.id, attempts.workspaceId],
  }).onDelete('restrict'),
  submissionBelongsToAttempt: foreignKey({
    name: 'results_submission_attempt_fk',
    columns: [table.attemptId, table.submissionId, table.workspaceId],
    foreignColumns: [submissions.attemptId, submissions.id, submissions.workspaceId],
  }).onDelete('restrict'),
}));

export const auditEvents = pgTable('audit_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  resourceType: text('resource_type').notNull(),
  resourceId: uuid('resource_id'),
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'set null' }),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type TaskVersion = typeof taskVersions.$inferSelect;
export type Attempt = typeof attempts.$inferSelect;
export type Result = typeof results.$inferSelect;
