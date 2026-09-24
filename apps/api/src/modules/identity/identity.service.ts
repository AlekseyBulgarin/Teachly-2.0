import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DatabaseService } from '../../infrastructure/database/database';
import { externalIdentities, users } from '../../infrastructure/database/schema';
import { AUTHENTICATION_ADAPTER, type AuthenticationAdapter } from './auth.port';
import type { AuthenticatedPrincipal } from './auth.types';

@Injectable()
export class IdentityService {
  constructor(
    private readonly database: DatabaseService,
    @Inject(AUTHENTICATION_ADAPTER) private readonly adapter: AuthenticationAdapter,
  ) {}

  async resolveRequest(request: { headers: Record<string, unknown> }): Promise<AuthenticatedPrincipal> {
    const external = await this.adapter.resolve(request);
    if (!external) throw new UnauthorizedException('Authentication required');
    const rows = await this.database.db
      .select({ user: users, identity: externalIdentities })
      .from(externalIdentities)
      .innerJoin(users, eq(users.id, externalIdentities.userId))
      .where(and(eq(externalIdentities.provider, external.provider), eq(externalIdentities.subject, external.subject)))
      .limit(1);
    const row = rows[0];
    if (!row) throw new UnauthorizedException('Unknown external identity');
    return { provider: external.provider, subject: external.subject, userId: row.user.id, userType: row.user.type };
  }
}
