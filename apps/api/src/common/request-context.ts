import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedPrincipal } from '../modules/identity/auth.types';
import { requireTenantContext } from '../modules/core/core.access';
import type { TenantContext } from '../modules/core/core.types';

export type TeachlyRequest = Request & {
  principal?: AuthenticatedPrincipal;
  tenantContext?: TenantContext;
  requestId?: string;
};

export const CurrentPrincipal = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedPrincipal => {
    const request = context.switchToHttp().getRequest<TeachlyRequest>();
    if (!request.principal) throw new Error('Authenticated principal is missing');
    return request.principal;
  },
);

export const OptionalPrincipal = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedPrincipal | undefined => {
    const request = context.switchToHttp().getRequest<TeachlyRequest>();
    return request.principal;
  },
);

export const CurrentTenantContext = createParamDecorator(
  (_data: unknown, context: ExecutionContext): TenantContext => {
    const request = context.switchToHttp().getRequest<TeachlyRequest>();
    return requireTenantContext(request.tenantContext);
  },
);

export const OptionalTenantContext = createParamDecorator(
  (_data: unknown, context: ExecutionContext): TenantContext | undefined => {
    const request = context.switchToHttp().getRequest<TeachlyRequest>();
    return request.tenantContext;
  },
);

export const CurrentRequestId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<TeachlyRequest>();
    if (!request.requestId) throw new Error('Request ID is missing');
    return request.requestId;
  },
);
