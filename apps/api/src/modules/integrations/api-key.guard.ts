import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { TeachlyRequest } from '../../common/request-context';
import { IntegrationsService } from './integrations.service';
import { REQUIRED_SCOPES_KEY } from './scope.decorator';
import type { IntegrationScope } from './integrations.types';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly integrations: IntegrationsService, private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<TeachlyRequest>();
    const authorization = request.headers.authorization;
    const secret = typeof authorization === 'string' && authorization.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : null;
    if (!secret) throw new UnauthorizedException('Workspace API key required');
    const tenantContext = await this.integrations.authenticateApiKey(secret);
    if (!tenantContext) throw new UnauthorizedException('Invalid or revoked workspace API key');
    const required = this.reflector.getAllAndOverride<IntegrationScope[]>(REQUIRED_SCOPES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? [];
    if (required.some((scope) => !tenantContext.scopes.includes(scope))) {
      throw new ForbiddenException('API key lacks required scope');
    }
    request.tenantContext = tenantContext;
    return true;
  }
}
