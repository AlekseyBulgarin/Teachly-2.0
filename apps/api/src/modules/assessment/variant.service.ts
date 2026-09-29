import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq } from 'drizzle-orm';
import { createHash } from 'node:crypto';
import { DatabaseService } from '../../infrastructure/database/database';
import {
  taskVersions,
  tasks,
  variantItems,
  variantSourceSnapshots,
  variants,
  variantVersions,
  workspaces,
} from '../../infrastructure/database/schema';
import { AuditService } from '../audit/audit.service';
import { TaskBankService } from './task-bank.service';
import type { TaskBankAuthContext, VariantItemInput } from './task-bank.types';
import type { CreateVariantDraftDto, UpdateVariantDraftDto } from './variant.dto';

type VariantInputItem = VariantItemInput & { position: number };

@Injectable()
export class VariantService {
  constructor(
    private readonly database: DatabaseService,
    private readonly taskBank: TaskBankService,
    private readonly audit: AuditService,
  ) {}

  async createDraft(auth: TaskBankAuthContext, input: CreateVariantDraftDto) {
    const tenant = await this.resolveWriteTenant(auth, input.workspaceId);
    const source = input.taskSourceId ? await this.taskBank.requireAssessmentSource(input.taskSourceId) : null;
    if (source && source.workspaceId !== tenant.workspaceId) throw new NotFoundException('Task source not found');
    if (input.externalVariantId && !source) throw new BadRequestException('External variants require a task source');
    await this.taskBank.assertAssessmentWrite(auth, source?.organizationId ?? tenant.organizationId, tenant.workspaceId);
    const parsed = this.parseInput(input);

    if (source && input.externalVariantId && input.idempotencyKey) {
      const [existingSnapshot] = await this.database.db.select().from(variantSourceSnapshots).where(and(
        eq(variantSourceSnapshots.workspaceId, tenant.workspaceId),
        eq(variantSourceSnapshots.taskSourceId, source.id),
        eq(variantSourceSnapshots.idempotencyKey, input.idempotencyKey),
      )).limit(1);
      if (existingSnapshot) {
        const existingVersion = await this.latestVersion(existingSnapshot.variantId, tenant.workspaceId);
        if (!existingVersion) throw new Error('Variant version is missing');
        return { ...(await this.toVersionView(existingVersion.id, auth)), idempotentReplay: true };
      }
    }

    return this.database.transaction(async () => {
      let [variant] = source && input.externalVariantId
        ? await this.database.db.select().from(variants).where(and(
          eq(variants.workspaceId, tenant.workspaceId), eq(variants.taskSourceId, source.id), eq(variants.externalVariantId, input.externalVariantId),
        )).limit(1)
        : [];
      if (!variant) {
        [variant] = await this.database.db.insert(variants).values({
          organizationId: tenant.organizationId,
          workspaceId: tenant.workspaceId,
          taskSourceId: source?.id,
          externalVariantId: input.externalVariantId,
          sourceKind: source?.mode ?? 'manual',
        }).returning();
      }
      if (!variant) throw new Error('Variant creation failed');
      const latest = await this.latestVersion(variant.id, tenant.workspaceId);
      const rawSnapshot = source && input.externalVariantId && input.rawPayload && input.idempotencyKey
        ? (await this.database.db.insert(variantSourceSnapshots).values({
          variantId: variant.id,
          workspaceId: tenant.workspaceId,
          taskSourceId: source.id,
          externalVariantId: input.externalVariantId,
          idempotencyKey: input.idempotencyKey,
          rawPayload: input.rawPayload,
          checksum: this.checksum(input.rawPayload),
          importedByUserId: auth.principal?.userId,
        }).returning())[0]
        : undefined;
      const [version] = await this.database.db.insert(variantVersions).values({
        variantId: variant.id,
        workspaceId: tenant.workspaceId,
        version: (latest?.version ?? 0) + 1,
        status: 'draft',
        title: parsed.title,
        description: parsed.description,
        metadata: parsed.metadata,
        rawSnapshotId: rawSnapshot?.id,
        provenance: {
          sourceKind: variant.sourceKind,
          taskSourceId: source?.id,
          externalVariantId: input.externalVariantId,
          rawSnapshotId: rawSnapshot?.id,
          edited: !rawSnapshot,
        },
      }).returning();
      if (!version) throw new Error('Variant version creation failed');
      await this.replaceItems(version.id, tenant.workspaceId, parsed.items);
      await this.audit.record(auth.principal?.userId ?? null, 'variant_draft_created', 'variant_version', version.id, {
        variantId: variant.id, externalVariantId: input.externalVariantId, itemCount: parsed.items.length,
      }, tenant.workspaceId);
      return { ...(await this.toVersionView(version.id, auth)), idempotentReplay: false };
    });
  }

  async listPublished(auth: TaskBankAuthContext, workspaceId?: string, limit = 50) {
    const workspace = await this.taskBank.resolveAssessmentReadWorkspace(auth, workspaceId);
    const rows = await this.database.db.select({ version: variantVersions, variant: variants })
      .from(variantVersions).innerJoin(variants, eq(variants.id, variantVersions.variantId))
      .where(and(eq(variantVersions.workspaceId, workspace), eq(variantVersions.status, 'published')))
      .orderBy(desc(variantVersions.version)).limit(Math.min(Math.max(limit, 1), 100) * 2);
    const seen = new Set<string>();
    const result = [];
    for (const row of rows) {
      if (seen.has(row.variant.id)) continue;
      seen.add(row.variant.id);
      await this.taskBank.assertAssessmentRead(auth, row.variant.organizationId, row.variant.workspaceId);
      result.push(await this.toVersionView(row.version.id, auth));
      if (result.length >= Math.min(Math.max(limit, 1), 100)) break;
    }
    return result;
  }

  async getPublished(auth: TaskBankAuthContext, versionId: string) {
    const row = await this.requireVersion(versionId);
    if (row.version.status !== 'published') throw new NotFoundException('Published variant not found');
    await this.taskBank.assertAssessmentRead(auth, row.variant.organizationId, row.variant.workspaceId);
    return this.toVersionView(versionId, auth);
  }

  async updateDraft(auth: TaskBankAuthContext, versionId: string, input: UpdateVariantDraftDto) {
    const row = await this.requireVersion(versionId);
    await this.taskBank.assertAssessmentWrite(auth, row.variant.organizationId, row.variant.workspaceId);
    const items = input.items ? this.normalizeItems(input.items) : (await this.currentItems(versionId)).map((item) => ({
      position: item.position,
      taskVersionId: item.taskVersionId ?? undefined,
      externalTaskId: item.externalTaskId ?? undefined,
      required: item.required,
      section: item.section ?? undefined,
      metadata: item.metadata,
    }));
    if (row.version.status === 'published') {
      const latest = await this.latestVersion(row.variant.id, row.variant.workspaceId);
      const [created] = await this.database.db.insert(variantVersions).values({
        variantId: row.variant.id,
        workspaceId: row.variant.workspaceId,
        version: (latest?.version ?? 0) + 1,
        status: 'draft',
        title: input.title ?? row.version.title,
        description: input.description ?? row.version.description,
        metadata: input.metadata ?? row.version.metadata,
        rawSnapshotId: row.version.rawSnapshotId,
        provenance: { ...row.version.provenance, edited: true, supersedesVariantVersionId: row.version.id },
      }).returning();
      if (!created) throw new Error('Variant draft version creation failed');
      await this.replaceItems(created.id, row.variant.workspaceId, items);
      await this.audit.record(auth.principal?.userId ?? null, 'variant_content_edited', 'variant_version', created.id, { supersedesVariantVersionId: row.version.id }, row.variant.workspaceId);
      return this.toVersionView(created.id, auth);
    }
    const [updated] = await this.database.db.update(variantVersions).set({
      title: input.title ?? row.version.title,
      description: input.description ?? row.version.description,
      metadata: input.metadata ?? row.version.metadata,
    }).where(and(eq(variantVersions.id, versionId), eq(variantVersions.status, 'draft'))).returning();
    if (!updated) throw new NotFoundException('Variant draft not found');
    if (input.items) await this.replaceItems(versionId, row.variant.workspaceId, items);
    await this.audit.record(auth.principal?.userId ?? null, 'variant_content_edited', 'variant_version', versionId, { itemCount: items.length }, row.variant.workspaceId);
    return this.toVersionView(versionId, auth);
  }

  async publishDraft(auth: TaskBankAuthContext, versionId: string) {
    const row = await this.requireVersion(versionId);
    await this.taskBank.assertAssessmentWrite(auth, row.variant.organizationId, row.variant.workspaceId);
    if (row.version.status !== 'draft') throw new ForbiddenException('Only variant drafts can be published');
    const source = row.variant.taskSourceId ? await this.taskBank.requireAssessmentSource(row.variant.taskSourceId) : null;
    const items = await this.currentItems(versionId);
    const unresolved: Array<{ position: number; externalTaskId?: string; reason: string }> = [];
    const resolved = [] as Array<{ id: string; taskVersionId: string; position: number }>;
    for (const item of items) {
      const taskVersionId = await this.resolveItemTaskVersion(row.variant.workspaceId, source?.id, item.taskVersionId, item.externalTaskId);
      if (!taskVersionId) {
        unresolved.push({ position: item.position, externalTaskId: item.externalTaskId ?? undefined, reason: 'published_task_version_not_found' });
      } else {
        resolved.push({ id: item.id, taskVersionId, position: item.position });
      }
    }
    if (unresolved.length > 0) throw new BadRequestException({
      error: 'VARIANT_UNRESOLVED',
      message: 'Variant has unresolved task references',
      details: unresolved,
    });
    return this.database.transaction(async () => {
      for (const item of resolved) {
        await this.database.db.update(variantItems).set({ taskVersionId: item.taskVersionId, resolutionStatus: 'resolved' }).where(eq(variantItems.id, item.id));
      }
      const [published] = await this.database.db.update(variantVersions).set({
        status: 'published', publishedAt: new Date(), publishedByUserId: auth.principal?.userId,
      }).where(and(eq(variantVersions.id, versionId), eq(variantVersions.status, 'draft'))).returning();
      if (!published) throw new NotFoundException('Variant draft not found');
      await this.audit.record(auth.principal?.userId ?? null, 'variant_published', 'variant_version', versionId, { itemCount: resolved.length }, row.variant.workspaceId);
      return this.toVersionView(published.id, auth);
    });
  }

  private async resolveWriteTenant(auth: TaskBankAuthContext, workspaceId?: string) {
    if (auth.tenant) return { organizationId: auth.tenant.organizationId, workspaceId: auth.tenant.workspaceId };
    if (!auth.principal || !workspaceId) throw new ForbiddenException('Workspace is required');
    const [workspace] = await this.database.db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);
    if (!workspace) throw new NotFoundException('Workspace not found');
    return { organizationId: workspace.organizationId, workspaceId };
  }

  private parseInput(input: CreateVariantDraftDto) {
    const raw = input.rawPayload;
    const rawItems = raw && Array.isArray(raw.items) ? raw.items : raw && Array.isArray(raw.tasks) ? raw.tasks : undefined;
    const items = input.items ?? (rawItems?.map((item: unknown) => {
      const value = item && typeof item === 'object' ? item as Record<string, unknown> : {};
      return {
        externalTaskId: typeof value.externalTaskId === 'string' ? value.externalTaskId : typeof value.taskId === 'string' ? value.taskId : undefined,
        position: typeof value.position === 'number' ? value.position : undefined,
        required: value.required !== false,
        section: typeof value.section === 'string' ? value.section : undefined,
        metadata: value.metadata && typeof value.metadata === 'object' && !Array.isArray(value.metadata) ? value.metadata as Record<string, unknown> : {},
      };
    }) ?? []);
    return {
      title: input.title ?? (raw && typeof raw.title === 'string' ? raw.title : undefined),
      description: input.description ?? (raw && typeof raw.description === 'string' ? raw.description : undefined),
      metadata: input.metadata ?? (raw?.metadata && typeof raw.metadata === 'object' && !Array.isArray(raw.metadata) ? raw.metadata as Record<string, unknown> : {}),
      items: this.normalizeItems(items),
    };
  }

  private normalizeItems(items: VariantItemInput[]) {
    const normalized = items.map((item, index) => ({ ...item, position: item.position ?? index }));
    const positions = new Set<number>();
    for (const item of normalized) {
      if (positions.has(item.position) || item.position < 0) throw new BadRequestException('Variant item positions must be unique and non-negative');
      if (!item.externalTaskId && !item.taskVersionId) throw new BadRequestException('Variant items require externalTaskId or taskVersionId');
      positions.add(item.position);
    }
    return normalized.sort((left, right) => left.position - right.position);
  }

  private async replaceItems(versionId: string, workspaceId: string, items: VariantInputItem[]) {
    await this.database.db.delete(variantItems).where(and(eq(variantItems.variantVersionId, versionId), eq(variantItems.workspaceId, workspaceId)));
    for (const item of items) {
      if (item.taskVersionId) await this.assertTaskVersionWorkspace(item.taskVersionId, workspaceId);
      await this.database.db.insert(variantItems).values({
        variantVersionId: versionId,
        workspaceId,
        position: item.position,
        taskVersionId: item.taskVersionId,
        externalTaskId: item.externalTaskId,
        required: item.required !== false,
        resolutionStatus: item.taskVersionId ? 'resolved' : 'unresolved',
        section: item.section,
        metadata: item.metadata ?? {},
      });
    }
  }

  private async resolveItemTaskVersion(workspaceId: string, sourceId?: string, taskVersionId?: string | null, externalTaskId?: string | null) {
    if (taskVersionId) {
      if (sourceId && externalTaskId) {
        const [row] = await this.database.db.select({ versionId: taskVersions.id }).from(tasks)
          .innerJoin(taskVersions, and(eq(taskVersions.taskId, tasks.id), eq(taskVersions.id, taskVersionId), eq(taskVersions.workspaceId, workspaceId), eq(taskVersions.status, 'published')))
          .where(and(eq(tasks.workspaceId, workspaceId), eq(tasks.taskSourceId, sourceId), eq(tasks.externalTaskId, externalTaskId)))
          .limit(1);
        return row?.versionId;
      }
      const [version] = await this.database.db.select({ id: taskVersions.id }).from(taskVersions).where(and(
        eq(taskVersions.id, taskVersionId), eq(taskVersions.workspaceId, workspaceId), eq(taskVersions.status, 'published'),
      )).limit(1);
      return version?.id;
    }
    if (!sourceId || !externalTaskId) return undefined;
    const [row] = await this.database.db.select({ versionId: taskVersions.id }).from(tasks)
      .innerJoin(taskVersions, and(eq(taskVersions.taskId, tasks.id), eq(taskVersions.workspaceId, workspaceId), eq(taskVersions.status, 'published')))
      .where(and(eq(tasks.workspaceId, workspaceId), eq(tasks.taskSourceId, sourceId), eq(tasks.externalTaskId, externalTaskId)))
      .orderBy(desc(taskVersions.version)).limit(1);
    return row?.versionId;
  }

  private async assertTaskVersionWorkspace(taskVersionId: string, workspaceId: string) {
    const [version] = await this.database.db.select({ id: taskVersions.id }).from(taskVersions).where(and(eq(taskVersions.id, taskVersionId), eq(taskVersions.workspaceId, workspaceId))).limit(1);
    if (!version) throw new NotFoundException('Task version not found in workspace');
  }

  private async requireVersion(versionId: string) {
    const [row] = await this.database.db.select({ version: variantVersions, variant: variants }).from(variantVersions)
      .innerJoin(variants, eq(variants.id, variantVersions.variantId)).where(eq(variantVersions.id, versionId)).limit(1);
    if (!row) throw new NotFoundException('Variant version not found');
    return row;
  }

  private async latestVersion(variantId: string, workspaceId: string) {
    return (await this.database.db.select().from(variantVersions).where(and(eq(variantVersions.variantId, variantId), eq(variantVersions.workspaceId, workspaceId))).orderBy(desc(variantVersions.version)).limit(1))[0];
  }

  private async currentItems(versionId: string) {
    return this.database.db.select().from(variantItems).where(eq(variantItems.variantVersionId, versionId)).orderBy(asc(variantItems.position));
  }

  private async toVersionView(versionId: string, auth: TaskBankAuthContext) {
    const row = await this.requireVersion(versionId);
    await this.taskBank.assertAssessmentRead(auth, row.variant.organizationId, row.variant.workspaceId);
    const items = await this.currentItems(versionId);
    return {
      id: row.version.id,
      variantId: row.variant.id,
      version: row.version.version,
      status: row.version.status,
      title: row.version.title,
      description: row.version.description,
      metadata: row.version.metadata,
      provenance: row.version.provenance,
      publishedAt: row.version.publishedAt,
      createdAt: row.version.createdAt,
      items: items.map((item) => ({
        id: item.id,
        position: item.position,
        taskVersionId: item.taskVersionId,
        externalTaskId: item.externalTaskId,
        required: item.required,
        resolutionStatus: item.resolutionStatus,
        section: item.section,
        metadata: item.metadata,
      })),
    };
  }

  private checksum(payload: Record<string, unknown>) {
    return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  }
}
