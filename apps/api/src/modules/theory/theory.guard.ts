import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { TeachlyRequest } from '../../common/request-context';
import { CoreAccessService } from '../core/core.access';
import { IdentityService } from '../identity/identity.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { THEORY_SCOPES_KEY } from './theory.scope';
import type { TheoryScope } from './theory.types';

@Injectable()
export class TheoryGuard implements CanActivate {
  constructor(
    private readonly identity: IdentityService,
    private readonly integrations: IntegrationsService,
    private readonly core: CoreAccessService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<TeachlyRequest>();
    const required = this.reflector.getAllAndOverride<TheoryScope[]>(THEORY_SCOPES_KEY, [context.getHandler(), context.getClass()]) ?? [];
    const authorization = request.headers.authorization;
    if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
      const tenant = this.core.requireTenantContext(await this.integrations.authenticateApiKey(authorization.slice('Bearer '.length)));
      if (required.some((scope) => !tenant.scopes.includes(scope))) throw new ForbiddenException('API key lacks required theory scope');
      request.tenantContext = tenant;
      return true;
    }
    request.principal = await this.identity.resolveRequest({ headers: request.headers as Record<string, unknown> });
    if (!request.principal) throw new UnauthorizedException('Authentication required');
    return true;
  }
}

