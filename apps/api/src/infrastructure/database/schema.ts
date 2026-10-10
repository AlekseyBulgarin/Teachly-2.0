import {
  boolean,
  check,
  foreignKey,
  index,
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
export const membershipRoleEnum = pgEnum('membership_role', ['organization_admin', 'workspace_admin', 'educator', 'content_editor']);
export const membershipStatusEnum = pgEnum('membership_status', ['active', 'revoked']);
export const integrationStatusEnum = pgEnum('integration_status', ['active', 'disabled']);
export const apiKeyStatusEnum = pgEnum('api_key_status', ['active', 'revoked']);
export const externalUserStatusEnum = pgEnum('external_user_status', ['active', 'inactive']);
export const learningEventTypeEnum = pgEnum('learning_event_type', ['attempt_submitted', 'result_recorded']);
export const knowledgeSourceStatusEnum = pgEnum('knowledge_source_status', ['active', 'disabled']);
export const knowledgeDocumentStatusEnum = pgEnum('knowledge_document_status', ['active', 'disabled']);
export const knowledgeVersionStatusEnum = pgEnum('knowledge_version_status', [
  'draft',
  'approved',
  'rejected',
  'disabled',
  'superseded',
]);
export const knowledgeLicenseStatusEnum = pgEnum('knowledge_license_status', ['unknown', 'allowed', 'restricted']);
export const knowledgeExternalAiPermissionEnum = pgEnum('knowledge_external_ai_permission', [
  'not_reviewed',
  'allowed',
  'prohibited',
]);
export const aiRequestStatusEnum = pgEnum('ai_request_status', ['started', 'succeeded', 'failed']);

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
  learnerId: uuid('learner_id').references(() => users.id, { onDelete: 'restrict' }),
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
  learnerMappingUnique: uniqueIndex('external_users_workspace_integration_learner_unique')
    .on(table.workspaceId, table.integrationId, table.learnerId)
    .where(sql`${table.learnerId} IS NOT NULL`),
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

export const taskSources = pgTable('task_sources', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull(),
  workspaceId: uuid('workspace_id').notNull(),
  integrationId: uuid('integration_id'),
  name: text('name').notNull(),
  sourceType: text('source_type').notNull(),
  mode: text('mode').notNull(),
  status: text('status').default('active').notNull(),
  metadata: jsonb('metadata').$type<{ description?: string; provider?: string }>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  workspaceFk: foreignKey({ name: 'task_sources_workspace_fk', columns: [table.workspaceId, table.organizationId],
    foreignColumns: [workspaces.id, workspaces.organizationId] }).onDelete('restrict'),
  integrationFk: foreignKey({ name: 'task_sources_integration_fk',
    columns: [table.organizationId, table.workspaceId, table.integrationId],
    foreignColumns: [integrations.organizationId, integrations.workspaceId, integrations.id] }).onDelete('restrict'),
  tenantUnique: uniqueIndex('task_sources_id_workspace_unique').on(table.id, table.workspaceId),
  sourceTenantUnique: uniqueIndex('task_sources_id_org_workspace_unique').on(table.id, table.organizationId, table.workspaceId),
  modeCheck: check('task_sources_mode_check', sql`${table.mode} IN ('imported_snapshot', 'external_reference')`),
  statusCheck: check('task_sources_status_check', sql`${table.status} IN ('active', 'disabled')`),
}));

export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  subjectId: uuid('subject_id').references(() => subjects.id, { onDelete: 'restrict' }),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'restrict' }),
  topicId: uuid('topic_id').references(() => topics.id, { onDelete: 'restrict' }),
  skillId: uuid('skill_id').references(() => skills.id, { onDelete: 'restrict' }),
  taskSourceId: uuid('task_source_id'),
  externalTaskId: text('external_task_id'),
  sourceKind: text('source_kind').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  courseWorkspaceFk: foreignKey({
    name: 'tasks_course_workspace_fk',
    columns: [table.courseId, table.workspaceId],
    foreignColumns: [courses.id, courses.workspaceId],
  }).onDelete('restrict'),
  taskWorkspaceUnique: uniqueIndex('tasks_id_workspace_unique').on(table.id, table.workspaceId),
  sourceWorkspaceFk: foreignKey({ name: 'tasks_source_workspace_fk', columns: [table.taskSourceId, table.workspaceId],
    foreignColumns: [taskSources.id, taskSources.workspaceId] }).onDelete('restrict'),
  externalIdentityUnique: uniqueIndex('tasks_source_external_unique').on(table.workspaceId, table.taskSourceId, table.externalTaskId)
    .where(sql`${table.taskSourceId} IS NOT NULL`),
  sourceIdentityCheck: check('tasks_source_identity_check', sql`(${table.taskSourceId} IS NULL) = (${table.externalTaskId} IS NULL)`),
}));

export const taskSourceSnapshots = pgTable('task_source_snapshots', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  taskId: uuid('task_id').notNull(),
  taskSourceId: uuid('task_source_id').notNull(),
  externalTaskId: text('external_task_id').notNull(),
  idempotencyKey: text('idempotency_key').notNull(),
  rawPayload: jsonb('raw_payload').$type<Record<string, unknown>>().notNull(),
  checksum: text('checksum').notNull(),
  importedByUserId: uuid('imported_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  taskWorkspaceFk: foreignKey({ name: 'task_snapshots_task_workspace_fk', columns: [table.taskId, table.workspaceId],
    foreignColumns: [tasks.id, tasks.workspaceId] }).onDelete('restrict'),
  sourceWorkspaceFk: foreignKey({ name: 'task_snapshots_source_workspace_fk', columns: [table.taskSourceId, table.workspaceId],
    foreignColumns: [taskSources.id, taskSources.workspaceId] }).onDelete('restrict'),
  taskChecksumUnique: uniqueIndex('task_snapshots_task_checksum_unique').on(table.taskId, table.checksum),
  sourceIdempotencyUnique: uniqueIndex('task_snapshots_source_idempotency_unique').on(table.taskSourceId, table.workspaceId, table.idempotencyKey),
  lineageUnique: uniqueIndex('task_snapshots_id_task_workspace_unique').on(table.id, table.taskId, table.workspaceId),
}));

export const taskCurriculumMappings = pgTable('task_curriculum_mappings', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull(),
  workspaceId: uuid('workspace_id').notNull(),
  taskSourceId: uuid('task_source_id').notNull(),
  mappingType: text('mapping_type').notNull(),
  externalValue: text('external_value').notNull(),
  subjectId: uuid('subject_id').references(() => subjects.id, { onDelete: 'restrict' }),
  courseId: uuid('course_id'),
  topicId: uuid('topic_id').references(() => topics.id, { onDelete: 'restrict' }),
  skillId: uuid('skill_id').references(() => skills.id, { onDelete: 'restrict' }),
  createdByUserId: uuid('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  sourceTenantFk: foreignKey({ name: 'task_curriculum_mappings_source_tenant_fk',
    columns: [table.taskSourceId, table.organizationId, table.workspaceId],
    foreignColumns: [taskSources.id, taskSources.organizationId, taskSources.workspaceId] }).onDelete('restrict'),
  courseWorkspaceFk: foreignKey({ name: 'task_curriculum_mappings_course_workspace_fk', columns: [table.courseId, table.workspaceId],
    foreignColumns: [courses.id, courses.workspaceId] }).onDelete('restrict'),
  externalMappingUnique: uniqueIndex('task_curriculum_mappings_external_unique')
    .on(table.workspaceId, table.taskSourceId, table.mappingType, table.externalValue),
  mappingTypeCheck: check('task_curriculum_mappings_type_check', sql`${table.mappingType} IN ('subject', 'course', 'topic', 'skill', 'category', 'section')`),
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
    content: jsonb('content').$type<{
      statement: string; options: Array<{ id: string; label: string }>; correctOptionId?: string;
      title?: string; blocks?: Array<Record<string, unknown>>; attachments?: Array<{ reference: string; label?: string }>;
      metadata?: Record<string, unknown>;
    }>().notNull(),
    answerSchema: jsonb('answer_schema').$type<{ type: string; required?: boolean; answer?: unknown }>().notNull(),
    evaluationRule: text('evaluation_rule').notNull(),
    provenance: jsonb('provenance').$type<{
      sourceKind: string; sourceIdentifier: string; licenseStatus?: string; fixtureVersion?: string;
      taskSourceId?: string; externalTaskId?: string; rawSnapshotId?: string; edited?: boolean;
      externalCurriculum?: Partial<Record<'subject' | 'course' | 'topic' | 'skill' | 'category' | 'section', string>>;
    }>().notNull(),
    rawSnapshotId: uuid('raw_snapshot_id'),
    publishedByUserId: uuid('published_by_user_id').references(() => users.id, { onDelete: 'set null' }),
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
    snapshotLineageFk: foreignKey({ name: 'task_versions_snapshot_lineage_fk',
      columns: [table.rawSnapshotId, table.taskId, table.workspaceId],
      foreignColumns: [taskSourceSnapshots.id, taskSourceSnapshots.taskId, taskSourceSnapshots.workspaceId] }).onDelete('restrict'),
    publishedDate: check('task_versions_published_date', sql`${table.status} <> 'published' OR ${table.publishedAt} IS NOT NULL`),
  }),
);

export const theoryMaterials = pgTable('theory_materials', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull(),
  workspaceId: uuid('workspace_id').notNull(),
  title: text('title').notNull(),
  description: text('description').default('').notNull(),
  category: text('category'),
  subjectId: uuid('subject_id').references(() => subjects.id, { onDelete: 'restrict' }),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'restrict' }),
  topicId: uuid('topic_id').references(() => topics.id, { onDelete: 'restrict' }),
  skillId: uuid('skill_id').references(() => skills.id, { onDelete: 'restrict' }),
  status: text('status').default('draft').notNull(),
  createdByUserId: uuid('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  workspaceFk: foreignKey({
    name: 'theory_materials_workspace_fk',
    columns: [table.workspaceId, table.organizationId],
    foreignColumns: [workspaces.id, workspaces.organizationId],
  }).onDelete('restrict'),
  courseWorkspaceFk: foreignKey({
    name: 'theory_materials_course_workspace_fk',
    columns: [table.courseId, table.workspaceId],
    foreignColumns: [courses.id, courses.workspaceId],
  }).onDelete('restrict'),
  materialWorkspaceUnique: uniqueIndex('theory_materials_id_workspace_unique').on(table.id, table.workspaceId),
  statusCheck: check('theory_materials_status_check', sql`${table.status} IN ('draft', 'published')`),
}));

export const theoryVersions = pgTable('theory_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  materialId: uuid('material_id').notNull(),
  workspaceId: uuid('workspace_id').notNull(),
  version: integer('version').notNull(),
  status: text('status').default('draft').notNull(),
  content: jsonb('content').$type<{ blocks: Array<Record<string, unknown>> }>().notNull(),
  metadata: jsonb('metadata').$type<{
    title: string; description: string; category: string | null;
    subjectId: string | null; courseId: string | null; topicId: string | null; skillId: string | null;
    taskIds: string[];
  }>().notNull(),
  createdByUserId: uuid('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  publishedByUserId: uuid('published_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  publishedByPrincipal: text('published_by_principal'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  materialWorkspaceFk: foreignKey({
    name: 'theory_versions_material_workspace_fk',
    columns: [table.materialId, table.workspaceId],
    foreignColumns: [theoryMaterials.id, theoryMaterials.workspaceId],
  }).onDelete('restrict'),
  materialVersionUnique: uniqueIndex('theory_versions_material_version_unique').on(table.materialId, table.version),
  versionWorkspaceUnique: uniqueIndex('theory_versions_id_workspace_unique').on(table.id, table.workspaceId),
  oneDraftPerMaterial: uniqueIndex('theory_versions_one_draft_per_material_unique')
    .on(table.materialId).where(sql`${table.status} = 'draft'`),
  statusCheck: check('theory_versions_status_check', sql`${table.status} IN ('draft', 'published')`),
  publishedState: check('theory_versions_published_state_check', sql`
    (${table.status} = 'draft' AND ${table.publishedAt} IS NULL)
    OR (${table.status} = 'published' AND ${table.publishedAt} IS NOT NULL AND ${table.publishedByPrincipal} IS NOT NULL)
  `),
}));

export const theoryMaterialTasks = pgTable('theory_material_tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  materialId: uuid('material_id').notNull(),
  workspaceId: uuid('workspace_id').notNull(),
  taskId: uuid('task_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  materialWorkspaceFk: foreignKey({
    name: 'theory_material_tasks_material_workspace_fk',
    columns: [table.materialId, table.workspaceId],
    foreignColumns: [theoryMaterials.id, theoryMaterials.workspaceId],
  }).onDelete('cascade'),
  taskWorkspaceFk: foreignKey({
    name: 'theory_material_tasks_task_workspace_fk',
    columns: [table.taskId, table.workspaceId],
    foreignColumns: [tasks.id, tasks.workspaceId],
  }).onDelete('restrict'),
  materialTaskUnique: uniqueIndex('theory_material_tasks_material_task_unique').on(table.materialId, table.taskId),
}));

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
  integrationId: uuid('integration_id').references(() => integrations.id, { onDelete: 'restrict' }),
  studentId: uuid('student_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  taskVersionId: uuid('task_version_id').notNull().references(() => taskVersions.id, { onDelete: 'restrict' }),
  assignmentId: uuid('assignment_id').references(() => assignments.id, { onDelete: 'restrict' }),
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
  learnerIntelligenceIndex: index('attempts_learner_intelligence_idx')
    .on(table.workspaceId, table.integrationId, table.studentId, table.startedAt.desc(), table.id.desc()),
}));

export const submissions = pgTable(
  'submissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    attemptId: uuid('attempt_id').notNull().references(() => attempts.id, { onDelete: 'cascade' }),
    workspaceId: uuid('workspace_id').notNull(),
    idempotencyKey: text('idempotency_key').notNull(),
    answer: jsonb('answer').$type<Record<string, unknown>>().notNull(),
    reviewStatus: text('review_status').default('evaluated').notNull(),
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
    reviewStatusCheck: check('submissions_review_status_check', sql`${table.reviewStatus} IN ('evaluated', 'pending_manual_review')`),
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
  details: jsonb('details').$type<{
    selectedOptionId?: string; correctOptionId?: string; reason?: string;
    learningHandoff?: 'recorded' | 'skipped_skill_unmapped';
  }>(),
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

export const trainerSessions = pgTable('trainer_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull(),
  workspaceId: uuid('workspace_id').notNull(),
  integrationId: uuid('integration_id').notNull(),
  externalUserId: uuid('external_user_id').notNull().references(() => externalUsers.id, { onDelete: 'restrict' }),
  learnerId: uuid('learner_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  subjectId: uuid('subject_id').references(() => subjects.id, { onDelete: 'restrict' }),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'restrict' }),
  topicId: uuid('topic_id').references(() => topics.id, { onDelete: 'restrict' }),
  skillId: uuid('skill_id').references(() => skills.id, { onDelete: 'restrict' }),
  idempotencyKey: text('idempotency_key').notNull(),
  requestFingerprint: text('request_fingerprint'),
  status: text('status').default('active').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (table) => ({
  integrationTenantFk: foreignKey({
    name: 'trainer_sessions_integration_tenant_fk',
    columns: [table.organizationId, table.workspaceId, table.integrationId],
    foreignColumns: [integrations.organizationId, integrations.workspaceId, integrations.id],
  }).onDelete('restrict'),
  courseWorkspaceFk: foreignKey({
    name: 'trainer_sessions_course_workspace_fk',
    columns: [table.courseId, table.workspaceId],
    foreignColumns: [courses.id, courses.workspaceId],
  }).onDelete('restrict'),
  sessionWorkspaceUnique: uniqueIndex('trainer_sessions_id_workspace_unique').on(table.id, table.workspaceId),
  idempotencyUnique: uniqueIndex('trainer_sessions_idempotency_unique').on(table.workspaceId, table.integrationId, table.externalUserId, table.idempotencyKey),
  learnerIntelligenceIndex: index('trainer_sessions_learner_intelligence_idx')
    .on(table.workspaceId, table.integrationId, table.externalUserId, table.startedAt.desc(), table.id.desc()),
  statusCheck: check('trainer_sessions_status_check', sql`${table.status} IN ('active', 'completed')`),
  completionState: check('trainer_sessions_completion_state_check', sql`
    (${table.status} = 'active' AND ${table.completedAt} IS NULL)
    OR (${table.status} = 'completed' AND ${table.completedAt} IS NOT NULL)
  `),
}));

export const trainerSessionItems = pgTable('trainer_session_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').notNull(),
  workspaceId: uuid('workspace_id').notNull(),
  position: integer('position').notNull(),
  taskVersionId: uuid('task_version_id').notNull(),
  attemptId: uuid('attempt_id').references(() => attempts.id, { onDelete: 'restrict' }),
  resultId: uuid('result_id').references(() => results.id, { onDelete: 'restrict' }),
  status: text('status').default('pending').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  sessionWorkspaceFk: foreignKey({
    name: 'trainer_session_items_session_workspace_fk',
    columns: [table.sessionId, table.workspaceId],
    foreignColumns: [trainerSessions.id, trainerSessions.workspaceId],
  }).onDelete('cascade'),
  taskVersionWorkspaceFk: foreignKey({
    name: 'trainer_session_items_task_version_workspace_fk',
    columns: [table.taskVersionId, table.workspaceId],
    foreignColumns: [taskVersions.id, taskVersions.workspaceId],
  }).onDelete('restrict'),
  attemptWorkspaceFk: foreignKey({
    name: 'trainer_session_items_attempt_workspace_fk',
    columns: [table.attemptId, table.workspaceId],
    foreignColumns: [attempts.id, attempts.workspaceId],
  }).onDelete('restrict'),
  sessionPositionUnique: uniqueIndex('trainer_session_items_session_position_unique').on(table.sessionId, table.position),
  sessionTaskVersionUnique: uniqueIndex('trainer_session_items_session_task_version_unique').on(table.sessionId, table.taskVersionId),
  itemWorkspaceUnique: uniqueIndex('trainer_session_items_id_workspace_unique').on(table.id, table.workspaceId),
  statusCheck: check('trainer_session_items_status_check', sql`${table.status} IN ('pending', 'started', 'submitted')`),
}));

export const externalResultObservations = pgTable('external_result_observations', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull(),
  workspaceId: uuid('workspace_id').notNull(),
  integrationId: uuid('integration_id').notNull(),
  learnerId: uuid('learner_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  externalLearnerId: text('external_learner_id').notNull(),
  taskSourceId: uuid('task_source_id').notNull(),
  externalTaskId: text('external_task_id').notNull(),
  taskVersionId: uuid('task_version_id').notNull(),
  idempotencyKey: text('idempotency_key').notNull(),
  outcome: resultOutcomeEnum('outcome'),
  score: integer('score'),
  observedAt: timestamp('observed_at', { withTimezone: true }).notNull(),
  sourceMetadata: jsonb('source_metadata').$type<Record<string, unknown>>().notNull(),
  learningHandoff: text('learning_handoff').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  integrationTenantFk: foreignKey({ name: 'external_result_observations_integration_tenant_fk',
    columns: [table.organizationId, table.workspaceId, table.integrationId],
    foreignColumns: [integrations.organizationId, integrations.workspaceId, integrations.id] }).onDelete('restrict'),
  sourceWorkspaceFk: foreignKey({ name: 'external_result_observations_source_workspace_fk', columns: [table.taskSourceId, table.workspaceId],
    foreignColumns: [taskSources.id, taskSources.workspaceId] }).onDelete('restrict'),
  taskVersionWorkspaceFk: foreignKey({ name: 'external_result_observations_task_version_workspace_fk', columns: [table.taskVersionId, table.workspaceId],
    foreignColumns: [taskVersions.id, taskVersions.workspaceId] }).onDelete('restrict'),
  idempotencyUnique: uniqueIndex('external_result_observations_idempotency_unique')
    .on(table.workspaceId, table.integrationId, table.idempotencyKey),
  workspaceUnique: uniqueIndex('external_result_observations_id_workspace_unique').on(table.id, table.workspaceId),
  handoffCheck: check('external_result_observations_handoff_check', sql`${table.learningHandoff} IN ('recorded', 'skipped_skill_unmapped')`),
}));

export const variants = pgTable('variants', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull(),
  workspaceId: uuid('workspace_id').notNull(),
  taskSourceId: uuid('task_source_id'),
  externalVariantId: text('external_variant_id'),
  sourceKind: text('source_kind').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  workspaceFk: foreignKey({ name: 'variants_workspace_fk', columns: [table.workspaceId, table.organizationId],
    foreignColumns: [workspaces.id, workspaces.organizationId] }).onDelete('restrict'),
  sourceWorkspaceFk: foreignKey({ name: 'variants_source_workspace_fk', columns: [table.taskSourceId, table.workspaceId],
    foreignColumns: [taskSources.id, taskSources.workspaceId] }).onDelete('restrict'),
  tenantExternalUnique: uniqueIndex('variants_source_external_unique')
    .on(table.workspaceId, table.taskSourceId, table.externalVariantId)
    .where(sql`${table.taskSourceId} IS NOT NULL AND ${table.externalVariantId} IS NOT NULL`),
  variantWorkspaceUnique: uniqueIndex('variants_id_workspace_unique').on(table.id, table.workspaceId),
}));

export const variantSourceSnapshots = pgTable('variant_source_snapshots', {
  id: uuid('id').defaultRandom().primaryKey(),
  variantId: uuid('variant_id').notNull(),
  workspaceId: uuid('workspace_id').notNull(),
  taskSourceId: uuid('task_source_id').notNull(),
  externalVariantId: text('external_variant_id').notNull(),
  idempotencyKey: text('idempotency_key').notNull(),
  rawPayload: jsonb('raw_payload').$type<Record<string, unknown>>().notNull(),
  checksum: text('checksum').notNull(),
  importedByUserId: uuid('imported_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  variantWorkspaceFk: foreignKey({ name: 'variant_snapshots_variant_workspace_fk', columns: [table.variantId, table.workspaceId],
    foreignColumns: [variants.id, variants.workspaceId] }).onDelete('restrict'),
  sourceWorkspaceFk: foreignKey({ name: 'variant_snapshots_source_workspace_fk', columns: [table.taskSourceId, table.workspaceId],
    foreignColumns: [taskSources.id, taskSources.workspaceId] }).onDelete('restrict'),
  snapshotWorkspaceUnique: uniqueIndex('variant_snapshots_id_variant_workspace_unique').on(table.id, table.variantId, table.workspaceId),
  sourceIdempotencyUnique: uniqueIndex('variant_snapshots_source_idempotency_unique').on(table.workspaceId, table.taskSourceId, table.idempotencyKey),
}));

export const variantVersions = pgTable('variant_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  variantId: uuid('variant_id').notNull(),
  workspaceId: uuid('workspace_id').notNull(),
  version: integer('version').notNull(),
  status: text('status').default('draft').notNull(),
  title: text('title'),
  description: text('description'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull(),
  rawSnapshotId: uuid('raw_snapshot_id'),
  provenance: jsonb('provenance').$type<Record<string, unknown>>().notNull(),
  publishedByUserId: uuid('published_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  variantWorkspaceFk: foreignKey({ name: 'variant_versions_variant_workspace_fk', columns: [table.variantId, table.workspaceId],
    foreignColumns: [variants.id, variants.workspaceId] }).onDelete('restrict'),
  rawSnapshotFk: foreignKey({ name: 'variant_versions_snapshot_lineage_fk', columns: [table.rawSnapshotId, table.variantId, table.workspaceId],
    foreignColumns: [variantSourceSnapshots.id, variantSourceSnapshots.variantId, variantSourceSnapshots.workspaceId] }).onDelete('restrict'),
  versionUnique: uniqueIndex('variant_versions_variant_version_unique').on(table.variantId, table.version),
  versionWorkspaceUnique: uniqueIndex('variant_versions_id_workspace_unique').on(table.id, table.workspaceId),
  statusCheck: check('variant_versions_status_check', sql`${table.status} IN ('draft', 'published', 'archived')`),
  publishedDateCheck: check('variant_versions_published_date_check', sql`${table.status} <> 'published' OR ${table.publishedAt} IS NOT NULL`),
}));

export const variantItems = pgTable('variant_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  variantVersionId: uuid('variant_version_id').notNull(),
  workspaceId: uuid('workspace_id').notNull(),
  position: integer('position').notNull(),
  taskVersionId: uuid('task_version_id'),
  externalTaskId: text('external_task_id'),
  required: boolean('required').default(true).notNull(),
  resolutionStatus: text('resolution_status').default('unresolved').notNull(),
  section: text('section'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull(),
}, (table) => ({
  versionWorkspaceFk: foreignKey({ name: 'variant_items_version_workspace_fk', columns: [table.variantVersionId, table.workspaceId],
    foreignColumns: [variantVersions.id, variantVersions.workspaceId] }).onDelete('restrict'),
  taskVersionWorkspaceFk: foreignKey({ name: 'variant_items_task_version_workspace_fk', columns: [table.taskVersionId, table.workspaceId],
    foreignColumns: [taskVersions.id, taskVersions.workspaceId] }).onDelete('restrict'),
  itemWorkspaceUnique: uniqueIndex('variant_items_id_workspace_unique').on(table.id, table.workspaceId),
  positionUnique: uniqueIndex('variant_items_version_position_unique').on(table.variantVersionId, table.position),
  resolutionCheck: check('variant_items_resolution_check', sql`(${table.resolutionStatus} = 'resolved' AND ${table.taskVersionId} IS NOT NULL) OR (${table.resolutionStatus} = 'unresolved')`),
}));

export const learningEvents = pgTable('learning_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  integrationId: uuid('integration_id').references(() => integrations.id, { onDelete: 'restrict' }),
  eventType: learningEventTypeEnum('event_type').notNull(),
  learnerId: uuid('learner_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  source: text('source').notNull(),
  sourceType: text('source_type').notNull(),
  sourceId: uuid('source_id').notNull(),
  taskVersionId: uuid('task_version_id').notNull(),
  courseId: uuid('course_id').notNull(),
  skillId: uuid('skill_id').notNull(),
  outcome: resultOutcomeEnum('outcome'),
  evaluationRule: text('evaluation_rule'),
  correlationId: text('correlation_id'),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  workspaceFk: foreignKey({
    name: 'learning_events_workspace_fk',
    columns: [table.workspaceId],
    foreignColumns: [workspaces.id],
  }).onDelete('restrict'),
  taskVersionWorkspaceFk: foreignKey({
    name: 'learning_events_task_version_workspace_fk',
    columns: [table.taskVersionId, table.workspaceId],
    foreignColumns: [taskVersions.id, taskVersions.workspaceId],
  }).onDelete('restrict'),
  courseWorkspaceFk: foreignKey({
    name: 'learning_events_course_workspace_fk',
    columns: [table.courseId, table.workspaceId],
    foreignColumns: [courses.id, courses.workspaceId],
  }).onDelete('restrict'),
  learningEventWorkspaceUnique: uniqueIndex('learning_events_id_workspace_unique').on(table.id, table.workspaceId),
  learningEventSourceUnique: uniqueIndex('learning_events_source_unique')
    .on(table.workspaceId, table.eventType, table.sourceType, table.sourceId),
  learnerIntelligenceIndex: index('learning_events_learner_intelligence_idx')
    .on(table.workspaceId, table.integrationId, table.learnerId, table.occurredAt.desc(), table.id.desc()),
}));

export const skillEvidence = pgTable('skill_evidence', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  learnerId: uuid('learner_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  courseId: uuid('course_id').notNull(),
  skillId: uuid('skill_id').notNull(),
  learningEventId: uuid('learning_event_id').notNull(),
  rule: text('rule').notNull(),
  outcome: resultOutcomeEnum('outcome').notNull(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  workspaceFk: foreignKey({
    name: 'skill_evidence_workspace_fk',
    columns: [table.workspaceId],
    foreignColumns: [workspaces.id],
  }).onDelete('restrict'),
  courseWorkspaceFk: foreignKey({
    name: 'skill_evidence_course_workspace_fk',
    columns: [table.courseId, table.workspaceId],
    foreignColumns: [courses.id, courses.workspaceId],
  }).onDelete('restrict'),
  learningEventWorkspaceFk: foreignKey({
    name: 'skill_evidence_event_workspace_fk',
    columns: [table.learningEventId, table.workspaceId],
    foreignColumns: [learningEvents.id, learningEvents.workspaceId],
  }).onDelete('restrict'),
  skillEvidenceWorkspaceUnique: uniqueIndex('skill_evidence_id_workspace_unique').on(table.id, table.workspaceId),
  skillEvidenceEventRuleUnique: uniqueIndex('skill_evidence_event_rule_unique')
    .on(table.workspaceId, table.learningEventId, table.rule),
  skillEvidenceLearnerSkillIndex: index('skill_evidence_learner_skill_idx')
    .on(table.workspaceId, table.learnerId, table.skillId, table.occurredAt),
  skillEvidenceLearnerTimelineIndex: index('skill_evidence_learner_timeline_idx')
    .on(table.workspaceId, table.learnerId, table.occurredAt.desc(), table.id.desc()),
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

export const knowledgeSources = pgTable('knowledge_sources', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'restrict' }),
  name: text('name').notNull(),
  sourceType: text('source_type').notNull(),
  externalReference: text('external_reference'),
  licenseStatus: knowledgeLicenseStatusEnum('license_status').default('unknown').notNull(),
  status: knowledgeSourceStatusEnum('status').default('active').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  sourceWorkspaceUnique: uniqueIndex('knowledge_sources_id_workspace_unique').on(table.id, table.workspaceId),
  sourceReferenceIndex: index('knowledge_sources_workspace_reference_idx').on(table.workspaceId, table.externalReference),
}));

export const knowledgeDocuments = pgTable('knowledge_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  sourceId: uuid('source_id').notNull(),
  documentKey: text('document_key').notNull(),
  title: text('title').notNull(),
  status: knowledgeDocumentStatusEnum('status').default('active').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  documentSourceWorkspaceFk: foreignKey({
    name: 'knowledge_documents_source_workspace_fk',
    columns: [table.sourceId, table.workspaceId],
    foreignColumns: [knowledgeSources.id, knowledgeSources.workspaceId],
  }).onDelete('restrict'),
  documentWorkspaceUnique: uniqueIndex('knowledge_documents_id_workspace_unique').on(table.id, table.workspaceId),
  documentKeyUnique: uniqueIndex('knowledge_documents_source_key_unique').on(table.workspaceId, table.sourceId, table.documentKey),
}));

export const knowledgeRawImports = pgTable('knowledge_raw_imports', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  documentId: uuid('document_id').notNull(),
  idempotencyKey: text('idempotency_key').notNull(),
  rawContent: text('raw_content').notNull(),
  contentChecksum: text('content_checksum').notNull(),
  sourceReference: text('source_reference'),
  importedAt: timestamp('imported_at', { withTimezone: true }).defaultNow().notNull(),
  importedByUserId: uuid('imported_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  rawDocumentWorkspaceFk: foreignKey({
    name: 'knowledge_raw_imports_document_workspace_fk',
    columns: [table.documentId, table.workspaceId],
    foreignColumns: [knowledgeDocuments.id, knowledgeDocuments.workspaceId],
  }).onDelete('restrict'),
  rawImportWorkspaceUnique: uniqueIndex('knowledge_raw_imports_id_workspace_unique').on(table.id, table.workspaceId),
  rawDocumentLineageUnique: uniqueIndex('knowledge_raw_imports_id_document_workspace_unique')
    .on(table.id, table.documentId, table.workspaceId),
  rawImportIdempotencyUnique: uniqueIndex('knowledge_raw_imports_idempotency_unique')
    .on(table.workspaceId, table.documentId, table.idempotencyKey),
}));

export const knowledgeDocumentVersions = pgTable('knowledge_document_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  documentId: uuid('document_id').notNull(),
  rawImportId: uuid('raw_import_id').notNull(),
  version: integer('version').notNull(),
  normalizedContent: text('normalized_content').notNull(),
  contentChecksum: text('content_checksum').notNull(),
  licenseStatus: knowledgeLicenseStatusEnum('license_status').notNull(),
  externalAiPermission: knowledgeExternalAiPermissionEnum('external_ai_permission').default('not_reviewed').notNull(),
  status: knowledgeVersionStatusEnum('status').default('draft').notNull(),
  approvedByUserId: uuid('approved_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  approvedByPrincipal: text('approved_by_principal'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  approvalNote: text('approval_note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  versionDocumentWorkspaceFk: foreignKey({
    name: 'knowledge_versions_document_workspace_fk',
    columns: [table.documentId, table.workspaceId],
    foreignColumns: [knowledgeDocuments.id, knowledgeDocuments.workspaceId],
  }).onDelete('restrict'),
  versionRawImportWorkspaceFk: foreignKey({
    name: 'knowledge_versions_raw_import_workspace_fk',
    columns: [table.rawImportId, table.workspaceId],
    foreignColumns: [knowledgeRawImports.id, knowledgeRawImports.workspaceId],
  }).onDelete('restrict'),
  versionRawDocumentWorkspaceFk: foreignKey({
    name: 'knowledge_versions_raw_document_workspace_fk',
    columns: [table.rawImportId, table.documentId, table.workspaceId],
    foreignColumns: [knowledgeRawImports.id, knowledgeRawImports.documentId, knowledgeRawImports.workspaceId],
  }).onDelete('restrict'),
  versionWorkspaceUnique: uniqueIndex('knowledge_versions_id_workspace_unique').on(table.id, table.workspaceId),
  versionDocumentLineageUnique: uniqueIndex('knowledge_versions_id_document_workspace_unique')
    .on(table.id, table.documentId, table.workspaceId),
  documentVersionUnique: uniqueIndex('knowledge_versions_document_version_unique').on(table.workspaceId, table.documentId, table.version),
  approvedDocumentUnique: uniqueIndex('knowledge_versions_one_approved_per_document_unique')
    .on(table.workspaceId, table.documentId)
    .where(sql`${table.status} = 'approved'`),
  approvedMetadataCheck: check('knowledge_versions_approved_metadata_check', sql`
    ${table.status} <> 'approved'
    OR (${table.approvedAt} IS NOT NULL AND ${table.approvedByPrincipal} IS NOT NULL)
  `),
}));

export const knowledgeChunks = pgTable('knowledge_chunks', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  documentId: uuid('document_id').notNull(),
  documentVersionId: uuid('document_version_id').notNull(),
  ordinal: integer('ordinal').notNull(),
  section: text('section'),
  content: text('content').notNull(),
  contentChecksum: text('content_checksum').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  chunkDocumentWorkspaceFk: foreignKey({
    name: 'knowledge_chunks_document_workspace_fk',
    columns: [table.documentId, table.workspaceId],
    foreignColumns: [knowledgeDocuments.id, knowledgeDocuments.workspaceId],
  }).onDelete('restrict'),
  chunkVersionWorkspaceFk: foreignKey({
    name: 'knowledge_chunks_version_workspace_fk',
    columns: [table.documentVersionId, table.workspaceId],
    foreignColumns: [knowledgeDocumentVersions.id, knowledgeDocumentVersions.workspaceId],
  }).onDelete('restrict'),
  chunkVersionDocumentWorkspaceFk: foreignKey({
    name: 'knowledge_chunks_version_document_workspace_fk',
    columns: [table.documentVersionId, table.documentId, table.workspaceId],
    foreignColumns: [knowledgeDocumentVersions.id, knowledgeDocumentVersions.documentId, knowledgeDocumentVersions.workspaceId],
  }).onDelete('restrict'),
  chunkWorkspaceUnique: uniqueIndex('knowledge_chunks_id_workspace_unique').on(table.id, table.workspaceId),
  chunkOrdinalUnique: uniqueIndex('knowledge_chunks_version_ordinal_unique').on(table.workspaceId, table.documentVersionId, table.ordinal),
}));

export const aiRequests = pgTable('ai_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'restrict' }),
  learnerId: uuid('learner_id').references(() => users.id, { onDelete: 'set null' }),
  capability: text('capability').notNull(),
  idempotencyKey: text('idempotency_key').notNull(),
  requestHash: text('request_hash').notNull(),
  policyVersion: text('policy_version').notNull(),
  promptVersion: text('prompt_version').notNull(),
  status: aiRequestStatusEnum('status').default('started').notNull(),
  provider: text('provider'),
  model: text('model'),
  contextReferences: jsonb('context_references').$type<Array<{ type: string; id: string }>>().notNull(),
  knowledgeReferences: jsonb('knowledge_references').$type<string[]>().notNull(),
  structuredOutput: jsonb('structured_output').$type<Record<string, unknown>>(),
  failureCategory: text('failure_category'),
  failureMessage: text('failure_message'),
  latencyMs: integer('latency_ms'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (table) => ({
  requestWorkspaceUnique: uniqueIndex('ai_requests_id_workspace_unique').on(table.id, table.workspaceId),
  requestIdempotencyUnique: uniqueIndex('ai_requests_idempotency_unique').on(table.workspaceId, table.capability, table.idempotencyKey),
  requestWorkspaceStatusIndex: index('ai_requests_workspace_status_idx').on(table.workspaceId, table.status, table.createdAt),
}));

export const aiUsageRecords = pgTable('ai_usage_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  aiRequestId: uuid('ai_request_id').notNull(),
  provider: text('provider').notNull(),
  model: text('model').notNull(),
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  totalTokens: integer('total_tokens'),
  estimatedCostMicros: integer('estimated_cost_micros'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  usageRequestWorkspaceFk: foreignKey({
    name: 'ai_usage_records_request_workspace_fk',
    columns: [table.aiRequestId, table.workspaceId],
    foreignColumns: [aiRequests.id, aiRequests.workspaceId],
  }).onDelete('cascade'),
  usageRequestUnique: uniqueIndex('ai_usage_records_request_unique').on(table.workspaceId, table.aiRequestId),
}));

export const aiEvaluationRecords = pgTable('ai_evaluation_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  aiRequestId: uuid('ai_request_id').notNull(),
  evaluatorVersion: text('evaluator_version').notNull(),
  status: text('status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  evaluationRequestWorkspaceFk: foreignKey({
    name: 'ai_evaluation_records_request_workspace_fk',
    columns: [table.aiRequestId, table.workspaceId],
    foreignColumns: [aiRequests.id, aiRequests.workspaceId],
  }).onDelete('cascade'),
  evaluationRequestUnique: uniqueIndex('ai_evaluation_records_request_unique').on(table.workspaceId, table.aiRequestId),
}));

export const whiteboards = pgTable('whiteboards', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull(),
  workspaceId: uuid('workspace_id').notNull(),
  integrationId: uuid('integration_id').notNull(),
  title: text('title').notNull(),
  externalReference: text('external_reference'),
  status: text('status').default('active').notNull(),
  currentRevision: integer('current_revision').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  integrationTenantFk: foreignKey({
    name: 'whiteboards_integration_tenant_fk',
    columns: [table.organizationId, table.workspaceId, table.integrationId],
    foreignColumns: [integrations.organizationId, integrations.workspaceId, integrations.id],
  }).onDelete('restrict'),
  boardWorkspaceUnique: uniqueIndex('whiteboards_id_workspace_unique').on(table.id, table.workspaceId),
  statusCheck: check('whiteboards_status_check', sql`${table.status} IN ('active', 'archived')`),
}));

export const whiteboardSnapshots = pgTable('whiteboard_snapshots', {
  id: uuid('id').defaultRandom().primaryKey(),
  boardId: uuid('board_id').notNull(),
  workspaceId: uuid('workspace_id').notNull(),
  revision: integer('revision').notNull(),
  data: jsonb('data').$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  boardWorkspaceFk: foreignKey({
    name: 'whiteboard_snapshots_board_workspace_fk',
    columns: [table.boardId, table.workspaceId],
    foreignColumns: [whiteboards.id, whiteboards.workspaceId],
  }).onDelete('cascade'),
  boardRevisionUnique: uniqueIndex('whiteboard_snapshots_board_revision_unique').on(table.boardId, table.revision),
  snapshotWorkspaceUnique: uniqueIndex('whiteboard_snapshots_id_workspace_unique').on(table.id, table.workspaceId),
}));

export const whiteboardResources = pgTable('whiteboard_resources', {
  id: uuid('id').defaultRandom().primaryKey(),
  boardId: uuid('board_id').notNull(),
  workspaceId: uuid('workspace_id').notNull(),
  resourceType: text('resource_type').notNull(),
  taskVersionId: uuid('task_version_id'),
  theoryVersionId: uuid('theory_version_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  boardWorkspaceFk: foreignKey({
    name: 'whiteboard_resources_board_workspace_fk',
    columns: [table.boardId, table.workspaceId],
    foreignColumns: [whiteboards.id, whiteboards.workspaceId],
  }).onDelete('cascade'),
  taskVersionWorkspaceFk: foreignKey({
    name: 'whiteboard_resources_task_version_workspace_fk',
    columns: [table.taskVersionId, table.workspaceId],
    foreignColumns: [taskVersions.id, taskVersions.workspaceId],
  }).onDelete('restrict'),
  theoryVersionWorkspaceFk: foreignKey({
    name: 'whiteboard_resources_theory_version_workspace_fk',
    columns: [table.theoryVersionId, table.workspaceId],
    foreignColumns: [theoryVersions.id, theoryVersions.workspaceId],
  }).onDelete('restrict'),
  boardTaskUnique: uniqueIndex('whiteboard_resources_board_task_unique').on(table.boardId, table.taskVersionId),
  boardTheoryUnique: uniqueIndex('whiteboard_resources_board_theory_unique').on(table.boardId, table.theoryVersionId),
  typeReferenceCheck: check('whiteboard_resources_type_reference_check', sql`
    (${table.resourceType} = 'task' AND ${table.taskVersionId} IS NOT NULL AND ${table.theoryVersionId} IS NULL)
    OR (${table.resourceType} = 'theory' AND ${table.theoryVersionId} IS NOT NULL AND ${table.taskVersionId} IS NULL)
  `),
}));

export type User = typeof users.$inferSelect;
export type TaskVersion = typeof taskVersions.$inferSelect;
export type Attempt = typeof attempts.$inferSelect;
export type Result = typeof results.$inferSelect;
export type LearningEvent = typeof learningEvents.$inferSelect;
export type SkillEvidenceRecord = typeof skillEvidence.$inferSelect;
export type KnowledgeSource = typeof knowledgeSources.$inferSelect;
export type KnowledgeDocument = typeof knowledgeDocuments.$inferSelect;
export type KnowledgeRawImport = typeof knowledgeRawImports.$inferSelect;
export type KnowledgeDocumentVersion = typeof knowledgeDocumentVersions.$inferSelect;
export type KnowledgeChunk = typeof knowledgeChunks.$inferSelect;
export type AiRequest = typeof aiRequests.$inferSelect;
export type AiUsageRecord = typeof aiUsageRecords.$inferSelect;
export type AiEvaluationRecord = typeof aiEvaluationRecords.$inferSelect;
