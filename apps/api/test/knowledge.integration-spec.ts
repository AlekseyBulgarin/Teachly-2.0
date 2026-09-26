import { and, eq } from 'drizzle-orm';
import { DatabaseService } from '../src/infrastructure/database/database';
import { fixtureIds } from '../src/infrastructure/database/seed';
import {
  auditEvents,
  knowledgeChunks,
  knowledgeDocumentVersions,
  knowledgeDocuments,
  knowledgeRawImports,
  knowledgeSources,
} from '../src/infrastructure/database/schema';
import { AuditService } from '../src/modules/audit/audit.service';
import { IntegrationsService } from '../src/modules/integrations/integrations.service';
import { KnowledgeService } from '../src/modules/knowledge/knowledge.service';
import { TenancyService } from '../src/modules/tenancy/tenancy.service';
import { resetTestDatabase, testDatabase } from './postgres-test';

jest.setTimeout(180_000);

describe('Approved knowledge foundation (PostgreSQL)', () => {
  let database: DatabaseService;
  let knowledge: KnowledgeService;
  let tenancy: TenancyService;
  let integrations: IntegrationsService;

  beforeEach(async () => {
    database = testDatabase();
    await resetTestDatabase(database);
    const audit = new AuditService(database);
    tenancy = new TenancyService(database);
    integrations = new IntegrationsService(database, tenancy, audit);
    knowledge = new KnowledgeService(database, integrations, audit);
  });

  afterEach(async () => { await database?.onModuleDestroy(); });

  async function tenantFixture(name: string) {
    const organization = await tenancy.createOrganization(name);
    const workspace = await tenancy.createWorkspace(organization.id, `${name} workspace`);
    const integration = await integrations.createIntegration(organization.id, workspace.id, `${name} integration`);
    const key = await integrations.createApiKey({
      organizationId: organization.id,
      workspaceId: workspace.id,
      integrationId: integration.id,
      name: `${name} key`,
      scopes: ['external_users:read', 'external_users:write'],
    });
    const context = await integrations.authenticateApiKey(key.secret);
    if (!context) throw new Error('Tenant fixture API key did not authenticate');
    await tenancy.createMembership({
      userId: fixtureIds.teacher,
      organizationId: organization.id,
      workspaceId: workspace.id,
      role: 'educator',
    });
    return { organization, workspace, context };
  }

  async function knowledgeFixture(name = 'Organization A') {
    const tenant = await tenantFixture(name);
    const source = await knowledge.createSource(tenant.context, {
      name: `${name} curriculum`,
      sourceType: 'manual',
      externalReference: `https://example.test/${name.toLowerCase().replace(/\s+/g, '-')}`,
    });
    const document = await knowledge.createDocument(tenant.context, {
      sourceId: source.id,
      documentKey: 'algebra-intro',
      title: 'Algebra introduction',
    });
    return { ...tenant, source, document };
  }

  function importInput(documentId: string, idempotencyKey: string, suffix = '') {
    return {
      documentId,
      idempotencyKey,
      rawContent: `<article>Raw source ${suffix}</article>`,
      normalizedContent: `Normalized educational content ${suffix}`,
      sourceReference: `source-section-${suffix || 'one'}`,
      chunks: [
        { section: 'Introduction', content: `First approved excerpt ${suffix}` },
        { section: 'Example', content: `Second approved excerpt ${suffix}` },
        { section: 'Review', content: `Third approved excerpt ${suffix}` },
      ],
    } as const;
  }

  it('keeps sources, documents, versions, and retrieval workspace-scoped', async () => {
    const tenantA = await knowledgeFixture();
    const tenantB = await tenantFixture('Organization B');

    await expect(knowledge.createDocument(tenantB.context, {
      sourceId: tenantA.source.id,
      documentKey: 'foreign-document',
      title: 'Foreign document',
    })).rejects.toThrow('Knowledge source not found');

    const version = await knowledge.importVersion(tenantA.context, importInput(tenantA.document.id, 'scope-1'));
    await expect(database.db.insert(knowledgeDocumentVersions).values({
      workspaceId: tenantB.workspace.id,
      documentId: tenantA.document.id,
      rawImportId: version.rawImportId,
      version: 1,
      normalizedContent: 'cross-tenant version',
      contentChecksum: 'cross-tenant',
      licenseStatus: 'unknown',
    })).rejects.toThrow();
    await expect(database.db.insert(knowledgeChunks).values({
      workspaceId: tenantB.workspace.id,
      documentId: tenantA.document.id,
      documentVersionId: version.id,
      ordinal: 0,
      content: 'cross-tenant chunk',
      contentChecksum: 'cross-tenant',
    })).rejects.toThrow();

    expect(await knowledge.retrieve({ context: tenantB.context })).toEqual([]);
  });

  it('never retrieves draft, rejected, disabled, or superseded knowledge', async () => {
    const tenant = await knowledgeFixture();
    const draft = await knowledge.importVersion(tenant.context, importInput(tenant.document.id, 'draft-1', 'draft'));
    expect(await knowledge.retrieve({ context: tenant.context })).toEqual([]);

    await knowledge.rejectVersion(tenant.context, draft.id, 'Needs source correction');
    const rejected = await knowledge.importVersion(tenant.context, importInput(tenant.document.id, 'rejected-1', 'rejected'));
    await knowledge.disableVersion(tenant.context, rejected.id, 'Disabled for review');
    const approved = await knowledge.importVersion(tenant.context, importInput(tenant.document.id, 'approved-1', 'approved'));
    await knowledge.approveVersion(tenant.context, approved.id, { approvalNote: 'Reviewed by curriculum owner' });

    const replacement = await knowledge.importVersion(tenant.context, importInput(tenant.document.id, 'replacement-1', 'replacement'));
    await knowledge.approveVersion(tenant.context, replacement.id);

    const excerpts = await knowledge.retrieve({ context: tenant.context });
    expect(excerpts).toHaveLength(3);
    expect(new Set(excerpts.map((excerpt) => excerpt.documentVersionId))).toEqual(new Set([replacement.id]));
    expect(excerpts.map((excerpt) => excerpt.content)).toEqual([
      'First approved excerpt replacement',
      'Second approved excerpt replacement',
      'Third approved excerpt replacement',
    ]);
  });

  it('preserves exact approved version identity, provenance, and explicit UNKNOWN licensing', async () => {
    const tenant = await knowledgeFixture();
    const version = await knowledge.importVersion(tenant.context, importInput(tenant.document.id, 'trace-1'));

    const beforeApproval = await knowledge.retrieve({ context: tenant.context });
    expect(beforeApproval).toEqual([]);

    const approved = await knowledge.approveVersion(tenant.context, version.id);
    expect(approved.status).toBe('approved');
    expect(approved.approvedAt).toBeInstanceOf(Date);
    expect(approved.approvedByPrincipal).toBe(`api_key:${tenant.context.principal.apiKeyId}`);
    expect(approved.licenseStatus).toBe('unknown');

    const excerpts = await knowledge.retrieve({ context: tenant.context, limit: 2 });
    expect(excerpts).toHaveLength(2);
    expect(excerpts.map((excerpt) => excerpt.ordinal)).toEqual([0, 1]);
    expect(excerpts.every((excerpt) => excerpt.documentVersionId === version.id)).toBe(true);
    expect(excerpts[0]).toMatchObject({
      documentId: tenant.document.id,
      licenseStatus: 'unknown',
      source: {
        id: tenant.source.id,
        type: 'manual',
        externalReference: 'https://example.test/organization-a',
      },
      provenance: {
        sourceReference: 'source-section-one',
      },
      approval: {
        approvedByPrincipal: `api_key:${tenant.context.principal.apiKeyId}`,
        note: null,
      },
    });
    expect(excerpts[0]!.provenance.rawContentChecksum).toHaveLength(64);
    expect(excerpts[0]!.provenance.normalizedContentChecksum).toHaveLength(64);
    expect(excerpts[0]!.provenance.chunkContentChecksum).toHaveLength(64);
  });

  it('makes repeated imports idempotent and retrieval ordering bounded', async () => {
    const tenant = await knowledgeFixture();
    const input = importInput(tenant.document.id, 'repeat-1');
    const first = await knowledge.importVersion(tenant.context, input);
    const replay = await knowledge.importVersion(tenant.context, input);

    expect(replay.id).toBe(first.id);
    expect(await database.db.select().from(knowledgeRawImports)
      .where(and(eq(knowledgeRawImports.workspaceId, tenant.workspace.id), eq(knowledgeRawImports.idempotencyKey, 'repeat-1')))).toHaveLength(1);

    await knowledge.approveVersion(tenant.context, first.id);
    const excerpts = await knowledge.retrieve({ context: tenant.context, limit: 2 });
    expect(excerpts).toHaveLength(2);
    expect(excerpts.map((excerpt) => excerpt.ordinal)).toEqual([0, 1]);
  });

  it('attributes knowledge lifecycle actions to the correct workspace in audit records', async () => {
    const tenant = await knowledgeFixture();
    const version = await knowledge.importVersion(tenant.context, importInput(tenant.document.id, 'audit-1'));
    await knowledge.approveVersion(tenant.context, version.id);
    await knowledge.disableVersion(tenant.context, version.id, 'Retired source');

    const events = await database.db.select().from(auditEvents).where(and(
      eq(auditEvents.workspaceId, tenant.workspace.id),
      eq(auditEvents.resourceType, 'knowledge_document_version'),
    ));
    expect(events.map((event) => event.action)).toEqual([
      'knowledge_version_created',
      'knowledge_version_approved',
      'knowledge_version_disabled',
    ]);
    expect(events.every((event) => event.workspaceId === tenant.workspace.id)).toBe(true);
    expect(events[1]!.metadata).toMatchObject({
      workspaceId: tenant.workspace.id,
      apiKeyId: tenant.context.principal.apiKeyId,
    });
  });

  it('rejects invalid tenant lineage at the database boundary', async () => {
    const tenantA = await knowledgeFixture();
    const tenantB = await tenantFixture('Organization B');
    const version = await knowledge.importVersion(tenantA.context, importInput(tenantA.document.id, 'lineage-1'));

    await expect(database.db.insert(knowledgeDocuments).values({
      workspaceId: tenantB.workspace.id,
      sourceId: tenantA.source.id,
      documentKey: 'invalid-lineage',
      title: 'Invalid lineage',
    })).rejects.toThrow();
    await expect(database.db.insert(knowledgeRawImports).values({
      workspaceId: tenantB.workspace.id,
      documentId: tenantA.document.id,
      idempotencyKey: 'invalid-lineage',
      rawContent: 'raw',
      contentChecksum: 'raw',
    })).rejects.toThrow();
    await expect(database.db.select().from(knowledgeDocumentVersions).where(eq(knowledgeDocumentVersions.id, version.id))).resolves.toHaveLength(1);
  });

  it('rejects mixed document lineage inside one workspace at the database boundary', async () => {
    const tenant = await knowledgeFixture();
    const secondDocument = await knowledge.createDocument(tenant.context, {
      sourceId: tenant.source.id,
      documentKey: 'algebra-second',
      title: 'Second algebra document',
    });
    const version = await knowledge.importVersion(tenant.context, importInput(tenant.document.id, 'mixed-lineage-1'));

    await expect(database.db.insert(knowledgeDocumentVersions).values({
      workspaceId: tenant.workspace.id,
      documentId: secondDocument.id,
      rawImportId: version.rawImportId,
      version: 1,
      normalizedContent: 'mixed document version',
      contentChecksum: 'mixed-document-version',
      licenseStatus: 'unknown',
    })).rejects.toThrow();
    await expect(database.db.insert(knowledgeChunks).values({
      workspaceId: tenant.workspace.id,
      documentId: secondDocument.id,
      documentVersionId: version.id,
      ordinal: 10,
      content: 'mixed document chunk',
      contentChecksum: 'mixed-document-chunk',
    })).rejects.toThrow();
  });

  it('allows only one concurrent approval and never resurrects a disabled or rejected version', async () => {
    const tenant = await knowledgeFixture();
    const first = await knowledge.importVersion(tenant.context, importInput(tenant.document.id, 'concurrent-1', 'first'));
    const second = await knowledge.importVersion(tenant.context, importInput(tenant.document.id, 'concurrent-2', 'second'));
    const approvalResults = await Promise.allSettled([
      knowledge.approveVersion(tenant.context, first.id),
      knowledge.approveVersion(tenant.context, second.id),
    ]);
    expect(approvalResults.filter((result) => result.status === 'fulfilled').length).toBeGreaterThanOrEqual(1);

    const approved = await knowledge.retrieve({ context: tenant.context });
    expect(new Set(approved.map((excerpt) => excerpt.documentVersionId)).size).toBe(1);

    const raced = await knowledge.importVersion(tenant.context, importInput(tenant.document.id, 'concurrent-3', 'raced'));
    const transitionResults = await Promise.allSettled([
      knowledge.approveVersion(tenant.context, raced.id),
      knowledge.disableVersion(tenant.context, raced.id, 'Disabled during approval'),
    ]);
    expect(transitionResults.filter((result) => result.status === 'fulfilled').length).toBeGreaterThanOrEqual(1);
    const [racedRow] = await database.db.select().from(knowledgeDocumentVersions)
      .where(eq(knowledgeDocumentVersions.id, raced.id));
    if (transitionResults[1]?.status === 'fulfilled') expect(racedRow!.status).toBe('disabled');
    else expect(racedRow!.status).toBe('approved');

    const rejected = await knowledge.importVersion(tenant.context, importInput(tenant.document.id, 'concurrent-4', 'rejected'));
    const rejectionResults = await Promise.allSettled([
      knowledge.approveVersion(tenant.context, rejected.id),
      knowledge.rejectVersion(tenant.context, rejected.id, 'Rejected during approval'),
    ]);
    expect(rejectionResults.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    const [rejectedRow] = await database.db.select().from(knowledgeDocumentVersions)
      .where(eq(knowledgeDocumentVersions.id, rejected.id));
    if (rejectionResults[1]?.status === 'fulfilled') expect(rejectedRow!.status).toBe('rejected');
    else expect(rejectedRow!.status).toBe('approved');
  });

  it('rejects direct mutation of approved snapshot content, provenance, license, and chunks', async () => {
    const tenant = await knowledgeFixture();
    const version = await knowledge.importVersion(tenant.context, importInput(tenant.document.id, 'immutable-1'));
    await knowledge.approveVersion(tenant.context, version.id);
    const [chunk] = await database.db.select().from(knowledgeChunks)
      .where(eq(knowledgeChunks.documentVersionId, version.id));
    const [rawImport] = await database.db.select().from(knowledgeRawImports)
      .where(eq(knowledgeRawImports.id, version.rawImportId));

    await expect(database.db.update(knowledgeDocumentVersions).set({
      normalizedContent: 'mutated normalized content',
    }).where(eq(knowledgeDocumentVersions.id, version.id))).rejects.toThrow();
    await expect(database.db.update(knowledgeDocumentVersions).set({
      licenseStatus: 'restricted',
    }).where(eq(knowledgeDocumentVersions.id, version.id))).rejects.toThrow();
    await expect(database.db.update(knowledgeChunks).set({
      content: 'mutated chunk',
    }).where(eq(knowledgeChunks.id, chunk!.id))).rejects.toThrow();
    await expect(database.db.insert(knowledgeChunks).values({
      workspaceId: tenant.workspace.id,
      documentId: tenant.document.id,
      documentVersionId: version.id,
      ordinal: 99,
      content: 'late chunk',
      contentChecksum: 'late-chunk',
    })).rejects.toThrow();
    await expect(database.db.delete(knowledgeChunks)
      .where(eq(knowledgeChunks.id, chunk!.id))).rejects.toThrow();
    await expect(database.db.update(knowledgeRawImports).set({
      rawContent: 'mutated raw content',
    }).where(eq(knowledgeRawImports.id, rawImport!.id))).rejects.toThrow();
    await expect(database.db.update(knowledgeSources).set({
      licenseStatus: 'allowed',
    }).where(eq(knowledgeSources.id, tenant.source.id))).rejects.toThrow();
    await knowledge.disableVersion(tenant.context, version.id, 'Historical snapshot remains immutable');
    await expect(database.db.update(knowledgeDocumentVersions).set({
      normalizedContent: 'mutated after disable',
    }).where(eq(knowledgeDocumentVersions.id, version.id))).rejects.toThrow();
  });

  it('blocks inactive sources and documents from retrieval', async () => {
    const sourceTenant = await knowledgeFixture('Organization Source Disabled');
    const sourceVersion = await knowledge.importVersion(sourceTenant.context, importInput(sourceTenant.document.id, 'inactive-source-1'));
    await knowledge.approveVersion(sourceTenant.context, sourceVersion.id);
    await knowledge.disableSource(sourceTenant.context, sourceTenant.source.id);
    expect(await knowledge.retrieve({ context: sourceTenant.context })).toEqual([]);

    const documentTenant = await knowledgeFixture('Organization Document Disabled');
    const documentVersion = await knowledge.importVersion(documentTenant.context, importInput(documentTenant.document.id, 'inactive-document-1'));
    await knowledge.approveVersion(documentTenant.context, documentVersion.id);
    await knowledge.disableDocument(documentTenant.context, documentTenant.document.id);
    expect(await knowledge.retrieve({ context: documentTenant.context })).toEqual([]);
  });

  it('requires explicit allowed license and external AI permission for external retrieval', async () => {
    const tenant = await knowledgeFixture();
    const unknown = await knowledge.importVersion(tenant.context, importInput(tenant.document.id, 'external-unknown-1'));
    await knowledge.approveVersion(tenant.context, unknown.id);
    expect(await knowledge.retrieveForExternalAi({ context: tenant.context })).toEqual([]);
    await knowledge.setExternalAiPermission(tenant.context, unknown.id, { permission: 'allowed' });
    expect(await knowledge.retrieveForExternalAi({ context: tenant.context })).toEqual([]);

    const allowed = await knowledge.importVersion(tenant.context, {
      ...importInput(tenant.document.id, 'external-allowed-1', 'allowed'),
      licenseStatus: 'allowed',
    });
    await knowledge.approveVersion(tenant.context, allowed.id);
    expect(await knowledge.retrieveForExternalAi({ context: tenant.context })).toEqual([]);
    await knowledge.setExternalAiPermission(tenant.context, allowed.id, { permission: 'allowed' });
    expect(await knowledge.retrieveForExternalAi({ context: tenant.context })).toHaveLength(3);
    await knowledge.setExternalAiPermission(tenant.context, allowed.id, { permission: 'prohibited', note: 'Provider restriction' });
    expect(await knowledge.retrieveForExternalAi({ context: tenant.context })).toEqual([]);
    const permissionEvents = await database.db.select().from(auditEvents).where(and(
      eq(auditEvents.workspaceId, tenant.workspace.id),
      eq(auditEvents.action, 'knowledge_external_ai_permission_changed'),
    ));
    expect(permissionEvents).toHaveLength(3);
    expect(permissionEvents[2]!.metadata).toMatchObject({
      externalAiPermission: 'prohibited',
      apiKeyId: tenant.context.principal.apiKeyId,
    });
  });

  it('rejects idempotency collisions and keeps the key scoped to document and workspace', async () => {
    const tenant = await knowledgeFixture();
    const secondDocument = await knowledge.createDocument(tenant.context, {
      sourceId: tenant.source.id,
      documentKey: 'idempotency-second',
      title: 'Idempotency second document',
    });
    const firstInput = importInput(tenant.document.id, 'collision-1', 'first');
    const first = await knowledge.importVersion(tenant.context, firstInput);
    await expect(knowledge.importVersion(tenant.context, {
      ...firstInput,
      normalizedContent: 'changed payload',
    })).rejects.toThrow('idempotency key was reused');

    const otherDocumentVersion = await knowledge.importVersion(tenant.context, {
      ...importInput(secondDocument.id, 'collision-1', 'other-document'),
    });
    expect(otherDocumentVersion.id).not.toBe(first.id);

    const otherTenant = await knowledgeFixture('Organization Other Tenant');
    const otherTenantVersion = await knowledge.importVersion(otherTenant.context, {
      ...importInput(otherTenant.document.id, 'collision-1', 'other-tenant'),
    });
    expect(otherTenantVersion.id).not.toBe(first.id);
  });

  it('rolls back lifecycle mutations when the required audit write fails', async () => {
    const tenant = await tenantFixture('Organization Audit Rollback');
    const failingAudit = {
      recordIn: async () => { throw new Error('audit unavailable'); },
    } as unknown as AuditService;
    const service = new KnowledgeService(database, integrations, failingAudit);

    await expect(service.createSource(tenant.context, {
      name: 'Rolled back source',
      sourceType: 'manual',
    })).rejects.toThrow('audit unavailable');
    expect(await database.db.select().from(knowledgeSources)
      .where(eq(knowledgeSources.name, 'Rolled back source'))).toHaveLength(0);

    const fixture = await knowledgeFixture('Organization Audit Version Rollback');
    const version = await knowledge.importVersion(fixture.context, importInput(fixture.document.id, 'audit-rollback-1'));
    await expect(service.disableVersion(fixture.context, version.id, 'Should roll back'))
      .rejects.toThrow('audit unavailable');
    const [stored] = await database.db.select().from(knowledgeDocumentVersions)
      .where(eq(knowledgeDocumentVersions.id, version.id));
    expect(stored!.status).toBe('draft');
  });
});
