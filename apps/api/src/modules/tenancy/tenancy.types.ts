export type TenantStatus = 'active' | 'archived';
export type MembershipRole = 'organization_admin' | 'workspace_admin' | 'educator';
export type MembershipStatus = 'active' | 'revoked';

export type OrganizationView = {
  id: string;
  name: string;
  status: TenantStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type WorkspaceView = {
  id: string;
  organizationId: string;
  name: string;
  status: TenantStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type MembershipView = {
  id: string;
  userId: string;
  organizationId: string;
  workspaceId: string | null;
  role: MembershipRole;
  status: MembershipStatus;
  createdAt: Date;
};
