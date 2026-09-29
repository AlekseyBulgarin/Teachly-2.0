export const integrationScopes = [
  'external_users:read', 'external_users:write', 'remediation:write',
  'assessment:read', 'assessment:answer:read', 'assessment:write', 'assessment:manage',
] as const;
export type IntegrationScope = typeof integrationScopes[number];

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
