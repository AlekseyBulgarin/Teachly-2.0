import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { and, asc, desc, eq } from 'drizzle-orm';
import { DatabaseService, type DatabaseTransaction } from '../../infrastructure/database/database';
import {
  knowledgeChunks,
  knowledgeDocuments,
  knowledgeDocumentVersions,
  knowledgeRawImports,
  knowledgeSources,
} from '../../infrastructure/database/schema';
import type { KnowledgeDocumentVersion, KnowledgeRawImport } from '../../infrastructure/database/schema';
import { AuditService } from '../audit/audit.service';
import { IntegrationsService } from '../integrations/integrations.service';
import type {
  KnowledgeApprovalInput,
  KnowledgeDocumentInput,
  KnowledgeExternalAiPermissionInput,
  KnowledgeLicenseStatus,
  KnowledgeRetrievalInput,
  KnowledgeRetrievalPort,
  KnowledgeSourceInput,
  KnowledgeVersionImportInput,
  RetrievedKnowledgeExcerpt,
} from './knowledge.types';
import type { TenantContext } from '../integrations/integrations.types';

@Injectable()
export class KnowledgeService implements KnowledgeRetrievalPort {
  constructor(
    private readonly database: DatabaseService,
    private readonly integrations: IntegrationsService,
    private readonly audit: AuditService,
  ) {}

  async createSource(context: TenantContext, input: KnowledgeSourceInput) {
    await this.requireContext(context);
    return this.database.db.transaction(async (tx) => {
      const [source] = await tx.insert(knowledgeSources).values({
        workspaceId: context.workspaceId,
        name: input.name,
        sourceType: input.sourceType,
        externalReference: input.externalReference,
        licenseStatus: input.licenseStatus ?? 'unknown',
      }).returning();
      if (!source) throw new Error('Knowledge source creation failed');
      await this.audit.recordIn(tx, null, 'knowledge_source_created', 'knowledge_source', source.id,
        this.auditMetadata(context, { sourceType: source.sourceType }), context.workspaceId);
      return source;
    });
  }

  async createDocument(context: TenantContext, input: KnowledgeDocumentInput) {
    await this.requireContext(context);
    return this.database.db.transaction(async (tx) => {
      const [source] = await tx.select().from(knowledgeSources).where(and(
        eq(knowledgeSources.id, input.sourceId),
        eq(knowledgeSources.workspaceId, context.workspaceId),
        eq(knowledgeSources.status, 'active'),
      )).limit(1);
      if (!source) throw new NotFoundException('Knowledge source not found');

      const [created] = await tx.insert(knowledgeDocuments).values({
        workspaceId: context.workspaceId,
        sourceId: input.sourceId,
        documentKey: input.documentKey,
        title: input.title,
      }).onConflictDoNothing({
        target: [knowledgeDocuments.workspaceId, knowledgeDocuments.sourceId, knowledgeDocuments.documentKey],
      }).returning();
      if (created) {
        await this.audit.recordIn(tx, null, 'knowledge_document_created', 'knowledge_document', created.id,
          this.auditMetadata(context, { sourceId: source.id }), context.workspaceId);
        return created;
      }

      const [existing] = await tx.select().from(knowledgeDocuments).where(and(
        eq(knowledgeDocuments.workspaceId, context.workspaceId),
        eq(knowledgeDocuments.sourceId, input.sourceId),
        eq(knowledgeDocuments.documentKey, input.documentKey),
      )).limit(1);
      if (!existing) throw new Error('Knowledge document creation failed');
      return existing;
    });
  }

  async importVersion(context: TenantContext, input: KnowledgeVersionImportInput) {
    await this.requireContext(context);
    this.validateImport(input);

    return this.database.db.transaction(async (tx) => {
      const [document] = await tx.select().from(knowledgeDocuments).where(and(
        eq(knowledgeDocuments.id, input.documentId),
        eq(knowledgeDocuments.workspaceId, context.workspaceId),
        eq(knowledgeDocuments.status, 'active'),
      )).limit(1).for('update');
      if (!document) throw new NotFoundException('Active knowledge document not found');

      const [source] = await tx.select().from(knowledgeSources).where(and(
        eq(knowledgeSources.id, document.sourceId),
        eq(knowledgeSources.workspaceId, context.workspaceId),
        eq(knowledgeSources.status, 'active'),
      )).limit(1);
      if (!source) throw new NotFoundException('Active knowledge source not found');

      const [existingRaw] = await tx.select().from(knowledgeRawImports).where(and(
        eq(knowledgeRawImports.workspaceId, context.workspaceId),
        eq(knowledgeRawImports.documentId, input.documentId),
        eq(knowledgeRawImports.idempotencyKey, input.idempotencyKey),
      )).limit(1);
      if (existingRaw) {
        const [existingVersion] = await tx.select().from(knowledgeDocumentVersions).where(and(
          eq(knowledgeDocumentVersions.workspaceId, context.workspaceId),
          eq(knowledgeDocumentVersions.rawImportId, existingRaw.id),
        )).limit(1);
        if (!existingVersion) throw new Error('Knowledge import is missing its document version');
        const existingChunks = await tx.select({
          section: knowledgeChunks.section,
          content: knowledgeChunks.content,
        }).from(knowledgeChunks).where(and(
          eq(knowledgeChunks.workspaceId, context.workspaceId),
          eq(knowledgeChunks.documentVersionId, existingVersion.id),
        )).orderBy(asc(knowledgeChunks.ordinal));
        if (!this.sameImportPayload(existingRaw, existingVersion, existingChunks, input)) {
          throw new ConflictException('Knowledge import idempotency key was reused with a different payload');
        }
        return existingVersion;
      }

      const [latestVersion] = await tx.select({ version: knowledgeDocumentVersions.version })
        .from(knowledgeDocumentVersions)
        .where(and(
          eq(knowledgeDocumentVersions.workspaceId, context.workspaceId),
          eq(knowledgeDocumentVersions.documentId, input.documentId),
        ))
        .orderBy(desc(knowledgeDocumentVersions.version))
        .limit(1);
      const versionNumber = (latestVersion?.version ?? 0) + 1;
      const rawContentChecksum = checksum(input.rawContent);
      const normalizedContentChecksum = checksum(input.normalizedContent);
      const [rawImport] = await tx.insert(knowledgeRawImports).values({
        workspaceId: context.workspaceId,
        documentId: input.documentId,
        idempotencyKey: input.idempotencyKey,
        rawContent: input.rawContent,
        contentChecksum: rawContentChecksum,
        sourceReference: input.sourceReference,
        importedByUserId: input.importedByUserId ?? null,
      }).returning();
      if (!rawImport) throw new Error('Knowledge raw import creation failed');

      const [version] = await tx.insert(knowledgeDocumentVersions).values({
        workspaceId: context.workspaceId,
        documentId: input.documentId,
        rawImportId: rawImport.id,
        version: versionNumber,
        normalizedContent: input.normalizedContent,
        contentChecksum: normalizedContentChecksum,
        licenseStatus: input.licenseStatus ?? source.licenseStatus,
      }).returning();
      if (!version) throw new Error('Knowledge document version creation failed');

      await tx.insert(knowledgeChunks).values(input.chunks.map((chunk, ordinal) => ({
        workspaceId: context.workspaceId,
        documentId: input.documentId,
        documentVersionId: version.id,
        ordinal,
        section: chunk.section,
        content: chunk.content,
        contentChecksum: checksum(chunk.content),
      })));
      await this.audit.recordIn(tx, null, 'knowledge_version_created', 'knowledge_document_version', version.id,
        this.auditMetadata(context, {
          documentId: input.documentId,
          rawImportId: rawImport.id,
          version: version.version,
          licenseStatus: version.licenseStatus,
        }), context.workspaceId);
      return version;
    });
  }

  async approveVersion(context: TenantContext, versionId: string, input: KnowledgeApprovalInput = {}) {
    await this.requireContext(context);
    return this.database.db.transaction(async (tx) => {
      const target = await this.findVersionForUpdate(tx, context, versionId);
      if (!target) throw new NotFoundException('Knowledge document version not found');
      if (target.status !== 'draft') throw new ConflictException('Only draft knowledge versions can be approved');

      const principal = `api_key:${context.principal.apiKeyId}`;
      await tx.update(knowledgeDocumentVersions).set({ status: 'superseded' }).where(and(
        eq(knowledgeDocumentVersions.workspaceId, context.workspaceId),
        eq(knowledgeDocumentVersions.documentId, target.documentId),
        eq(knowledgeDocumentVersions.status, 'approved'),
      ));
      const [approved] = await tx.update(knowledgeDocumentVersions).set({
        status: 'approved',
        approvedByUserId: null,
        approvedByPrincipal: principal,
        approvedAt: new Date(),
        approvalNote: input.approvalNote,
      }).where(and(
        eq(knowledgeDocumentVersions.id, versionId),
        eq(knowledgeDocumentVersions.workspaceId, context.workspaceId),
        eq(knowledgeDocumentVersions.status, 'draft'),
      )).returning();
      if (!approved) throw new Error('Knowledge approval failed');
      await this.audit.recordIn(tx, null, 'knowledge_version_approved', 'knowledge_document_version', versionId,
        this.auditMetadata(context, { documentId: target.documentId, version: target.version, approvalPrincipal: principal }), context.workspaceId);
      return approved;
    });
  }

  async setExternalAiPermission(
    context: TenantContext,
    versionId: string,
    input: KnowledgeExternalAiPermissionInput,
  ) {
    await this.requireContext(context);
    return this.database.db.transaction(async (tx) => {
      const target = await this.findVersionForUpdate(tx, context, versionId);
      if (!target) throw new NotFoundException('Knowledge document version not found');
      const [updated] = await tx.update(knowledgeDocumentVersions).set({
        externalAiPermission: input.permission,
      }).where(and(
        eq(knowledgeDocumentVersions.id, versionId),
        eq(knowledgeDocumentVersions.workspaceId, context.workspaceId),
      )).returning();
      if (!updated) throw new Error('Knowledge external AI permission update failed');
      await this.audit.recordIn(tx, null, 'knowledge_external_ai_permission_changed', 'knowledge_document_version', versionId,
        this.auditMetadata(context, {
          documentId: target.documentId,
          version: target.version,
          externalAiPermission: input.permission,
          note: input.note,
        }), context.workspaceId);
      return updated;
    });
  }

  async rejectVersion(context: TenantContext, versionId: string, note?: string) {
    return this.changeVersionStatus(context, versionId, 'rejected', 'knowledge_version_rejected', note);
  }

  async disableVersion(context: TenantContext, versionId: string, note?: string) {
    return this.changeVersionStatus(context, versionId, 'disabled', 'knowledge_version_disabled', note);
  }

  async disableDocument(context: TenantContext, documentId: string) {
    await this.requireContext(context);
    return this.database.db.transaction(async (tx) => {
      const [document] = await tx.update(knowledgeDocuments).set({ status: 'disabled', updatedAt: new Date() })
        .where(and(eq(knowledgeDocuments.id, documentId), eq(knowledgeDocuments.workspaceId, context.workspaceId), eq(knowledgeDocuments.status, 'active')))
        .returning();
      if (!document) throw new NotFoundException('Active knowledge document not found');
      await this.audit.recordIn(tx, null, 'knowledge_document_disabled', 'knowledge_document', document.id,
        this.auditMetadata(context), context.workspaceId);
      return document;
    });
  }

  async disableSource(context: TenantContext, sourceId: string) {
    await this.requireContext(context);
    return this.database.db.transaction(async (tx) => {
      const [source] = await tx.update(knowledgeSources).set({ status: 'disabled', updatedAt: new Date() })
        .where(and(eq(knowledgeSources.id, sourceId), eq(knowledgeSources.workspaceId, context.workspaceId), eq(knowledgeSources.status, 'active')))
        .returning();
      if (!source) throw new NotFoundException('Active knowledge source not found');
      await this.audit.recordIn(tx, null, 'knowledge_source_disabled', 'knowledge_source', source.id,
        this.auditMetadata(context), context.workspaceId);
      return source;
    });
  }

  async retrieve(input: KnowledgeRetrievalInput): Promise<RetrievedKnowledgeExcerpt[]> {
    return this.retrieveApproved(input, false);
  }

  async retrieveForExternalAi(input: KnowledgeRetrievalInput): Promise<RetrievedKnowledgeExcerpt[]> {
    return this.retrieveApproved(input, true);
  }

  async listStatus(context: TenantContext) {
    await this.requireContext(context);
    return this.database.db.select({
      sourceId: knowledgeSources.id,
      sourceName: knowledgeSources.name,
      sourceType: knowledgeSources.sourceType,
      sourceStatus: knowledgeSources.status,
      sourceLicenseStatus: knowledgeSources.licenseStatus,
      documentId: knowledgeDocuments.id,
      documentTitle: knowledgeDocuments.title,
      documentStatus: knowledgeDocuments.status,
      versionId: knowledgeDocumentVersions.id,
      version: knowledgeDocumentVersions.version,
      versionStatus: knowledgeDocumentVersions.status,
      licenseStatus: knowledgeDocumentVersions.licenseStatus,
      externalAiPermission: knowledgeDocumentVersions.externalAiPermission,
      approvedAt: knowledgeDocumentVersions.approvedAt,
    }).from(knowledgeSources)
      .innerJoin(knowledgeDocuments, and(
        eq(knowledgeDocuments.sourceId, knowledgeSources.id),
        eq(knowledgeDocuments.workspaceId, context.workspaceId),
      ))
      .innerJoin(knowledgeDocumentVersions, and(
        eq(knowledgeDocumentVersions.documentId, knowledgeDocuments.id),
        eq(knowledgeDocumentVersions.workspaceId, context.workspaceId),
      ))
      .where(eq(knowledgeSources.workspaceId, context.workspaceId))
      .orderBy(desc(knowledgeDocumentVersions.createdAt));
  }

  private async retrieveApproved(input: KnowledgeRetrievalInput, externalAiOnly: boolean): Promise<RetrievedKnowledgeExcerpt[]> {
    await this.requireContext(input.context);
    const limit = Math.min(Math.max(input.limit ?? 20, 1), 100);
    const rows = await this.database.db.select({
      chunkId: knowledgeChunks.id,
      documentId: knowledgeChunks.documentId,
      documentVersionId: knowledgeChunks.documentVersionId,
      content: knowledgeChunks.content,
      section: knowledgeChunks.section,
      ordinal: knowledgeChunks.ordinal,
      sourceId: knowledgeSources.id,
      sourceName: knowledgeSources.name,
      sourceType: knowledgeSources.sourceType,
      sourceExternalReference: knowledgeSources.externalReference,
      sourceReference: knowledgeRawImports.sourceReference,
      importedAt: knowledgeRawImports.importedAt,
      rawContentChecksum: knowledgeRawImports.contentChecksum,
      normalizedContentChecksum: knowledgeDocumentVersions.contentChecksum,
      chunkContentChecksum: knowledgeChunks.contentChecksum,
      licenseStatus: knowledgeDocumentVersions.licenseStatus,
      externalAiPermission: knowledgeDocumentVersions.externalAiPermission,
      approvedAt: knowledgeDocumentVersions.approvedAt,
      approvedByUserId: knowledgeDocumentVersions.approvedByUserId,
      approvedByPrincipal: knowledgeDocumentVersions.approvedByPrincipal,
      approvalNote: knowledgeDocumentVersions.approvalNote,
    }).from(knowledgeChunks)
      .innerJoin(knowledgeDocumentVersions, and(
        eq(knowledgeDocumentVersions.id, knowledgeChunks.documentVersionId),
        eq(knowledgeDocumentVersions.workspaceId, knowledgeChunks.workspaceId),
      ))
      .innerJoin(knowledgeDocuments, and(
        eq(knowledgeDocuments.id, knowledgeChunks.documentId),
        eq(knowledgeDocuments.workspaceId, knowledgeChunks.workspaceId),
      ))
      .innerJoin(knowledgeSources, and(
        eq(knowledgeSources.id, knowledgeDocuments.sourceId),
        eq(knowledgeSources.workspaceId, knowledgeChunks.workspaceId),
      ))
      .innerJoin(knowledgeRawImports, and(
        eq(knowledgeRawImports.id, knowledgeDocumentVersions.rawImportId),
        eq(knowledgeRawImports.workspaceId, knowledgeChunks.workspaceId),
      ))
      .where(and(
        eq(knowledgeChunks.workspaceId, input.context.workspaceId),
        eq(knowledgeDocumentVersions.status, 'approved'),
        eq(knowledgeDocuments.status, 'active'),
        eq(knowledgeSources.status, 'active'),
        externalAiOnly ? eq(knowledgeDocumentVersions.externalAiPermission, 'allowed') : undefined,
        externalAiOnly ? eq(knowledgeDocumentVersions.licenseStatus, 'allowed') : undefined,
        input.documentId ? eq(knowledgeChunks.documentId, input.documentId) : undefined,
        input.sourceId ? eq(knowledgeSources.id, input.sourceId) : undefined,
      ))
      .orderBy(asc(knowledgeSources.id), asc(knowledgeDocuments.id), desc(knowledgeDocumentVersions.version), asc(knowledgeChunks.ordinal))
      .limit(limit);

    return rows.flatMap((row) => row.approvedAt && row.approvedByPrincipal ? [{
      chunkId: row.chunkId,
      documentId: row.documentId,
      documentVersionId: row.documentVersionId,
      content: row.content,
      section: row.section,
      ordinal: row.ordinal,
      source: {
        id: row.sourceId,
        name: row.sourceName,
        type: row.sourceType,
        externalReference: row.sourceExternalReference,
      },
      provenance: {
        sourceReference: row.sourceReference,
        importedAt: row.importedAt,
        rawContentChecksum: row.rawContentChecksum,
        normalizedContentChecksum: row.normalizedContentChecksum,
        chunkContentChecksum: row.chunkContentChecksum,
      },
      licenseStatus: row.licenseStatus as KnowledgeLicenseStatus,
      externalAiPermission: row.externalAiPermission,
      approval: {
        approvedAt: row.approvedAt,
        approvedByUserId: row.approvedByUserId,
        approvedByPrincipal: row.approvedByPrincipal,
        note: row.approvalNote,
      },
    }] : []);
  }

  private async changeVersionStatus(
    context: TenantContext,
    versionId: string,
    status: 'rejected' | 'disabled',
    action: string,
    note?: string,
  ) {
    await this.requireContext(context);
    return this.database.db.transaction(async (tx) => {
      const target = await this.findVersionForUpdate(tx, context, versionId);
      if (!target) throw new NotFoundException('Knowledge document version not found');
      if (status === 'rejected' && target.status !== 'draft') {
        throw new ConflictException('Only draft knowledge versions can be rejected');
      }
      const [version] = await tx.update(knowledgeDocumentVersions).set({ status, approvalNote: note })
        .where(and(
          eq(knowledgeDocumentVersions.id, versionId),
          eq(knowledgeDocumentVersions.workspaceId, context.workspaceId),
          eq(knowledgeDocumentVersions.status, target.status),
        ))
        .returning();
      if (!version) throw new ConflictException('Knowledge version changed before its lifecycle transition');
      await this.audit.recordIn(tx, null, action, 'knowledge_document_version', version.id,
        this.auditMetadata(context, { documentId: version.documentId, version: version.version, note }), context.workspaceId);
      return version;
    });
  }

  private async findVersionForUpdate(tx: DatabaseTransaction, context: TenantContext, versionId: string) {
    const [version] = await tx.select().from(knowledgeDocumentVersions).where(and(
      eq(knowledgeDocumentVersions.id, versionId),
      eq(knowledgeDocumentVersions.workspaceId, context.workspaceId),
    )).limit(1).for('update');
    return version;
  }

  private async requireContext(context: TenantContext): Promise<void> {
    await this.integrations.requireActiveTenantContext(context);
  }

  private sameImportPayload(
    rawImport: KnowledgeRawImport,
    version: KnowledgeDocumentVersion,
    chunks: Array<{ section: string | null; content: string }>,
    input: KnowledgeVersionImportInput,
  ): boolean {
    return rawImport.contentChecksum === checksum(input.rawContent)
      && rawImport.sourceReference === (input.sourceReference ?? null)
      && version.contentChecksum === checksum(input.normalizedContent)
      && version.licenseStatus === (input.licenseStatus ?? version.licenseStatus)
      && chunks.length === input.chunks.length
      && chunks.every((chunk, index) => chunk.section === (input.chunks[index]?.section ?? null)
        && chunk.content === input.chunks[index]?.content);
  }

  private validateImport(input: KnowledgeVersionImportInput): void {
    if (!input.idempotencyKey.trim()) throw new BadRequestException('Knowledge import idempotency key is required');
    if (!input.rawContent) throw new BadRequestException('Raw knowledge content is required');
    if (!input.normalizedContent) throw new BadRequestException('Normalized knowledge content is required');
    if (input.chunks.length === 0 || input.chunks.some((chunk) => !chunk.content.trim())) {
      throw new BadRequestException('At least one non-empty knowledge chunk is required');
    }
  }

  private auditMetadata(context: TenantContext, metadata: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      integrationId: context.integrationId,
      principalType: context.principal.type,
      apiKeyId: context.principal.apiKeyId,
      ...metadata,
    };
  }
}

function checksum(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}
