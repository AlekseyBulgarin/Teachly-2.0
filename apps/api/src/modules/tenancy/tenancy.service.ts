import { Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, isNull, or } from 'drizzle-orm';
import { DatabaseService } from '../../infrastructure/database/database';
import { memberships, organizations, workspaces } from '../../infrastructure/database/schema';
import type { MembershipRole, MembershipView, OrganizationView, WorkspaceView } from './tenancy.types';
import type { TenantContext } from '../integrations/integrations.types';

@Injectable()
export class TenancyService {
  constructor(private readonly database: DatabaseService) {}

  async createOrganization(name: string): Promise<OrganizationView> {
    const [organization] = await this.database.db.insert(organizations).values({ name }).returning();
    if (!organization) throw new Error('Organization creation failed');
    return organization;
  }

  async createWorkspace(organizationId: string, name: string): Promise<WorkspaceView> {
    await this.requireActiveOrganization(organizationId);
    const [workspace] = await this.database.db.insert(workspaces).values({ organizationId, name }).returning();
    if (!workspace) throw new Error('Workspace creation failed');
    return workspace;
  }

  async createMembership(input: {
    userId: string;
    organizationId: string;
    workspaceId?: string;
    role: MembershipRole;
  }): Promise<MembershipView> {
    if (input.workspaceId) await this.requireActiveWorkspace(input.organizationId, input.workspaceId);
    else await this.requireActiveOrganization(input.organizationId);
    const [membership] = await this.database.db.insert(memberships).values({
      userId: input.userId,
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      role: input.role,
    }).returning();
    if (!membership) throw new Error('Membership creation failed');
    return membership;
  }

  async requireActiveOrganization(organizationId: string): Promise<OrganizationView> {
    const [organization] = await this.database.db.select().from(organizations)
      .where(and(eq(organizations.id, organizationId), eq(organizations.status, 'active'))).limit(1);
    if (!organization) throw new NotFoundException('Active organization not found');
    return organization;
  }

  async requireActiveWorkspace(organizationId: string, workspaceId: string): Promise<WorkspaceView> {
    const [workspace] = await this.database.db.select().from(workspaces)
      .where(and(
        eq(workspaces.id, workspaceId),
        eq(workspaces.organizationId, organizationId),
        eq(workspaces.status, 'active'),
      )).limit(1);
    if (!workspace) throw new NotFoundException('Active workspace not found');
    return workspace;
  }

  async assertUserCanAccessWorkspace(userId: string, context: TenantContext): Promise<void> {
    const [membership] = await this.database.db.select({ id: memberships.id }).from(memberships)
      .where(and(
        eq(memberships.userId, userId),
        eq(memberships.organizationId, context.organizationId),
        eq(memberships.status, 'active'),
        or(
          eq(memberships.workspaceId, context.workspaceId),
          and(isNull(memberships.workspaceId), eq(memberships.role, 'organization_admin')),
        ),
      )).limit(1);
    if (!membership) throw new NotFoundException('User is not a member of this workspace');
  }
}
