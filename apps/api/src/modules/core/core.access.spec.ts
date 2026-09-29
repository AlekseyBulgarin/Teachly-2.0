import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { assertIntegrationAccess, assertWorkspaceAccess, requireTenantContext } from './core.access';
import type { TenantContext } from './core.types';

const context: TenantContext = {
  principal: { type: 'api_key', apiKeyId: 'key-1' },
  organizationId: 'organization-1',
  workspaceId: 'workspace-1',
  integrationId: 'integration-1',
  scopes: ['external_users:read'],
};

describe('Core access contract', () => {
  it('fails closed when tenant context is missing or malformed', () => {
    expect(() => requireTenantContext(undefined)).toThrow(UnauthorizedException);
    expect(() => requireTenantContext({ ...context, workspaceId: '' })).toThrow(UnauthorizedException);
  });

  it('rejects resources outside the authorized workspace or integration', () => {
    expect(() => assertWorkspaceAccess(context, {
      organizationId: context.organizationId,
      workspaceId: 'workspace-2',
    })).toThrow(ForbiddenException);
    expect(() => assertIntegrationAccess(context, {
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      integrationId: 'integration-2',
    })).toThrow(ForbiddenException);
  });
});
