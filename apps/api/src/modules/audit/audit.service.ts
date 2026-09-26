import { Injectable } from '@nestjs/common';
import { DatabaseService, type DatabaseTransaction } from '../../infrastructure/database/database';
import { auditEvents } from '../../infrastructure/database/schema';

@Injectable()
export class AuditService {
  constructor(private readonly database: DatabaseService) {}

  async record(
    actorUserId: string | null,
    action: string,
    resourceType: string,
    resourceId: string | null,
    metadata?: Record<string, unknown>,
    workspaceId?: string,
  ): Promise<void> {
    await this.database.db.insert(auditEvents).values({ actorUserId, action, resourceType, resourceId, metadata, workspaceId });
  }

  async recordIn(
    tx: DatabaseTransaction,
    actorUserId: string | null,
    action: string,
    resourceType: string,
    resourceId: string,
    metadata?: Record<string, unknown>,
    workspaceId?: string,
  ): Promise<void> {
    await tx.insert(auditEvents).values({ actorUserId, action, resourceType, resourceId, metadata, workspaceId });
  }
}
