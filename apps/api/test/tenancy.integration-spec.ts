import { and, eq } from 'drizzle-orm';
import { DatabaseService } from '../src/infrastructure/database/database';
import { apiKeys, externalUsers, memberships } from '../src/infrastructure/database/schema';
import { AuditService } from '../src/modules/audit/audit.service';
import { ExternalUsersService } from '../src/modules/external-users/external-users.service';
import { IntegrationsService } from '../src/modules/integrations/integrations.service';
import { TenancyService } from '../src/modules/tenancy/tenancy.service';
import { fixtureIds } from '../src/infrastructure/database/seed';
import { resetTestDatabase, testDatabase } from './postgres-test';

jest.setTimeout(120_000);

describe('B2B tenant and integration identity foundation (PostgreSQL)', () => {
  let database: DatabaseService;
  let tenancy: TenancyService;
  let integrations: IntegrationsService;
  let externalUsersService: ExternalUsersService;

  beforeEach(async () => {
    database = testDatabase();
    await resetTestDatabase(database);
    tenancy = new TenancyService(database);
    integrations = new IntegrationsService(database, tenancy, new AuditService(database));
    externalUsersService = new ExternalUsersService(database, integrations);
  });

  afterEach(async () => { await database?.onModuleDestroy(); });

  async function tenantFixture(name = 'Pilot organization') {
    const organization = await tenancy.createOrganization(name);
    const workspace = await tenancy.createWorkspace(organization.id, 'Pilot workspace');
    const integration = await integrations.createIntegration(organization.id, workspace.id, 'Customer platform');
    const key = await integrations.createApiKey({
      organizationId: organization.id,
      workspaceId: workspace.id,
      integrationId: integration.id,
      name: 'Pilot key',
      scopes: ['external_users:read', 'external_users:write'],
    });
    const context = await integrations.authenticateApiKey(key.secret);
    if (!context) throw new Error('Tenant fixture API key did not authenticate');
    return { organization, workspace, integration, key, context };
  }

  it('creates the organization/workspace/integration hierarchy and scoped memberships', async () => {
    const fixture = await tenantFixture();
    const organizationMembership = await tenancy.createMembership({
      userId: fixtureIds.teacher,
      organizationId: fixture.organization.id,
      role: 'organization_admin',
    });
    const workspaceMembership = await tenancy.createMembership({
      userId: fixtureIds.student,
      organizationId: fixture.organization.id,
      workspaceId: fixture.workspace.id,
      role: 'educator',
    });

    expect(organizationMembership.workspaceId).toBeNull();
    expect(organizationMembership.role).toBe('organization_admin');
    expect(workspaceMembership.workspaceId).toBe(fixture.workspace.id);
    expect(workspaceMembership.role).toBe('educator');
    await expect(tenancy.createMembership({
      userId: fixtureIds.teacher,
      organizationId: fixture.organization.id,
      workspaceId: '00000000-0000-4000-8000-000000000999',
      role: 'workspace_admin',
    })).rejects.toThrow('Active workspace not found');

    const stored = await database.db.select().from(memberships)
      .where(and(eq(memberships.organizationId, fixture.organization.id), eq(memberships.userId, fixtureIds.teacher)));
    expect(stored).toHaveLength(1);
  });

  it('authenticates high-entropy API keys without persisting the raw secret', async () => {
    const fixture = await tenantFixture();
    const stored = await database.db.select().from(apiKeys).where(eq(apiKeys.id, fixture.key.id));
    expect(stored).toHaveLength(1);
    expect(stored[0]?.keyHash).not.toBe(fixture.key.secret);
    expect(stored[0]?.keyHash).not.toContain(fixture.key.secret);
    expect(fixture.key.secret.startsWith(`${fixture.key.keyPrefix}.`)).toBe(true);
    expect(fixture.context).toMatchObject({
      organizationId: fixture.organization.id,
      workspaceId: fixture.workspace.id,
      integrationId: fixture.integration.id,
      scopes: ['external_users:read', 'external_users:write'],
    });
    expect(stored[0]?.lastUsedAt).not.toBeNull();
    expect(await integrations.authenticateApiKey('tlk_0000000000000000.invalid')).toBeNull();

    await integrations.revokeApiKey(fixture.context, fixture.key.id);
    expect(await integrations.authenticateApiKey(fixture.key.secret)).toBeNull();
  });

  it('keeps external users idempotent and allows equal IDs in separate integrations and workspaces', async () => {
    const first = await tenantFixture('Organization A');
    const sameWorkspaceIntegration = await integrations.createIntegration(first.organization.id, first.workspace.id, 'Second integration');
    const sameWorkspaceKey = await integrations.createApiKey({
      organizationId: first.organization.id,
      workspaceId: first.workspace.id,
      integrationId: sameWorkspaceIntegration.id,
      name: 'Second integration key',
      scopes: ['external_users:read', 'external_users:write'],
    });
    const sameWorkspaceContext = await integrations.authenticateApiKey(sameWorkspaceKey.secret);
    if (!sameWorkspaceContext) throw new Error('Same-workspace fixture API key did not authenticate');
    const secondWorkspace = await tenancy.createWorkspace(first.organization.id, 'Second workspace');
    const secondIntegration = await integrations.createIntegration(first.organization.id, secondWorkspace.id, 'Second platform');
    const secondKey = await integrations.createApiKey({
      organizationId: first.organization.id,
      workspaceId: secondWorkspace.id,
      integrationId: secondIntegration.id,
      name: 'Second key',
      scopes: ['external_users:read', 'external_users:write'],
    });
    const secondContext = await integrations.authenticateApiKey(secondKey.secret);
    if (!secondContext) throw new Error('Second tenant fixture API key did not authenticate');

    const firstUser = await externalUsersService.upsert(first.context, 'learner-42');
    const replay = await externalUsersService.upsert(first.context, 'learner-42');
    const sameWorkspaceUser = await externalUsersService.upsert(sameWorkspaceContext, 'learner-42');
    const secondUser = await externalUsersService.upsert(secondContext, 'learner-42');

    expect(replay.id).toBe(firstUser.id);
    expect(sameWorkspaceUser.id).not.toBe(firstUser.id);
    expect(secondUser.id).not.toBe(firstUser.id);
    expect(await database.db.select().from(externalUsers)).toHaveLength(3);
    await expect(externalUsersService.upsert({ ...first.context, integrationId: secondContext.integrationId }, 'learner-42'))
      .rejects.toThrow('Active integration not found');
    await expect(externalUsersService.get(secondContext, firstUser.id)).rejects.toThrow('External user not found');
  });

  it('rejects a workspace/integration tuple belonging to another organization', async () => {
    const first = await tenantFixture('Organization A');
    const second = await tenantFixture('Organization B');
    await expect(integrations.createIntegration(first.organization.id, second.workspace.id, 'Invalid integration'))
      .rejects.toThrow('Active workspace not found');
    await expect(externalUsersService.upsert({ ...first.context, workspaceId: second.workspace.id }, 'learner-99'))
      .rejects.toThrow('Active integration not found');
  });
});
