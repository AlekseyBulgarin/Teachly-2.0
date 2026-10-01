import { ConflictException, Injectable, NotFoundException, PayloadTooLargeException } from '@nestjs/common';
import { and, asc, desc, eq, type SQL } from 'drizzle-orm';
import { DatabaseService } from '../../infrastructure/database/database';
import { theoryVersions, whiteboards, whiteboardResources, whiteboardSnapshots } from '../../infrastructure/database/schema';
import { AuditService } from '../audit/audit.service';
import type { TenantContext } from '../core/core.types';
import { EducationService } from '../education/education.service';
import type { AttachWhiteboardResourceDto, CreateWhiteboardDto, SaveWhiteboardStateDto, WhiteboardListQueryDto, UpdateWhiteboardDto } from './whiteboard.dto';
import type { WhiteboardResourceView, WhiteboardSaveResult, WhiteboardStateView, WhiteboardStatus, WhiteboardView } from './whiteboard.types';
import { WHITEBOARD_MAX_DATA_BYTES } from './whiteboard.types';

@Injectable()
export class WhiteboardService {
  constructor(
    private readonly database: DatabaseService,
    private readonly audit: AuditService,
    private readonly education: EducationService,
  ) {}

  async create(tenant: TenantContext, input: CreateWhiteboardDto): Promise<WhiteboardView> {
    return this.database.transaction(async () => {
      const [board] = await this.database.db.insert(whiteboards).values({
        organizationId: tenant.organizationId,
        workspaceId: tenant.workspaceId,
        integrationId: tenant.integrationId,
        title: input.title.trim(),
        externalReference: input.externalReference ?? null,
      }).returning();
      if (!board) throw new Error('Whiteboard creation failed');
      await this.audit.record(null, 'whiteboard_created', 'whiteboard', board.id, { title: board.title }, tenant.workspaceId);
      return this.toView(board);
    });
  }

  async list(tenant: TenantContext, query: WhiteboardListQueryDto): Promise<WhiteboardView[]> {
    const conditions: SQL[] = [
      eq(whiteboards.organizationId, tenant.organizationId),
      eq(whiteboards.workspaceId, tenant.workspaceId),
      eq(whiteboards.integrationId, tenant.integrationId),
    ];
    if (query.status) conditions.push(eq(whiteboards.status, query.status));
    const boards = await this.database.db.select().from(whiteboards)
      .where(and(...conditions)).orderBy(desc(whiteboards.createdAt)).limit(query.limit ?? 50);
    return boards.map((board) => this.toView(board));
  }

  async get(tenant: TenantContext, boardId: string): Promise<WhiteboardView> {
    return this.toView(await this.requireBoard(tenant, boardId));
  }

  async update(tenant: TenantContext, boardId: string, input: UpdateWhiteboardDto): Promise<WhiteboardView> {
    const board = await this.requireBoard(tenant, boardId);
    if (board.status === 'archived') throw new ConflictException('Archived whiteboard cannot be modified');
    const patch: Partial<typeof whiteboards.$inferInsert> = { updatedAt: new Date() };
    if (input.title !== undefined) patch.title = input.title.trim();
    if (input.externalReference !== undefined) patch.externalReference = input.externalReference;
    if (input.status !== undefined) patch.status = input.status;
    const [updated] = await this.database.db.update(whiteboards).set(patch)
      .where(and(eq(whiteboards.id, board.id), eq(whiteboards.workspaceId, tenant.workspaceId), eq(whiteboards.status, 'active')))
      .returning();
    if (!updated) throw new ConflictException('Whiteboard changed concurrently');
    await this.audit.record(null, 'whiteboard_updated', 'whiteboard', updated.id, { status: updated.status, title: updated.title }, tenant.workspaceId);
    return this.toView(updated);
  }

  async getState(tenant: TenantContext, boardId: string): Promise<WhiteboardStateView> {
    const board = await this.requireBoard(tenant, boardId);
    if (board.currentRevision === 0) return { id: board.id, revision: 0, data: null };
    const [snapshot] = await this.database.db.select().from(whiteboardSnapshots).where(and(
      eq(whiteboardSnapshots.boardId, board.id),
      eq(whiteboardSnapshots.workspaceId, board.workspaceId),
      eq(whiteboardSnapshots.revision, board.currentRevision),
    )).limit(1);
    return { id: board.id, revision: board.currentRevision, data: snapshot?.data ?? null };
  }

  async saveState(tenant: TenantContext, boardId: string, input: SaveWhiteboardStateDto): Promise<WhiteboardSaveResult> {
    this.assertStateSize(input.data);
    return this.database.transaction(async () => {
      const board = await this.lockBoard(tenant, boardId);
      if (board.status === 'archived') throw new ConflictException('Archived whiteboard cannot be modified');
      if (input.expectedRevision !== board.currentRevision) {
        throw new ConflictException(
          `Whiteboard revision conflict: expected revision ${input.expectedRevision}, current revision is ${board.currentRevision}`,
        );
      }
      const nextRevision = board.currentRevision + 1;
      const [snapshot] = await this.database.db.insert(whiteboardSnapshots).values({
        boardId: board.id,
        workspaceId: board.workspaceId,
        revision: nextRevision,
        data: input.data,
      }).returning();
      if (!snapshot) throw new Error('Whiteboard snapshot creation failed');
      const [updated] = await this.database.db.update(whiteboards)
        .set({ currentRevision: nextRevision, updatedAt: new Date() })
        .where(and(eq(whiteboards.id, board.id), eq(whiteboards.workspaceId, tenant.workspaceId)))
        .returning();
      if (!updated) throw new Error('Whiteboard revision update failed');
      await this.audit.record(null, 'whiteboard_state_saved', 'whiteboard', updated.id, { revision: nextRevision }, tenant.workspaceId);
      return { revision: updated.currentRevision };
    });
  }

  async listResources(tenant: TenantContext, boardId: string): Promise<WhiteboardResourceView[]> {
    await this.requireBoard(tenant, boardId);
    const links = await this.database.db.select().from(whiteboardResources).where(and(
      eq(whiteboardResources.boardId, boardId),
      eq(whiteboardResources.workspaceId, tenant.workspaceId),
    )).orderBy(asc(whiteboardResources.createdAt), asc(whiteboardResources.id));
    return links.map((link) => this.toResourceView(link));
  }

  async attachResource(tenant: TenantContext, boardId: string, input: AttachWhiteboardResourceDto): Promise<WhiteboardResourceView> {
    return this.database.transaction(async () => {
      const board = await this.lockBoard(tenant, boardId);
      if (board.status === 'archived') throw new ConflictException('Archived whiteboard cannot be modified');
      if (input.type === 'task') {
        await this.education.getPublishedTaskVersion(input.resourceId, tenant);
      } else {
        await this.assertPublishedTheory(tenant, input.resourceId);
      }
      const existing = await this.findResourceLink(board.id, tenant.workspaceId, input.type, input.resourceId);
      if (existing) return this.toResourceView(existing);
      const [link] = await this.database.db.insert(whiteboardResources).values({
        boardId: board.id,
        workspaceId: tenant.workspaceId,
        resourceType: input.type,
        taskVersionId: input.type === 'task' ? input.resourceId : null,
        theoryVersionId: input.type === 'theory' ? input.resourceId : null,
      }).returning();
      if (!link) throw new Error('Whiteboard resource link creation failed');
      await this.audit.record(null, 'whiteboard_resource_attached', 'whiteboard', board.id, {
        type: input.type, resourceId: input.resourceId,
      }, tenant.workspaceId);
      return this.toResourceView(link);
    });
  }

  async detachResource(tenant: TenantContext, boardId: string, resourceLinkId: string): Promise<void> {
    await this.database.transaction(async () => {
      const board = await this.lockBoard(tenant, boardId);
      if (board.status === 'archived') throw new ConflictException('Archived whiteboard cannot be modified');
      const [link] = await this.database.db.select().from(whiteboardResources).where(and(
        eq(whiteboardResources.id, resourceLinkId),
        eq(whiteboardResources.boardId, board.id),
        eq(whiteboardResources.workspaceId, tenant.workspaceId),
      )).limit(1);
      if (!link) throw new NotFoundException('Whiteboard resource link not found');
      await this.database.db.delete(whiteboardResources).where(and(
        eq(whiteboardResources.id, link.id),
        eq(whiteboardResources.workspaceId, tenant.workspaceId),
      ));
      const view = this.toResourceView(link);
      await this.audit.record(null, 'whiteboard_resource_detached', 'whiteboard', board.id, {
        type: view.type, resourceId: view.resourceId,
      }, tenant.workspaceId);
    });
  }

  private async lockBoard(tenant: TenantContext, boardId: string) {
    const [board] = await this.database.db.select().from(whiteboards).where(and(
      eq(whiteboards.id, boardId),
      eq(whiteboards.organizationId, tenant.organizationId),
      eq(whiteboards.workspaceId, tenant.workspaceId),
      eq(whiteboards.integrationId, tenant.integrationId),
    )).for('update', { of: whiteboards }).limit(1);
    if (!board) throw new NotFoundException('Whiteboard not found');
    return board;
  }

  private async findResourceLink(boardId: string, workspaceId: string, type: 'task' | 'theory', resourceId: string) {
    const conditions: SQL[] = [
      eq(whiteboardResources.boardId, boardId),
      eq(whiteboardResources.workspaceId, workspaceId),
      type === 'task'
        ? eq(whiteboardResources.taskVersionId, resourceId)
        : eq(whiteboardResources.theoryVersionId, resourceId),
    ];
    const [link] = await this.database.db.select().from(whiteboardResources)
      .where(and(...conditions)).limit(1);
    return link;
  }

  private async assertPublishedTheory(tenant: TenantContext, versionId: string) {
    const [version] = await this.database.db.select({ id: theoryVersions.id }).from(theoryVersions).where(and(
      eq(theoryVersions.id, versionId),
      eq(theoryVersions.workspaceId, tenant.workspaceId),
      eq(theoryVersions.status, 'published'),
    )).limit(1);
    if (!version) throw new NotFoundException('Published theory version not found');
  }

  private toResourceView(link: typeof whiteboardResources.$inferSelect): WhiteboardResourceView {
    return {
      id: link.id,
      type: link.resourceType as WhiteboardResourceView['type'],
      resourceId: link.resourceType === 'task' ? link.taskVersionId! : link.theoryVersionId!,
    };
  }

  private async requireBoard(tenant: TenantContext, boardId: string) {
    const [board] = await this.database.db.select().from(whiteboards).where(and(
      eq(whiteboards.id, boardId),
      eq(whiteboards.organizationId, tenant.organizationId),
      eq(whiteboards.workspaceId, tenant.workspaceId),
      eq(whiteboards.integrationId, tenant.integrationId),
    )).limit(1);
    if (!board) throw new NotFoundException('Whiteboard not found');
    return board;
  }

  private assertStateSize(data: Record<string, unknown>): void {
    const bytes = Buffer.byteLength(JSON.stringify(data), 'utf8');
    if (bytes > WHITEBOARD_MAX_DATA_BYTES) {
      throw new PayloadTooLargeException(`Whiteboard state exceeds the ${WHITEBOARD_MAX_DATA_BYTES} byte payload limit`);
    }
  }

  private toView(board: typeof whiteboards.$inferSelect): WhiteboardView {
    return {
      id: board.id,
      title: board.title,
      externalReference: board.externalReference,
      status: board.status as WhiteboardStatus,
      currentRevision: board.currentRevision,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
    };
  }
}
