export const integrationScopes = ['external_users:read', 'external_users:write'] as const;
export type IntegrationScope = typeof integrationScopes[number];

export type TenantContext = {
  principal: { type: 'api_key'; apiKeyId: string };
  organizationId: string;
  workspaceId: string;
  integrationId: string;
  scopes: IntegrationScope[];
};

export type IntegrationView = {
  id: string;
  organizationId: string;
  workspaceId: string;
  name: string;
  status: 'active' | 'disabled';
  createdAt: Date;
};

export type CreatedApiKey = {
  id: string;
  organizationId: string;
  workspaceId: string;
  integrationId: string;
  name: string;
  keyPrefix: string;
  scopes: IntegrationScope[];
  status: 'active';
  createdAt: Date;
  secret: string;
};
