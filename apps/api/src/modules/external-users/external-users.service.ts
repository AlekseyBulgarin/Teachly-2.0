import { Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { DomainError } from '../../common/errors';
import { DatabaseService } from '../../infrastructure/database/database';
import { externalUsers } from '../../infrastructure/database/schema';
import { IntegrationsService } from '../integrations/integrations.service';
import type { TenantContext } from '../core/core.types';
import { UsersService } from '../users/users.service';
import type { ExternalUserView } from './external-users.types';

@Injectable()
export class ExternalUsersService {
  constructor(
    private readonly database: DatabaseService,
    private readonly integrations: IntegrationsService,
    private readonly users: UsersService,
  ) {}

  async upsert(context: TenantContext, externalUserId: string): Promise<ExternalUserView> {
    await this.integrations.requireActiveTenantContext(context);
    return this.database.transaction(async () => {
      await this.database.db.insert(externalUsers).values({
        organizationId: context.organizationId,
        workspaceId: context.workspaceId,
        integrationId: context.integrationId,
        externalUserId,
      }).onConflictDoNothing({
        target: [externalUsers.workspaceId, externalUsers.integrationId, externalUsers.externalUserId],
      });
      const [mapping] = await this.database.db.select().from(externalUsers).where(and(
        eq(externalUsers.organizationId, context.organizationId),
        eq(externalUsers.workspaceId, context.workspaceId),
        eq(externalUsers.integrationId, context.integrationId),
        eq(externalUsers.externalUserId, externalUserId),
      )).for('update', { of: externalUsers }).limit(1);
      if (!mapping) throw new Error('External user upsert failed');
      if (mapping.learnerId) return mapping;

      const learner = await this.users.createStudent('External learner');
      const [linked] = await this.database.db.update(externalUsers).set({
        learnerId: learner.id,
        updatedAt: new Date(),
      }).where(and(
        eq(externalUsers.id, mapping.id),
        eq(externalUsers.organizationId, context.organizationId),
        eq(externalUsers.workspaceId, context.workspaceId),
        eq(externalUsers.integrationId, context.integrationId),
      )).returning();
      if (!linked) throw new Error('External learner linkage failed');
      return linked;
    });
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

  async list(context: TenantContext, limit = 50): Promise<ExternalUserView[]> {
    await this.integrations.requireActiveTenantContext(context);
    return this.database.db.select().from(externalUsers).where(and(
      eq(externalUsers.organizationId, context.organizationId),
      eq(externalUsers.workspaceId, context.workspaceId),
      eq(externalUsers.integrationId, context.integrationId),
    )).orderBy(desc(externalUsers.createdAt), desc(externalUsers.id)).limit(Math.min(Math.max(limit, 1), 100));
  }

  async resolveActiveLearner(context: TenantContext, externalUserId: string): Promise<ExternalUserView & { learnerId: string }> {
    await this.integrations.requireActiveTenantContext(context);
    const externalUser = await this.findInContext(context, externalUserId);
    if (!externalUser || externalUser.status !== 'active' || !externalUser.learnerId) {
      throw new DomainError('EXTERNAL_LEARNER_NOT_FOUND', 'External learner not found', 404);
    }
    return { ...externalUser, learnerId: externalUser.learnerId };
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
