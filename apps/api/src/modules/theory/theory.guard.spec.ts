import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TheoryGuard } from './theory.guard';

function context(authorization: string): { execution: ExecutionContext; request: Record<string, unknown> } {
  const request = { headers: { authorization } };
  return {
    request,
    execution: {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => function handler() {},
      getClass: () => class Controller {},
    } as unknown as ExecutionContext,
  };
}

describe('TheoryGuard credential routing', () => {
  const principal = { provider: 'neon', subject: 'user', userId: 'user-id', userType: 'teacher' as const };
  const tenant = { workspaceId: 'workspace', organizationId: 'organization', integrationId: 'integration', scopes: ['theory:read'] };
  const identity = { resolveRequest: jest.fn().mockResolvedValue(principal) };
  const integrations = { authenticateApiKey: jest.fn().mockResolvedValue(tenant) };
  const core = { requireTenantContext: jest.fn((value) => value) };
  const guard = new TheoryGuard(identity as never, integrations as never, core as never, new Reflector());

  beforeEach(() => jest.clearAllMocks());

  it('keeps human JWTs on the identity path', async () => {
    const { execution, request } = context('Bearer eyJhbGciOiJFZERTQSJ9.payload.signature');
    await expect(guard.canActivate(execution)).resolves.toBe(true);
    expect(identity.resolveRequest).toHaveBeenCalled();
    expect(integrations.authenticateApiKey).not.toHaveBeenCalled();
    expect(request.principal).toEqual(principal);
  });

  it('uses machine authentication for Teachly API keys', async () => {
    const { execution, request } = context('Bearer tlk_key.secret');
    await expect(guard.canActivate(execution)).resolves.toBe(true);
    expect(integrations.authenticateApiKey).toHaveBeenCalledWith('tlk_key.secret');
    expect(identity.resolveRequest).not.toHaveBeenCalled();
    expect(request.tenantContext).toEqual(tenant);
  });
});
