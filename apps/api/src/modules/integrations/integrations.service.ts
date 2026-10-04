import { Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { DatabaseService } from '../../infrastructure/database/database';
import { apiKeys, integrations, organizations, workspaces } from '../../infrastructure/database/schema';
import { AuditService } from '../audit/audit.service';
import { TenancyService } from '../tenancy/tenancy.service';
import { requireTenantContext } from '../core/core.access';
import type { TenantContext } from '../core/core.types';
import { apiKeyHashMatches, apiKeyPrefix, generateApiKey } from './api-key.crypto';
import type { ApiKeyMetadata, CreatedApiKey, IntegrationScope, IntegrationView } from './integrations.types';
import { integrationScopes } from './integrations.types';

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly tenancy: TenancyService,
    private readonly audit: AuditService,
  ) {}

  async createIntegration(organizationId: string, workspaceId: string, name: string): Promise<IntegrationView> {
    await this.tenancy.requireActiveWorkspace(organizationId, workspaceId);
    const [integration] = await this.database.db.insert(integrations)
      .values({ organizationId, workspaceId, name }).returning();
    if (!integration) throw new Error('Integration creation failed');
    return integration;
  }

  async createApiKey(input: {
    organizationId: string;
    workspaceId: string;
    integrationId: string;
    name: string;
    scopes: IntegrationScope[];
  }): Promise<CreatedApiKey> {
    this.assertScopes(input.scopes);
    await this.requireActiveIntegration(input.organizationId, input.workspaceId, input.integrationId);
    const generated = generateApiKey();
    return this.database.transaction(async () => {
      const [apiKey] = await this.database.db.insert(apiKeys).values({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        integrationId: input.integrationId,
        name: input.name,
        keyPrefix: generated.prefix,
        keyHash: generated.hash,
        scopes: input.scopes,
      }).returning();
      if (!apiKey) throw new Error('API key creation failed');
      await this.audit.record(null, 'api_key_created', 'api_key', apiKey.id, {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        integrationId: input.integrationId,
        prefix: apiKey.keyPrefix,
        scopes: input.scopes,
      }, input.workspaceId);
      return {
        id: apiKey.id,
        organizationId: apiKey.organizationId,
        workspaceId: apiKey.workspaceId,
        integrationId: apiKey.integrationId,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        scopes: apiKey.scopes as IntegrationScope[],
        status: 'active',
        createdAt: apiKey.createdAt,
        secret: generated.secret,
      };
    });
  }

  async listApiKeys(context: TenantContext, limit = 50): Promise<ApiKeyMetadata[]> {
    await this.requireActiveTenantContext(context);
    const rows = await this.database.db.select().from(apiKeys).where(and(
      eq(apiKeys.organizationId, context.organizationId),
      eq(apiKeys.workspaceId, context.workspaceId),
      eq(apiKeys.integrationId, context.integrationId),
    )).orderBy(desc(apiKeys.createdAt), desc(apiKeys.id)).limit(Math.min(Math.max(limit, 1), 100));
    return rows.map((row) => this.toApiKeyMetadata(row));
  }

  toApiKeyMetadata(row: {
    id: string;
    organizationId: string;
    workspaceId: string;
    integrationId: string;
    name: string;
    keyPrefix: string;
    scopes: string[];
    status: 'active' | 'revoked';
    createdAt: Date;
    lastUsedAt: Date | null;
    revokedAt: Date | null;
  }): ApiKeyMetadata {
    return {
      id: row.id,
      organizationId: row.organizationId,
      workspaceId: row.workspaceId,
      integrationId: row.integrationId,
      name: row.name,
      keyPrefix: row.keyPrefix,
      scopes: row.scopes as IntegrationScope[],
      status: row.status,
      createdAt: row.createdAt,
      lastUsedAt: row.lastUsedAt,
      revokedAt: row.revokedAt,
    };
  }

  async authenticateApiKey(secret: string): Promise<TenantContext | null> {
    const prefix = apiKeyPrefix(secret);
    if (!prefix) return null;
    const [row] = await this.database.db.select({
      apiKey: apiKeys,
      integrationStatus: integrations.status,
      workspaceStatus: workspaces.status,
      organizationStatus: organizations.status,
    }).from(apiKeys)
      .innerJoin(integrations, and(
        eq(integrations.id, apiKeys.integrationId),
        eq(integrations.workspaceId, apiKeys.workspaceId),
        eq(integrations.organizationId, apiKeys.organizationId),
      ))
      .innerJoin(workspaces, and(
        eq(workspaces.id, apiKeys.workspaceId),
        eq(workspaces.organizationId, apiKeys.organizationId),
      ))
      .innerJoin(organizations, eq(organizations.id, apiKeys.organizationId))
      .where(eq(apiKeys.keyPrefix, prefix)).limit(1);
    if (!row || row.apiKey.status !== 'active' || row.apiKey.revokedAt ||
      row.integrationStatus !== 'active' || row.workspaceStatus !== 'active' || row.organizationStatus !== 'active' ||
      !apiKeyHashMatches(secret, row.apiKey.keyHash)) return null;

    const [used] = await this.database.db.update(apiKeys).set({ lastUsedAt: new Date() })
      .where(and(eq(apiKeys.id, row.apiKey.id), eq(apiKeys.status, 'active'))).returning({ id: apiKeys.id });
    if (!used) return null;
    return {
      principal: { type: 'api_key', apiKeyId: row.apiKey.id },
      organizationId: row.apiKey.organizationId,
      workspaceId: row.apiKey.workspaceId,
      integrationId: row.apiKey.integrationId,
      scopes: row.apiKey.scopes as IntegrationScope[],
    };
  }

  async revokeApiKey(context: TenantContext, apiKeyId: string): Promise<ApiKeyMetadata> {
    await this.requireActiveTenantContext(context);
    return this.database.transaction(async () => {
      const [revoked] = await this.database.db.update(apiKeys).set({ status: 'revoked', revokedAt: new Date() })
        .where(and(
          eq(apiKeys.id, apiKeyId),
          eq(apiKeys.organizationId, context.organizationId),
          eq(apiKeys.workspaceId, context.workspaceId),
          eq(apiKeys.integrationId, context.integrationId),
          eq(apiKeys.status, 'active'),
        )).returning();
      if (!revoked) throw new NotFoundException('Active API key not found');
      await this.audit.record(null, 'api_key_revoked', 'api_key', apiKeyId, {
        organizationId: context.organizationId,
        workspaceId: context.workspaceId,
        integrationId: context.integrationId,
      }, context.workspaceId);
      return this.toApiKeyMetadata(revoked);
    });
  }

  async rotateApiKey(context: TenantContext, apiKeyId: string): Promise<CreatedApiKey> {
    await this.requireActiveTenantContext(context);
    return this.database.transaction(async () => {
      const [oldKey] = await this.database.db.select().from(apiKeys).where(and(
        eq(apiKeys.id, apiKeyId),
        eq(apiKeys.organizationId, context.organizationId),
        eq(apiKeys.workspaceId, context.workspaceId),
        eq(apiKeys.integrationId, context.integrationId),
        eq(apiKeys.status, 'active'),
      )).for('update', { of: apiKeys }).limit(1);
      if (!oldKey || oldKey.revokedAt) throw new NotFoundException('Active API key not found');

      const generated = generateApiKey();
      const [newKey] = await this.database.db.insert(apiKeys).values({
        organizationId: oldKey.organizationId,
        workspaceId: oldKey.workspaceId,
        integrationId: oldKey.integrationId,
        name: oldKey.name,
        keyPrefix: generated.prefix,
        keyHash: generated.hash,
        scopes: oldKey.scopes,
      }).returning();
      if (!newKey) throw new Error('API key rotation failed');

      const [revoked] = await this.database.db.update(apiKeys).set({
        status: 'revoked',
        revokedAt: new Date(),
      }).where(and(eq(apiKeys.id, oldKey.id), eq(apiKeys.status, 'active'))).returning({ id: apiKeys.id });
      if (!revoked) throw new NotFoundException('Active API key not found');

      await this.audit.record(null, 'api_key_rotated', 'api_key', oldKey.id, {
        oldApiKeyId: oldKey.id,
        newApiKeyId: newKey.id,
        prefix: newKey.keyPrefix,
        integrationId: context.integrationId,
        scopes: newKey.scopes,
      }, context.workspaceId);
      return {
        id: newKey.id,
        organizationId: newKey.organizationId,
        workspaceId: newKey.workspaceId,
        integrationId: newKey.integrationId,
        name: newKey.name,
        keyPrefix: newKey.keyPrefix,
        scopes: newKey.scopes as IntegrationScope[],
        status: 'active',
        createdAt: newKey.createdAt,
        secret: generated.secret,
      };
    });
  }

  async requireActiveTenantContext(context: TenantContext): Promise<void> {
    const tenant = requireTenantContext(context);
    if (tenant.principal.type !== 'api_key') throw new NotFoundException('Active integration not found');
    const integration = await this.requireActiveIntegration(
      tenant.organizationId,
      tenant.workspaceId,
      tenant.integrationId,
    );
    if (integration.id !== tenant.integrationId) throw new NotFoundException('Active integration not found');
  }

  async getCurrent(context: TenantContext): Promise<IntegrationView> {
    await this.requireActiveTenantContext(context);
    return this.requireActiveIntegration(context.organizationId, context.workspaceId, context.integrationId);
  }

  private async requireActiveIntegration(
    organizationId: string,
    workspaceId: string,
    integrationId: string,
  ): Promise<IntegrationView> {
    const [integration] = await this.database.db.select().from(integrations).where(and(
      eq(integrations.id, integrationId),
      eq(integrations.organizationId, organizationId),
      eq(integrations.workspaceId, workspaceId),
      eq(integrations.status, 'active'),
    )).limit(1);
    if (!integration) throw new NotFoundException('Active integration not found');
    return integration;
  }

  private assertScopes(scopes: IntegrationScope[]): void {
    if (scopes.length === 0 || new Set(scopes).size !== scopes.length ||
      scopes.some((scope) => !integrationScopes.includes(scope))) {
      throw new Error('API key scopes are invalid');
    }
  }
}
