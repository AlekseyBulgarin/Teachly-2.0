import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { TeachlyRequest } from '../../common/request-context';
import { IS_PUBLIC_KEY } from '../../common/public.decorator';
import { IdentityService } from './identity.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly identity: IdentityService, private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()])) return true;
    const request = context.switchToHttp().getRequest<TeachlyRequest>();
    if (request.path === '/docs' || request.path.startsWith('/docs/')) return true;
    request.principal = await this.identity.resolveRequest({ headers: request.headers as Record<string, unknown> });
    return true;
  }
}
