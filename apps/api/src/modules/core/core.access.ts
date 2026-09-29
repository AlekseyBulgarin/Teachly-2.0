import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import type { IntegrationReference, TenantContext, WorkspaceAccess } from './core.types';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

export function requireTenantContext(context: TenantContext | undefined | null): TenantContext {
  if (!context ||
    context.principal?.type !== 'api_key' ||
    !isNonEmptyString(context.principal.apiKeyId) ||
    !isNonEmptyString(context.organizationId) ||
    !isNonEmptyString(context.workspaceId) ||
    !isNonEmptyString(context.integrationId) ||
    !Array.isArray(context.scopes)) {
    throw new UnauthorizedException('Tenant context is missing or invalid');
  }
  return context;
}

export function assertWorkspaceAccess(context: TenantContext, resource: WorkspaceAccess): void {
  const tenant = requireTenantContext(context);
  if (tenant.organizationId !== resource.organizationId || tenant.workspaceId !== resource.workspaceId) {
    throw new ForbiddenException('Workspace access denied');
  }
}

export function assertIntegrationAccess(context: TenantContext, resource: IntegrationReference): void {
  assertWorkspaceAccess(context, resource);
  if (context.integrationId !== resource.integrationId) throw new ForbiddenException('Integration access denied');
}

@Injectable()
export class CoreAccessService {
  requireTenantContext(context: TenantContext | undefined | null): TenantContext {
    return requireTenantContext(context);
  }

  assertWorkspaceAccess(context: TenantContext, resource: WorkspaceAccess): void {
    assertWorkspaceAccess(context, resource);
  }

  assertIntegrationAccess(context: TenantContext, resource: IntegrationReference): void {
    assertIntegrationAccess(context, resource);
  }
}
