import { Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DatabaseService } from '../../infrastructure/database/database';
import { externalUsers } from '../../infrastructure/database/schema';
import { IntegrationsService } from '../integrations/integrations.service';
import type { TenantContext } from '../integrations/integrations.types';
import type { ExternalUserView } from './external-users.types';

@Injectable()
export class ExternalUsersService {
  constructor(
    private readonly database: DatabaseService,
    private readonly integrations: IntegrationsService,
  ) {}

  async upsert(context: TenantContext, externalUserId: string): Promise<ExternalUserView> {
    await this.integrations.requireActiveTenantContext(context);
    const [created] = await this.database.db.insert(externalUsers).values({
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      integrationId: context.integrationId,
      externalUserId,
    }).onConflictDoNothing({
      target: [externalUsers.workspaceId, externalUsers.integrationId, externalUsers.externalUserId],
    }).returning();
    if (created) return created;
    const existing = await this.findInContext(context, externalUserId);
    if (!existing) throw new Error('External user upsert failed');
    return existing;
  }

  async get(context: TenantContext, id: string): Promise<ExternalUserView> {
    await this.integrations.requireActiveTenantContext(context);
    const [externalUser] = await this.database.db.select().from(externalUsers).where(and(
      eq(externalUsers.id, id),
      eq(externalUsers.organizationId, context.organizationId),
      eq(externalUsers.workspaceId, context.workspaceId),
      eq(externalUsers.integrationId, context.integrationId),
    )).limit(1);
    if (!externalUser) throw new NotFoundException('External user not found');
    return externalUser;
  }

  private async findInContext(context: TenantContext, externalUserId: string): Promise<ExternalUserView | null> {
    const [externalUser] = await this.database.db.select().from(externalUsers).where(and(
      eq(externalUsers.organizationId, context.organizationId),
      eq(externalUsers.workspaceId, context.workspaceId),
      eq(externalUsers.integrationId, context.integrationId),
      eq(externalUsers.externalUserId, externalUserId),
    )).limit(1);
    return externalUser ?? null;
  }
}
