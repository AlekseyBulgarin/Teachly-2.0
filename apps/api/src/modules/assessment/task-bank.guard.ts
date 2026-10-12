import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { TeachlyRequest } from '../../common/request-context';
import { IdentityService } from '../identity/identity.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { CoreAccessService } from '../core/core.access';
import { TASK_BANK_SCOPES_KEY } from './task-bank.scope';
import type { TaskBankScope } from './task-bank.types';
import { extractBearerToken, isTeachlyApiKey } from '../../common/bearer-token';

@Injectable()
export class TaskBankGuard implements CanActivate {
  constructor(
    private readonly identity: IdentityService,
    private readonly integrations: IntegrationsService,
    private readonly core: CoreAccessService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<TeachlyRequest>();
    const required = this.reflector.getAllAndOverride<TaskBankScope[]>(TASK_BANK_SCOPES_KEY, [context.getHandler(), context.getClass()]) ?? [];
    const bearer = extractBearerToken(request.headers.authorization);
    if (isTeachlyApiKey(bearer)) {
      const tenant = this.core.requireTenantContext(await this.integrations.authenticateApiKey(bearer));
      if (required.some((scope) => !tenant.scopes.includes(scope))) throw new ForbiddenException('API key lacks required assessment scope');
      request.tenantContext = tenant;
      return true;
    }
    request.principal = await this.identity.resolveRequest({ headers: request.headers as Record<string, unknown> });
    if (!request.principal) throw new UnauthorizedException('Authentication required');
    return true;
  }
}
