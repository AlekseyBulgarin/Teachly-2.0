import type { TenantContext } from '../core/core.types';
import type { AuthenticatedPrincipal } from '../identity/auth.types';

export const theoryScopes = ['theory:read', 'theory:write', 'theory:manage'] as const;
export type TheoryScope = typeof theoryScopes[number];

export type TheoryAuthContext = {
  tenant?: TenantContext;
  principal?: AuthenticatedPrincipal;
};

export type TheoryContentBlock = {
  type: 'heading' | 'paragraph' | 'list' | 'formula' | 'image' | 'file' | 'example' | 'callout';
  [key: string]: unknown;
};

export type TheoryContent = { blocks: TheoryContentBlock[] };

export type TheoryVersionMetadata = {
  title: string;
  description: string;
  category: string | null;
  subjectId: string | null;
  courseId: string | null;
  topicId: string | null;
  skillId: string | null;
  taskIds: string[];
};
