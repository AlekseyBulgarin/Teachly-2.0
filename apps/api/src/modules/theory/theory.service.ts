import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, inArray, isNull, or, type SQL } from 'drizzle-orm';
import { DatabaseService } from '../../infrastructure/database/database';
import {
  courses,
  memberships,
  skills,
  subjects,
  tasks,
  theoryMaterials,
  theoryMaterialTasks,
  theoryVersions,
  topics,
} from '../../infrastructure/database/schema';
import { AuditService } from '../audit/audit.service';
import { CoreAccessService } from '../core/core.access';
import { TenancyService } from '../tenancy/tenancy.service';
import type { CreateTheoryMaterialDto, TheoryListQueryDto, UpdateTheoryDraftDto } from './theory.dto';
import type { TheoryAuthContext, TheoryContent, TheoryVersionMetadata } from './theory.types';

@Injectable()
export class TheoryService {
  constructor(
    private readonly database: DatabaseService,
    private readonly audit: AuditService,
    private readonly core: CoreAccessService,
    private readonly tenancy: TenancyService,
  ) {}

  async create(auth: TheoryAuthContext, input: CreateTheoryMaterialDto) {
    const tenant = await this.resolveWriteTenant(auth, input.organizationId, input.workspaceId);
    const content = this.requireContent(input.content);
    const taskIds = [...new Set(input.taskIds ?? [])];
    await this.validateReferences(tenant.workspaceId, input, taskIds);
    const metadata = this.createMetadata(input, taskIds);
    return this.database.transaction(async () => {
      const [material] = await this.database.db.insert(theoryMaterials).values({
        organizationId: tenant.organizationId,
        workspaceId: tenant.workspaceId,
        title: input.title.trim(),
        description: input.description?.trim() ?? '',
        category: input.category?.trim(),
        subjectId: input.subjectId,
        courseId: input.courseId,
        topicId: input.topicId,
        skillId: input.skillId,
        createdByUserId: auth.principal?.userId,
      }).returning();
      if (!material) throw new Error('Theory material creation failed');
      const [version] = await this.database.db.insert(theoryVersions).values({
        materialId: material.id,
        workspaceId: material.workspaceId,
        version: 1,
        content,
        metadata,
        createdByUserId: auth.principal?.userId,
      }).returning();
      if (!version) throw new Error('Theory version creation failed');
      await this.replaceTaskLinks(material.id, material.workspaceId, taskIds);
      await this.audit.record(auth.principal?.userId ?? null, 'theory_material_created', 'theory_material', material.id, { version: 1 }, material.workspaceId);
      return this.toView(material, version);
    });
  }

  async listEditor(auth: TheoryAuthContext, query: TheoryListQueryDto) {
    const workspaceId = await this.resolveReadWorkspace(auth, query.workspaceId, true);
    const rows = await this.database.db.select({ material: theoryMaterials, version: theoryVersions })
      .from(theoryMaterials)
      .innerJoin(theoryVersions, eq(theoryVersions.materialId, theoryMaterials.id))
      .where(eq(theoryMaterials.workspaceId, workspaceId))
      .orderBy(desc(theoryMaterials.updatedAt), desc(theoryVersions.version));
    const latest = this.firstVersionPerMaterial(rows).slice(0, query.limit ?? 50);
    return latest.map((row) => this.toView(row.material, row.version));
  }

  async getEditor(auth: TheoryAuthContext, materialId: string) {
    const row = await this.requireMaterial(materialId);
    await this.assertAccess(auth, row.organizationId, row.workspaceId, true);
    const versions = await this.database.db.select().from(theoryVersions)
      .where(and(eq(theoryVersions.materialId, materialId), eq(theoryVersions.workspaceId, row.workspaceId)))
      .orderBy(desc(theoryVersions.version));
    const latest = versions[0];
    if (!latest) throw new NotFoundException('Theory version not found');
    return { ...this.toView(row, latest), versions };
  }

  async updateDraft(auth: TheoryAuthContext, materialId: string, input: UpdateTheoryDraftDto) {
    const material = await this.requireMaterial(materialId);
    await this.assertAccess(auth, material.organizationId, material.workspaceId, true);
    const [existingDraft] = await this.database.db.select().from(theoryVersions)
      .where(and(eq(theoryVersions.materialId, materialId), eq(theoryVersions.status, 'draft'))).limit(1);
    const baseMetadata = existingDraft?.metadata ?? this.metadataFromMaterial(material, await this.taskIds(materialId));
    const metadata = this.mergeMetadata(baseMetadata, input);
    await this.validateReferences(material.workspaceId, {
      subjectId: metadata.subjectId ?? undefined,
      courseId: metadata.courseId ?? undefined,
      topicId: metadata.topicId ?? undefined,
      skillId: metadata.skillId ?? undefined,
    }, metadata.taskIds);
    const content = input.content === undefined ? undefined : this.requireContent(input.content);
    return this.database.transaction(async () => {
      const [draft] = await this.database.db.select().from(theoryVersions)
        .where(and(eq(theoryVersions.materialId, materialId), eq(theoryVersions.status, 'draft'))).limit(1);
      let version = draft;
      if (draft) {
        if (content) {
          [version] = await this.database.db.update(theoryVersions).set({ content, metadata, updatedAt: new Date() })
            .where(and(eq(theoryVersions.id, draft.id), eq(theoryVersions.status, 'draft'))).returning();
        } else {
          [version] = await this.database.db.update(theoryVersions).set({ metadata, updatedAt: new Date() })
            .where(and(eq(theoryVersions.id, draft.id), eq(theoryVersions.status, 'draft'))).returning();
        }
      } else {
        const [latest] = await this.database.db.select().from(theoryVersions)
          .where(eq(theoryVersions.materialId, materialId)).orderBy(desc(theoryVersions.version)).limit(1);
        if (!latest) throw new NotFoundException('Theory version not found');
        [version] = await this.database.db.insert(theoryVersions).values({
          materialId,
          workspaceId: material.workspaceId,
          version: latest.version + 1,
          content: content ?? latest.content,
          metadata,
          createdByUserId: auth.principal?.userId,
        }).returning();
      }
      if (!version) throw new ConflictException('Theory draft changed concurrently');
      await this.audit.record(auth.principal?.userId ?? null, 'theory_draft_updated', 'theory_version', version.id, { materialId, version: version.version }, material.workspaceId);
      return this.toView(material, version);
    });
  }

  async publish(auth: TheoryAuthContext, materialId: string) {
    const material = await this.requireMaterial(materialId);
    await this.assertAccess(auth, material.organizationId, material.workspaceId, true);
    return this.database.transaction(async () => {
      const [draft] = await this.database.db.select().from(theoryVersions)
        .where(and(eq(theoryVersions.materialId, materialId), eq(theoryVersions.status, 'draft'))).limit(1);
      if (!draft) throw new ConflictException('No draft version is available to publish');
      const publishedAt = new Date();
      const publishedByPrincipal = auth.principal
        ? `user:${auth.principal.userId}`
        : `api_key:${auth.tenant!.principal.apiKeyId}`;
      const [published] = await this.database.db.update(theoryVersions).set({
        status: 'published',
        publishedAt,
        publishedByUserId: auth.principal?.userId,
        publishedByPrincipal,
        updatedAt: publishedAt,
      }).where(and(eq(theoryVersions.id, draft.id), eq(theoryVersions.status, 'draft'))).returning();
      if (!published) throw new ConflictException('Theory draft changed concurrently');
      const metadata = published.metadata;
      const [updatedMaterial] = await this.database.db.update(theoryMaterials).set({
        title: metadata.title,
        description: metadata.description,
        category: metadata.category,
        subjectId: metadata.subjectId,
        courseId: metadata.courseId,
        topicId: metadata.topicId,
        skillId: metadata.skillId,
        status: 'published',
        updatedAt: publishedAt,
      })
        .where(eq(theoryMaterials.id, materialId)).returning();
      await this.replaceTaskLinks(materialId, material.workspaceId, metadata.taskIds);
      await this.audit.record(auth.principal?.userId ?? null, 'theory_version_published', 'theory_version', published.id, { materialId, version: published.version }, material.workspaceId);
      return this.toView(updatedMaterial!, published);
    });
  }

  async listPublished(auth: TheoryAuthContext, query: TheoryListQueryDto) {
    const workspaceId = await this.resolveReadWorkspace(auth, query.workspaceId, false);
    const conditions: SQL[] = [eq(theoryMaterials.workspaceId, workspaceId), eq(theoryMaterials.status, 'published'), eq(theoryVersions.status, 'published')];
    if (query.subjectId) conditions.push(eq(theoryMaterials.subjectId, query.subjectId));
    if (query.courseId) conditions.push(eq(theoryMaterials.courseId, query.courseId));
    if (query.topicId) conditions.push(eq(theoryMaterials.topicId, query.topicId));
    if (query.skillId) conditions.push(eq(theoryMaterials.skillId, query.skillId));
    const rows = await this.database.db.select({ material: theoryMaterials, version: theoryVersions })
      .from(theoryMaterials).innerJoin(theoryVersions, eq(theoryVersions.materialId, theoryMaterials.id))
      .where(and(...conditions)).orderBy(desc(theoryMaterials.updatedAt), desc(theoryVersions.version));
    const latest = this.firstVersionPerMaterial(rows).slice(0, query.limit ?? 50);
    return latest.map((row) => this.toView(row.material, row.version));
  }

  async getPublished(auth: TheoryAuthContext, materialId: string) {
    const [row] = await this.database.db.select({ material: theoryMaterials, version: theoryVersions })
      .from(theoryMaterials).innerJoin(theoryVersions, eq(theoryVersions.materialId, theoryMaterials.id))
      .where(and(eq(theoryMaterials.id, materialId), eq(theoryMaterials.status, 'published'), eq(theoryVersions.status, 'published')))
      .orderBy(desc(theoryVersions.version)).limit(1);
    if (!row) throw new NotFoundException('Published theory material not found');
    await this.assertAccess(auth, row.material.organizationId, row.material.workspaceId, false);
    return this.toView(row.material, row.version);
  }

  /** Approved Theory context for future AI integrations. Never returns drafts. */
  async listPublishedContext(auth: TheoryAuthContext, query: TheoryListQueryDto) {
    return this.listPublished(auth, query);
  }

  private requireContent(value: Record<string, unknown>): TheoryContent {
    const blocks = value.blocks;
    if (!Array.isArray(blocks) || blocks.length === 0) throw new BadRequestException('Theory content requires at least one block');
    const allowed = new Set(['heading', 'paragraph', 'list', 'formula', 'image', 'file', 'example', 'callout']);
    for (const block of blocks) {
      if (!block || typeof block !== 'object' || !allowed.has((block as { type?: unknown }).type as string)) {
        throw new BadRequestException('Theory content contains an unsupported block');
      }
      const typed = block as Record<string, unknown>;
      if (['heading', 'paragraph', 'example', 'callout'].includes(typed.type as string) && typeof typed.text !== 'string') {
        throw new BadRequestException(`Theory ${String(typed.type)} block requires text`);
      }
      if (typed.type === 'list' && (!Array.isArray(typed.items) || typed.items.some((item) => typeof item !== 'string'))) {
        throw new BadRequestException('Theory list block requires string items');
      }
      if (typed.type === 'formula' && typeof typed.latex !== 'string') throw new BadRequestException('Theory formula block requires latex');
      if (['image', 'file'].includes(typed.type as string) && typeof typed.reference !== 'string') {
        throw new BadRequestException(`Theory ${String(typed.type)} block requires a reference`);
      }
    }
    return { blocks: blocks as TheoryContent['blocks'] };
  }

  private async validateReferences(workspaceId: string, input: { subjectId?: string; courseId?: string; topicId?: string; skillId?: string }, taskIds?: string[]) {
    if (input.subjectId) {
      const [subject] = await this.database.db.select({ id: subjects.id }).from(subjects).where(eq(subjects.id, input.subjectId)).limit(1);
      if (!subject) throw new BadRequestException('Theory subject does not exist');
    }
    if (input.courseId) {
      const [course] = await this.database.db.select().from(courses).where(and(eq(courses.id, input.courseId), eq(courses.workspaceId, workspaceId))).limit(1);
      if (!course || (input.subjectId && course.subjectId !== input.subjectId)) throw new BadRequestException('Theory course is outside the curriculum mapping');
    }
    if (input.topicId) {
      const [topic] = await this.database.db.select({ id: topics.id, courseId: topics.courseId, workspaceId: courses.workspaceId })
        .from(topics).innerJoin(courses, eq(courses.id, topics.courseId))
        .where(and(eq(topics.id, input.topicId), eq(courses.workspaceId, workspaceId))).limit(1);
      if (!topic || (input.courseId && topic.courseId !== input.courseId)) throw new BadRequestException('Theory topic is outside the curriculum mapping');
    }
    if (input.skillId) {
      const [skill] = await this.database.db.select({ id: skills.id, topicId: skills.topicId, workspaceId: courses.workspaceId })
        .from(skills).innerJoin(topics, eq(topics.id, skills.topicId)).innerJoin(courses, eq(courses.id, topics.courseId))
        .where(and(eq(skills.id, input.skillId), eq(courses.workspaceId, workspaceId))).limit(1);
      if (!skill || (input.topicId && skill.topicId !== input.topicId)) throw new BadRequestException('Theory skill is outside the curriculum mapping');
    }
    if (taskIds?.length) {
      const found = await this.database.db.select({ id: tasks.id }).from(tasks)
        .where(and(eq(tasks.workspaceId, workspaceId), inArray(tasks.id, taskIds)));
      if (found.length !== taskIds.length) throw new BadRequestException('Theory task links must belong to the workspace');
    }
  }

  private async replaceTaskLinks(materialId: string, workspaceId: string, taskIds: string[]) {
    await this.database.db.delete(theoryMaterialTasks).where(eq(theoryMaterialTasks.materialId, materialId));
    if (taskIds.length) await this.database.db.insert(theoryMaterialTasks).values(taskIds.map((taskId) => ({ materialId, workspaceId, taskId })));
  }

  private async taskIds(materialId: string) {
    return (await this.database.db.select({ taskId: theoryMaterialTasks.taskId }).from(theoryMaterialTasks)
      .where(eq(theoryMaterialTasks.materialId, materialId))).map((row) => row.taskId);
  }

  private async requireMaterial(materialId: string) {
    const [material] = await this.database.db.select().from(theoryMaterials).where(eq(theoryMaterials.id, materialId)).limit(1);
    if (!material) throw new NotFoundException('Theory material not found');
    return material;
  }

  private async resolveWriteTenant(auth: TheoryAuthContext, organizationId?: string, workspaceId?: string) {
    if (auth.tenant) return { organizationId: auth.tenant.organizationId, workspaceId: auth.tenant.workspaceId };
    if (!auth.principal || !organizationId || !workspaceId) throw new ForbiddenException('Organization and workspace are required');
    await this.assertHumanRole(auth.principal.userId, organizationId, workspaceId, true);
    await this.tenancy.requireActiveWorkspace(organizationId, workspaceId);
    return { organizationId, workspaceId };
  }

  private async resolveReadWorkspace(auth: TheoryAuthContext, workspaceId: string | undefined, write: boolean) {
    if (auth.tenant) return auth.tenant.workspaceId;
    if (!auth.principal || !workspaceId) throw new ForbiddenException('Workspace is required');
    await this.assertHumanRole(auth.principal.userId, '', workspaceId, write);
    return workspaceId;
  }

  private async assertAccess(auth: TheoryAuthContext, organizationId: string, workspaceId: string, write: boolean) {
    if (auth.tenant) {
      if (auth.tenant.organizationId !== organizationId || auth.tenant.workspaceId !== workspaceId) throw new NotFoundException('Theory material not found');
      this.core.assertWorkspaceAccess(auth.tenant, { organizationId, workspaceId });
      return;
    }
    if (!auth.principal) throw new ForbiddenException('Authentication required');
    await this.assertHumanRole(auth.principal.userId, organizationId, workspaceId, write);
  }

  private async assertHumanRole(userId: string, organizationId: string, workspaceId: string, write: boolean) {
    const conditions: SQL[] = [eq(memberships.userId, userId), eq(memberships.status, 'active'),
      or(eq(memberships.workspaceId, workspaceId), and(isNull(memberships.workspaceId), eq(memberships.role, 'organization_admin'))) as SQL];
    if (organizationId) conditions.push(eq(memberships.organizationId, organizationId));
    const [membership] = await this.database.db.select({ role: memberships.role }).from(memberships).where(and(...conditions)).limit(1);
    const role = membership?.role;
    const allowed = write ? role === 'organization_admin' || role === 'workspace_admin' || role === 'content_editor' : !!role;
    if (!allowed) throw new ForbiddenException('Theory access denied');
  }

  private firstVersionPerMaterial<T extends { material: { id: string } }>(rows: T[]): T[] {
    const seen = new Set<string>();
    return rows.filter((row) => !seen.has(row.material.id) && !!seen.add(row.material.id));
  }

  private createMetadata(input: CreateTheoryMaterialDto, taskIds: string[]): TheoryVersionMetadata {
    return {
      title: input.title.trim(),
      description: input.description?.trim() ?? '',
      category: input.category?.trim() ?? null,
      subjectId: input.subjectId ?? null,
      courseId: input.courseId ?? null,
      topicId: input.topicId ?? null,
      skillId: input.skillId ?? null,
      taskIds,
    };
  }

  private metadataFromMaterial(material: typeof theoryMaterials.$inferSelect, taskIds: string[]): TheoryVersionMetadata {
    return {
      title: material.title,
      description: material.description,
      category: material.category,
      subjectId: material.subjectId,
      courseId: material.courseId,
      topicId: material.topicId,
      skillId: material.skillId,
      taskIds,
    };
  }

  private mergeMetadata(base: TheoryVersionMetadata, input: UpdateTheoryDraftDto): TheoryVersionMetadata {
    return {
      title: input.title?.trim() ?? base.title,
      description: input.description?.trim() ?? base.description,
      category: input.category?.trim() ?? base.category,
      subjectId: input.subjectId ?? base.subjectId,
      courseId: input.courseId ?? base.courseId,
      topicId: input.topicId ?? base.topicId,
      skillId: input.skillId ?? base.skillId,
      taskIds: input.taskIds === undefined ? base.taskIds : [...new Set(input.taskIds)],
    };
  }

  private toView(material: typeof theoryMaterials.$inferSelect, version: typeof theoryVersions.$inferSelect) {
    const metadata = version.metadata;
    return {
      id: material.id,
      title: metadata.title,
      description: metadata.description,
      category: metadata.category,
      status: version.status,
      curriculum: { subjectId: metadata.subjectId, courseId: metadata.courseId, topicId: metadata.topicId, skillId: metadata.skillId },
      taskIds: metadata.taskIds,
      version,
      createdAt: material.createdAt,
      updatedAt: version.updatedAt,
    };
  }
}
