import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedPrincipal } from '../modules/identity/auth.types';

export type TeachlyRequest = Request & { principal?: AuthenticatedPrincipal; requestId?: string };

export const CurrentPrincipal = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedPrincipal => {
    const request = context.switchToHttp().getRequest<TeachlyRequest>();
    if (!request.principal) throw new Error('Authenticated principal is missing');
    return request.principal;
  },
);
