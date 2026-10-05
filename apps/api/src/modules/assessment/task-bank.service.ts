import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, isNull, or } from 'drizzle-orm';
import { DatabaseService } from '../../infrastructure/database/database';
import {
  courses,
  externalResultObservations,
  memberships,
  skills,
  subjects,
  taskCurriculumMappings,
  taskSourceSnapshots,
  taskSources,
  taskVersions,
  tasks,
  topics,
  workspaces,
} from '../../infrastructure/database/schema';
import { AuditService } from '../audit/audit.service';
import { CoreAccessService } from '../core/core.access';
import { TenancyService } from '../tenancy/tenancy.service';
import { ExternalUsersService } from '../external-users/external-users.service';
import { LearningService } from '../learning/learning.service';
import { GenericJsonTaskSourceAdapter } from './task-bank.adapter';
import type { CreateCurriculumMappingDto, CreateDraftDto, CreateTaskSourceDto, ExternalResultObservationDto, ImportTaskDto, UpdateDraftDto } from './task-bank.dto';
import { curriculumMappingTypes, type ExternalCurriculumReferences, type NormalizedTaskContent, type TaskBankAuthContext } from './task-bank.types';

type TaskBankVersion = typeof taskVersions.$inferSelect;

@Injectable()
export class TaskBankService {
  constructor(
    private readonly database: DatabaseService,
    private readonly tenancy: TenancyService,
    private readonly audit: AuditService,
    private readonly core: CoreAccessService,
    private readonly adapter: GenericJsonTaskSourceAdapter,
    private readonly externalUsers: ExternalUsersService,
    private readonly learning: LearningService,
  ) {}

  async requireAssessmentSource(sourceId: string) {
    return this.requireSource(sourceId);
  }

  async assertAssessmentRead(auth: TaskBankAuthContext, organizationId: string, workspaceId: string): Promise<void> {
    await this.assertReadAccess(auth, organizationId, workspaceId);
  }

  async assertAssessmentWrite(auth: TaskBankAuthContext, organizationId: string, workspaceId: string): Promise<void> {
    await this.assertWriteAccess(auth, organizationId, workspaceId);
  }

  async resolveAssessmentReadWorkspace(auth: TaskBankAuthContext, workspaceId?: string) {
    return this.resolveReadWorkspace(auth, workspaceId);
  }

  async createSource(auth: TaskBankAuthContext, input: CreateTaskSourceDto) {
    const tenant = await this.resolveWriteTenant(auth, input.organizationId, input.workspaceId);
    if (input.integrationId && input.integrationId !== tenant.tenant?.integrationId) throw new ForbiddenException('Integration access denied');
    const [source] = await this.database.db.insert(taskSources).values({
      organizationId: tenant.organizationId,
      workspaceId: tenant.workspaceId,
      integrationId: input.integrationId ?? tenant.tenant?.integrationId,
      name: input.name,
      sourceType: input.sourceType,
      mode: input.mode,
      metadata: (input.metadata ?? {}) as { description?: string; provider?: string },
    }).returning();
    if (!source) throw new Error('Task source creation failed');
    await this.audit.record(auth.principal?.userId ?? null, 'task_source_created', 'task_source', source.id, { sourceType: source.sourceType, mode: source.mode }, source.workspaceId);
    return this.toSourceView(source);
  }

  async listSources(auth: TaskBankAuthContext, workspaceId?: string, limit = 50) {
    const workspace = await this.resolveReadWorkspace(auth, workspaceId);
    const rows = await this.database.db.select().from(taskSources)
      .where(eq(taskSources.workspaceId, workspace))
      .orderBy(desc(taskSources.createdAt), desc(taskSources.id))
      .limit(Math.min(Math.max(limit, 1), 100));
    return rows.map((source) => this.toSourceView(source));
  }

  async getSource(auth: TaskBankAuthContext, sourceId: string) {
    const [source] = await this.database.db.select().from(taskSources).where(eq(taskSources.id, sourceId)).limit(1);
    if (!source) throw new NotFoundException('Task source not found');
    await this.assertReadAccess(auth, source.organizationId, source.workspaceId);
    return this.toSourceView(source);
  }

  async upsertCurriculumMapping(auth: TaskBankAuthContext, input: CreateCurriculumMappingDto) {
    const source = await this.requireSource(input.taskSourceId);
    if (source.workspaceId !== input.workspaceId) throw new NotFoundException('Task source not found');
    await this.assertWriteAccess(auth, source.organizationId, source.workspaceId);
    const targets = await this.resolveMappingTargets(source.workspaceId, input);
    const [mapping] = await this.database.db.insert(taskCurriculumMappings).values({
      organizationId: source.organizationId,
      workspaceId: source.workspaceId,
      taskSourceId: source.id,
      mappingType: input.mappingType,
      externalValue: input.externalValue,
      ...targets,
      createdByUserId: auth.principal?.userId,
    }).onConflictDoUpdate({
      target: [
        taskCurriculumMappings.workspaceId,
        taskCurriculumMappings.taskSourceId,
        taskCurriculumMappings.mappingType,
        taskCurriculumMappings.externalValue,
      ],
      set: { ...targets, updatedAt: new Date(), createdByUserId: auth.principal?.userId },
    }).returning();
    if (!mapping) throw new Error('Curriculum mapping upsert failed');
    await this.applyMappingToImportedTasks(mapping);
    await this.audit.record(auth.principal?.userId ?? null, 'task_curriculum_mapping_upserted', 'task_curriculum_mapping', mapping.id, {
      taskSourceId: source.id, mappingType: mapping.mappingType, externalValue: mapping.externalValue,
    }, source.workspaceId);
    return this.toMappingView(mapping);
  }

  async listCurriculumMappings(
    auth: TaskBankAuthContext,
    workspaceId?: string,
    taskSourceId?: string,
    limit = 50,
  ) {
    const workspace = await this.resolveReadWorkspace(auth, workspaceId);
    if (taskSourceId) {
      const source = await this.requireSource(taskSourceId);
      await this.assertReadAccess(auth, source.organizationId, source.workspaceId);
      if (source.workspaceId !== workspace) throw new NotFoundException('Task source not found');
    }
    const rows = await this.database.db.select().from(taskCurriculumMappings).where(and(
      eq(taskCurriculumMappings.workspaceId, workspace),
      taskSourceId ? eq(taskCurriculumMappings.taskSourceId, taskSourceId) : undefined,
    )).orderBy(desc(taskCurriculumMappings.createdAt), desc(taskCurriculumMappings.id))
      .limit(Math.min(Math.max(limit, 1), 100));
    return rows.map((mapping) => this.toMappingView(mapping));
  }

  async importTask(auth: TaskBankAuthContext, sourceId: string, input: ImportTaskDto) {
    const source = await this.requireSource(sourceId);
    await this.assertWriteAccess(auth, source.organizationId, source.workspaceId);
    if (source.status !== 'active') throw new ForbiddenException('Task source is disabled');
    const normalized = this.adapter.normalizeTask(input.rawPayload);
    const mappedCurriculum = await this.resolveMappedCurriculum(source, normalized.curriculum);
    const checksum = this.adapter.checksum(input.rawPayload);
    const existingImport = await this.database.db.select().from(taskSourceSnapshots).where(and(
      eq(taskSourceSnapshots.taskSourceId, source.id),
      eq(taskSourceSnapshots.workspaceId, source.workspaceId),
      eq(taskSourceSnapshots.idempotencyKey, input.idempotencyKey),
    )).limit(1);
    if (existingImport[0]) {
      const existingVersion = await this.latestVersion(existingImport[0].taskId, source.workspaceId);
      if (!existingVersion) throw new Error('Imported task version is missing');
      return { ...this.toTaskVersionView(existingVersion), idempotentReplay: true };
    }

    return this.database.transaction(async () => {
      const [existingTask] = await this.database.db.select().from(tasks).where(and(
        eq(tasks.workspaceId, source.workspaceId), eq(tasks.taskSourceId, source.id), eq(tasks.externalTaskId, input.externalTaskId),
      )).limit(1);
      const task = existingTask ?? (await this.database.db.insert(tasks).values({
        workspaceId: source.workspaceId,
        taskSourceId: source.id,
        externalTaskId: input.externalTaskId,
        sourceKind: source.mode,
        ...mappedCurriculum,
      }).returning())[0];
      if (!task) throw new Error('Task creation failed');
      if (existingTask && Object.keys(mappedCurriculum).length > 0) {
        await this.database.db.update(tasks).set(mappedCurriculum).where(and(
          eq(tasks.id, task.id), eq(tasks.workspaceId, source.workspaceId),
        ));
      }
      const [snapshot] = await this.database.db.insert(taskSourceSnapshots).values({
        workspaceId: source.workspaceId, taskId: task.id, taskSourceId: source.id,
        externalTaskId: input.externalTaskId, idempotencyKey: input.idempotencyKey,
        rawPayload: input.rawPayload, checksum, importedByUserId: auth.principal?.userId,
      }).returning();
      if (!snapshot) throw new Error('Task snapshot creation failed');
      const latest = await this.latestVersion(task.id, source.workspaceId);
      const [version] = await this.database.db.insert(taskVersions).values({
        taskId: task.id, workspaceId: source.workspaceId, version: (latest?.version ?? 0) + 1,
        taskType: normalized.taskType, status: 'draft', content: { ...normalized.content, options: normalized.content.options ?? [] },
        answerSchema: normalized.answerSchema, evaluationRule: normalized.answerSchema.evaluatorCapability === 'automatic' ? 'single-choice.v1' : 'manual-review',
        provenance: { sourceKind: source.mode, sourceIdentifier: source.id, taskSourceId: source.id, externalTaskId: input.externalTaskId, rawSnapshotId: snapshot.id, externalCurriculum: normalized.curriculum, edited: false },
        rawSnapshotId: snapshot.id,
      }).returning();
      if (!version) throw new Error('Task version creation failed');
      await this.audit.record(auth.principal?.userId ?? null, 'task_imported', 'task', task.id, {
        taskSourceId: source.id, externalTaskId: input.externalTaskId, rawSnapshotId: snapshot.id, versionId: version.id,
      }, source.workspaceId);
      return { ...this.toTaskVersionView(version), idempotentReplay: false };
    });
  }

  async listPublished(auth: TaskBankAuthContext, workspaceId?: string, limit = 50) {
    const workspace = await this.resolveReadWorkspace(auth, workspaceId);
    const rows = await this.database.db.select().from(taskVersions).where(and(
      eq(taskVersions.workspaceId, workspace), eq(taskVersions.status, 'published'),
    )).orderBy(desc(taskVersions.publishedAt)).limit(Math.min(Math.max(limit, 1), 100));
    return rows.map((row) => this.toTaskVersionView(row));
  }

  async getPublished(auth: TaskBankAuthContext, taskVersionId: string) {
    const [row] = await this.database.db.select({ version: taskVersions, task: tasks }).from(taskVersions)
      .innerJoin(tasks, eq(tasks.id, taskVersions.taskId)).where(and(eq(taskVersions.id, taskVersionId), eq(taskVersions.status, 'published'))).limit(1);
    if (!row) throw new NotFoundException('Published task version not found');
    await this.assertReadAccess(auth, await this.organizationForTask(row.task), row.task.workspaceId);
    return this.toTaskVersionView(row.version);
  }

  async getAnswer(auth: TaskBankAuthContext, taskVersionId: string) {
    const [row] = await this.database.db.select({ version: taskVersions, task: tasks }).from(taskVersions)
      .innerJoin(tasks, eq(tasks.id, taskVersions.taskId)).where(and(eq(taskVersions.id, taskVersionId), eq(taskVersions.status, 'published'))).limit(1);
    if (!row) throw new NotFoundException('Published task version not found');
    await this.assertAnswerAccess(auth, row.task.workspaceId);
    await this.audit.record(auth.principal?.userId ?? null, 'task_answer_revealed', 'task_version', taskVersionId, {}, row.task.workspaceId);
    return { taskVersionId, answerSchema: this.publicAnswerSchema(row.version.answerSchema), answer: this.answerFor(row.version) };
  }

  async createDraft(auth: TaskBankAuthContext, taskId: string, input: CreateDraftDto) {
    const [task] = await this.database.db.select().from(tasks).where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, input.workspaceId))).limit(1);
    if (!task) throw new NotFoundException('Task not found');
    await this.assertWriteAccess(auth, await this.organizationForTask(task), task.workspaceId);
    const latest = await this.latestVersion(task.id, task.workspaceId);
    const [version] = await this.database.db.insert(taskVersions).values({
      taskId: task.id, workspaceId: task.workspaceId, version: (latest?.version ?? 0) + 1,
      taskType: input.taskType, status: 'draft', content: input.content as typeof taskVersions.$inferInsert.content,
      answerSchema: input.answerSchema as typeof taskVersions.$inferInsert.answerSchema, evaluationRule: this.evaluationRule(input.taskType, input.answerSchema),
      provenance: { sourceKind: task.sourceKind, sourceIdentifier: task.externalTaskId ?? task.id, taskSourceId: task.taskSourceId ?? undefined, externalTaskId: task.externalTaskId ?? undefined, edited: true },
    }).returning();
    if (!version) throw new Error('Draft creation failed');
    await this.audit.record(auth.principal?.userId ?? null, 'task_draft_created', 'task_version', version.id, { taskId: task.id, version: version.version }, task.workspaceId);
    return this.toTaskVersionView(version);
  }

  async updateDraft(auth: TaskBankAuthContext, draftId: string, input: UpdateDraftDto) {
    const [row] = await this.database.db.select({ version: taskVersions, task: tasks }).from(taskVersions)
      .innerJoin(tasks, eq(tasks.id, taskVersions.taskId)).where(eq(taskVersions.id, draftId)).limit(1);
    if (!row) throw new NotFoundException('Task draft not found');
    await this.assertWriteAccess(auth, await this.organizationForTask(row.task), row.task.workspaceId);
    if (row.version.status === 'published') {
      const latest = await this.latestVersion(row.task.id, row.task.workspaceId);
      const [created] = await this.database.db.insert(taskVersions).values({
        taskId: row.task.id, workspaceId: row.task.workspaceId, version: (latest?.version ?? 0) + 1,
        taskType: input.taskType ?? row.version.taskType, status: 'draft',
        content: (input.content ?? row.version.content) as typeof taskVersions.$inferInsert.content,
        answerSchema: (input.answerSchema ?? row.version.answerSchema) as typeof taskVersions.$inferInsert.answerSchema,
        evaluationRule: this.evaluationRule(input.taskType ?? row.version.taskType, input.answerSchema ?? row.version.answerSchema),
        provenance: { ...row.version.provenance, edited: true }, rawSnapshotId: row.version.rawSnapshotId,
      }).returning();
      if (!created) throw new Error('Draft version creation failed');
      await this.audit.record(auth.principal?.userId ?? null, 'task_content_edited', 'task_version', created.id, { supersedesTaskVersionId: row.version.id, taskId: row.task.id }, row.task.workspaceId);
      return this.toTaskVersionView(created);
    }
    const [updated] = await this.database.db.update(taskVersions).set({
      taskType: input.taskType ?? row.version.taskType,
      content: input.content as typeof taskVersions.$inferInsert.content ?? row.version.content,
      answerSchema: input.answerSchema as typeof taskVersions.$inferInsert.answerSchema ?? row.version.answerSchema,
      evaluationRule: this.evaluationRule(input.taskType ?? row.version.taskType, input.answerSchema ?? row.version.answerSchema),
      provenance: { ...row.version.provenance, edited: true },
    }).where(and(eq(taskVersions.id, draftId), eq(taskVersions.status, 'draft'))).returning();
    if (!updated) throw new NotFoundException('Task draft not found');
    await this.audit.record(auth.principal?.userId ?? null, 'task_content_edited', 'task_version', updated.id, { taskId: row.task.id, version: updated.version }, row.task.workspaceId);
    return this.toTaskVersionView(updated);
  }

  async publishDraft(auth: TaskBankAuthContext, draftId: string) {
    const [row] = await this.database.db.select({ version: taskVersions, task: tasks }).from(taskVersions)
      .innerJoin(tasks, eq(tasks.id, taskVersions.taskId)).where(eq(taskVersions.id, draftId)).limit(1);
    if (!row) throw new NotFoundException('Task draft not found');
    await this.assertWriteAccess(auth, await this.organizationForTask(row.task), row.task.workspaceId);
    if (row.version.status !== 'draft') throw new ForbiddenException('Only drafts can be published');
    const [published] = await this.database.db.update(taskVersions).set({ status: 'published', publishedAt: new Date(), publishedByUserId: auth.principal?.userId })
      .where(and(eq(taskVersions.id, draftId), eq(taskVersions.status, 'draft'))).returning();
    if (!published) throw new NotFoundException('Task draft not found');
    await this.audit.record(auth.principal?.userId ?? null, 'task_published', 'task_version', published.id, { taskId: published.taskId, version: published.version }, row.task.workspaceId);
    return this.toTaskVersionView(published);
  }

  async observeExternalResult(auth: TaskBankAuthContext, input: ExternalResultObservationDto) {
    const tenant = auth.tenant;
    if (!tenant) throw new ForbiddenException('External result observation requires integration authentication');
    const source = await this.requireSource(input.taskSourceId);
    await this.assertWriteAccess(auth, source.organizationId, source.workspaceId);
    const learner = await this.externalUsers.resolveActiveLearner(tenant, input.externalLearnerId);
    const [task] = await this.database.db.select().from(tasks).where(and(
      eq(tasks.workspaceId, tenant.workspaceId),
      eq(tasks.taskSourceId, source.id),
      eq(tasks.externalTaskId, input.externalTaskId),
    )).limit(1);
    if (!task) throw new NotFoundException('Imported task not found');
    const [version] = await this.database.db.select().from(taskVersions).where(and(
      eq(taskVersions.taskId, task.id),
      eq(taskVersions.workspaceId, tenant.workspaceId),
      eq(taskVersions.status, 'published'),
    )).orderBy(desc(taskVersions.version)).limit(1);
    if (!version) throw new NotFoundException('Published task version not found');

    return this.database.transaction(async () => {
      const [existing] = await this.database.db.select().from(externalResultObservations).where(and(
        eq(externalResultObservations.workspaceId, tenant.workspaceId),
        eq(externalResultObservations.integrationId, tenant.integrationId),
        eq(externalResultObservations.idempotencyKey, input.idempotencyKey),
      )).limit(1);
      if (existing) return { ...this.toExternalObservationView(existing), idempotentReplay: true };
      const learningHandoff = task.skillId && task.courseId ? 'recorded' : 'skipped_skill_unmapped';
      const [observation] = await this.database.db.insert(externalResultObservations).values({
        organizationId: tenant.organizationId,
        workspaceId: tenant.workspaceId,
        integrationId: tenant.integrationId,
        learnerId: learner.learnerId,
        externalLearnerId: input.externalLearnerId,
        taskSourceId: source.id,
        externalTaskId: input.externalTaskId,
        taskVersionId: version.id,
        idempotencyKey: input.idempotencyKey,
        outcome: input.outcome,
        score: input.score,
        observedAt: new Date(input.observedAt),
        sourceMetadata: input.sourceMetadata ?? {},
        learningHandoff,
      }).returning();
      if (!observation) throw new Error('External result observation failed');
      if (learningHandoff === 'recorded' && input.outcome && task.courseId && task.skillId) {
        await this.learning.recordExternalResultFacts({
          workspaceId: tenant.workspaceId,
          integrationId: tenant.integrationId,
          learnerId: learner.learnerId,
          taskVersionId: version.id,
          courseId: task.courseId,
          skillId: task.skillId,
          observationId: observation.id,
          outcome: input.outcome,
          occurredAt: observation.observedAt,
        });
      }
      await this.audit.record(auth.principal?.userId ?? null, 'external_result_observed', 'external_result_observation', observation.id, {
        taskSourceId: source.id, externalTaskId: input.externalTaskId, externalLearnerId: input.externalLearnerId,
        learningHandoff,
      }, tenant.workspaceId);
      return { ...this.toExternalObservationView(observation), idempotentReplay: false };
    });
  }

  private async latestVersion(taskId: string, workspaceId: string) {
    return (await this.database.db.select().from(taskVersions).where(and(eq(taskVersions.taskId, taskId), eq(taskVersions.workspaceId, workspaceId))).orderBy(desc(taskVersions.version)).limit(1))[0];
  }

  private async requireSource(sourceId: string) {
    const [source] = await this.database.db.select().from(taskSources).where(eq(taskSources.id, sourceId)).limit(1);
    if (!source) throw new NotFoundException('Task source not found');
    return source;
  }

  private async organizationForTask(task: typeof tasks.$inferSelect) {
    if (task.taskSourceId) {
      const [source] = await this.database.db.select({ organizationId: taskSources.organizationId }).from(taskSources).where(eq(taskSources.id, task.taskSourceId)).limit(1);
      if (source) return source.organizationId;
    }
    const [workspace] = await this.database.db.select({ organizationId: workspaces.organizationId }).from(workspaces).where(eq(workspaces.id, task.workspaceId)).limit(1);
    if (!workspace) throw new NotFoundException('Workspace not found');
    return workspace.organizationId;
  }

  private async resolveMappingTargets(workspaceId: string, input: CreateCurriculumMappingDto) {
    let resolved: { subjectId: string | null; courseId: string | null; topicId: string | null; skillId: string | null } = {
      subjectId: null, courseId: null, topicId: null, skillId: null,
    };
    if (input.skillId) {
      const [row] = await this.database.db.select({
        subjectId: courses.subjectId, courseId: courses.id, topicId: topics.id, skillId: skills.id,
      }).from(skills).innerJoin(topics, eq(topics.id, skills.topicId)).innerJoin(courses, eq(courses.id, topics.courseId))
        .where(and(eq(skills.id, input.skillId), eq(courses.workspaceId, workspaceId))).limit(1);
      if (!row) throw new NotFoundException('Skill not found in workspace');
      resolved = row;
    } else if (input.topicId) {
      const [row] = await this.database.db.select({
        subjectId: courses.subjectId, courseId: courses.id, topicId: topics.id,
      }).from(topics).innerJoin(courses, eq(courses.id, topics.courseId))
        .where(and(eq(topics.id, input.topicId), eq(courses.workspaceId, workspaceId))).limit(1);
      if (!row) throw new NotFoundException('Topic not found in workspace');
      resolved = { ...row, skillId: null };
    } else if (input.courseId) {
      const [row] = await this.database.db.select({ subjectId: courses.subjectId, courseId: courses.id }).from(courses)
        .where(and(eq(courses.id, input.courseId), eq(courses.workspaceId, workspaceId))).limit(1);
      if (!row) throw new NotFoundException('Course not found in workspace');
      resolved = { ...row, topicId: null, skillId: null };
    } else if (input.subjectId) {
      const [row] = await this.database.db.select({ subjectId: subjects.id }).from(subjects)
        .where(eq(subjects.id, input.subjectId)).limit(1);
      if (!row) throw new NotFoundException('Subject not found');
      resolved.subjectId = row.subjectId;
    }
    for (const key of ['subjectId', 'courseId', 'topicId', 'skillId'] as const) {
      if (input[key] && resolved[key] !== input[key]) throw new BadRequestException('Curriculum mapping targets are inconsistent');
    }
    return resolved;
  }

  private async resolveMappedCurriculum(source: typeof taskSources.$inferSelect, references: ExternalCurriculumReferences) {
    const rows = await this.database.db.select().from(taskCurriculumMappings).where(and(
      eq(taskCurriculumMappings.workspaceId, source.workspaceId),
      eq(taskCurriculumMappings.taskSourceId, source.id),
    ));
    const resolved: Partial<Pick<typeof tasks.$inferInsert, 'subjectId' | 'courseId' | 'topicId' | 'skillId'>> = {};
    for (const mappingType of curriculumMappingTypes) {
      const externalValue = references[mappingType];
      if (!externalValue) continue;
      const mapping = rows.find((row) => row.mappingType === mappingType && row.externalValue === externalValue);
      if (!mapping) continue;
      if (mapping.subjectId) resolved.subjectId = mapping.subjectId;
      if (mapping.courseId) resolved.courseId = mapping.courseId;
      if (mapping.topicId) resolved.topicId = mapping.topicId;
      if (mapping.skillId) resolved.skillId = mapping.skillId;
    }
    return resolved;
  }

  private async applyMappingToImportedTasks(mapping: typeof taskCurriculumMappings.$inferSelect) {
    const update = {
      ...(mapping.subjectId ? { subjectId: mapping.subjectId } : {}),
      ...(mapping.courseId ? { courseId: mapping.courseId } : {}),
      ...(mapping.topicId ? { topicId: mapping.topicId } : {}),
      ...(mapping.skillId ? { skillId: mapping.skillId } : {}),
    };
    if (Object.keys(update).length === 0) return;
    const importedTasks = await this.database.db.select().from(tasks).where(and(
      eq(tasks.workspaceId, mapping.workspaceId), eq(tasks.taskSourceId, mapping.taskSourceId),
    ));
    for (const task of importedTasks) {
      const [snapshot] = await this.database.db.select().from(taskSourceSnapshots).where(and(
        eq(taskSourceSnapshots.workspaceId, mapping.workspaceId), eq(taskSourceSnapshots.taskId, task.id),
      )).orderBy(desc(taskSourceSnapshots.createdAt)).limit(1);
      if (!snapshot) continue;
      const normalized = this.adapter.normalizeTask(snapshot.rawPayload);
      if (normalized.curriculum[mapping.mappingType as keyof ExternalCurriculumReferences] !== mapping.externalValue) continue;
      await this.database.db.update(tasks).set(update).where(and(eq(tasks.id, task.id), eq(tasks.workspaceId, mapping.workspaceId)));
    }
  }

  private async resolveWriteTenant(auth: TaskBankAuthContext, organizationId?: string, workspaceId?: string) {
    if (auth.tenant) return { organizationId: auth.tenant.organizationId, workspaceId: auth.tenant.workspaceId, tenant: auth.tenant };
    if (!auth.principal || !organizationId || !workspaceId) throw new ForbiddenException('Organization and workspace are required');
    await this.assertHumanRole(auth.principal.userId, organizationId, workspaceId, true);
    await this.tenancy.requireActiveWorkspace(organizationId, workspaceId);
    return { organizationId, workspaceId, tenant: undefined };
  }

  private async resolveReadWorkspace(auth: TaskBankAuthContext, workspaceId?: string) {
    if (auth.tenant) return auth.tenant.workspaceId;
    if (!auth.principal || !workspaceId) throw new ForbiddenException('Workspace is required');
    await this.assertHumanRole(auth.principal.userId, '', workspaceId, false);
    return workspaceId;
  }

  private async assertReadAccess(auth: TaskBankAuthContext, organizationId: string, workspaceId: string) {
    if (auth.tenant) {
      if (auth.tenant.organizationId !== organizationId || auth.tenant.workspaceId !== workspaceId) throw new NotFoundException('Task not found');
      this.core.assertWorkspaceAccess(auth.tenant, { organizationId, workspaceId });
      return;
    }
    if (!auth.principal) throw new ForbiddenException('Authentication required');
    await this.assertHumanRole(auth.principal.userId, organizationId, workspaceId, false);
  }

  private async assertWriteAccess(auth: TaskBankAuthContext, organizationId: string, workspaceId: string) {
    if (auth.tenant) {
      if (auth.tenant.organizationId !== organizationId || auth.tenant.workspaceId !== workspaceId) throw new NotFoundException('Task not found');
      this.core.assertWorkspaceAccess(auth.tenant, { organizationId, workspaceId });
      return;
    }
    if (!auth.principal) throw new ForbiddenException('Authentication required');
    await this.assertHumanRole(auth.principal.userId, organizationId, workspaceId, true);
  }

  private async assertAnswerAccess(auth: TaskBankAuthContext, workspaceId: string) {
    if (auth.tenant) { if (auth.tenant.workspaceId !== workspaceId || !auth.tenant.scopes.includes('assessment:answer:read')) throw new ForbiddenException('Answer access denied'); return; }
    if (!auth.principal) throw new ForbiddenException('Authentication required');
    await this.assertHumanRole(auth.principal.userId, '', workspaceId, true);
  }

  private async assertHumanRole(userId: string, organizationId: string, workspaceId: string, write: boolean) {
    const conditions = [eq(memberships.userId, userId), eq(memberships.status, 'active') as never,
      or(eq(memberships.workspaceId, workspaceId), and(isNull(memberships.workspaceId), eq(memberships.role, 'organization_admin'))) as never];
    if (organizationId) conditions.push(eq(memberships.organizationId, organizationId) as never);
    const rows = await this.database.db.select({ role: memberships.role }).from(memberships).where(and(...conditions)).limit(1);
    const role = rows[0]?.role;
    const allowed = write ? role === 'organization_admin' || role === 'workspace_admin' || role === 'content_editor' : !!role;
    if (!allowed) throw new ForbiddenException('Task Bank access denied');
  }

  private toSourceView(source: typeof taskSources.$inferSelect) {
    return { id: source.id, organizationId: source.organizationId, workspaceId: source.workspaceId, integrationId: source.integrationId, name: source.name, sourceType: source.sourceType, mode: source.mode, status: source.status, metadata: source.metadata, createdAt: source.createdAt, updatedAt: source.updatedAt };
  }

  private toMappingView(mapping: typeof taskCurriculumMappings.$inferSelect) {
    return {
      id: mapping.id,
      organizationId: mapping.organizationId,
      workspaceId: mapping.workspaceId,
      taskSourceId: mapping.taskSourceId,
      mappingType: mapping.mappingType,
      externalValue: mapping.externalValue,
      subjectId: mapping.subjectId,
      courseId: mapping.courseId,
      topicId: mapping.topicId,
      skillId: mapping.skillId,
      status: mapping.subjectId || mapping.courseId || mapping.topicId || mapping.skillId ? 'mapped' : 'unmapped',
      createdAt: mapping.createdAt,
      updatedAt: mapping.updatedAt,
    };
  }

  private toExternalObservationView(observation: typeof externalResultObservations.$inferSelect) {
    return {
      id: observation.id,
      externalLearnerId: observation.externalLearnerId,
      taskSourceId: observation.taskSourceId,
      externalTaskId: observation.externalTaskId,
      taskVersionId: observation.taskVersionId,
      outcome: observation.outcome,
      score: observation.score,
      observedAt: observation.observedAt,
      sourceMetadata: observation.sourceMetadata,
      learningHandoff: observation.learningHandoff,
      createdAt: observation.createdAt,
    };
  }

  private toTaskVersionView(version: TaskBankVersion) {
    const content = version.content as NormalizedTaskContent;
    return {
      id: version.id, taskId: version.taskId, version: version.version, taskType: version.taskType, status: version.status,
      content: { ...content, correctOptionId: undefined }, answerSchema: this.publicAnswerSchema(version.answerSchema),
      evaluatorCapability: (version.answerSchema as { evaluatorCapability?: string }).evaluatorCapability ?? 'unsupported',
      evaluationRule: version.evaluationRule, provenance: version.provenance, rawSnapshotId: version.rawSnapshotId,
      publishedAt: version.publishedAt, createdAt: version.createdAt,
    };
  }

  private publicAnswerSchema(schema: unknown) {
    const value = schema as Record<string, unknown>;
    return { type: value.type, required: value.required, evaluatorCapability: value.evaluatorCapability ?? 'unsupported' };
  }

  private answerFor(version: TaskBankVersion) {
    const content = version.content as NormalizedTaskContent;
    return content.correctOptionId ? { optionId: content.correctOptionId } : null;
  }

  private evaluationRule(taskType: string, answerSchema: Record<string, unknown>) {
    return taskType === 'single-choice' && answerSchema.evaluatorCapability === 'automatic' ? 'single-choice.v1' : 'manual-review';
  }

}
