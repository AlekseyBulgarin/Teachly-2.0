export type PrincipalContext = {
  type: 'api_key';
  apiKeyId: string;
};

export type IntegrationReference = {
  organizationId: string;
  workspaceId: string;
  integrationId: string;
};

export type WorkspaceAccess = Pick<IntegrationReference, 'organizationId' | 'workspaceId'>;

export type TenantContext = IntegrationReference & {
  principal: PrincipalContext;
  scopes: readonly string[];
};

export type TenantAccessContext = TenantContext;
