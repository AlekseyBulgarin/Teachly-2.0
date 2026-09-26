export type ExternalUserView = {
  id: string;
  organizationId: string;
  workspaceId: string;
  integrationId: string;
  externalUserId: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
};
