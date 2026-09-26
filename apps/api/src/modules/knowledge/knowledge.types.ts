import type { TenantContext } from '../integrations/integrations.types';

export type KnowledgeLicenseStatus = 'unknown' | 'allowed' | 'restricted';
export type KnowledgeExternalAiPermission = 'not_reviewed' | 'allowed' | 'prohibited';

export type KnowledgeSourceInput = {
  name: string;
  sourceType: string;
  externalReference?: string;
  licenseStatus?: KnowledgeLicenseStatus;
};

export type KnowledgeDocumentInput = {
  sourceId: string;
  documentKey: string;
  title: string;
};

export type KnowledgeChunkInput = {
  content: string;
  section?: string;
};

export type KnowledgeVersionImportInput = {
  documentId: string;
  idempotencyKey: string;
  rawContent: string;
  normalizedContent: string;
  chunks: readonly KnowledgeChunkInput[];
  sourceReference?: string;
  licenseStatus?: KnowledgeLicenseStatus;
  importedByUserId?: string | null;
};

export type KnowledgeApprovalInput = {
  approvalNote?: string;
};

export type KnowledgeExternalAiPermissionInput = {
  permission: KnowledgeExternalAiPermission;
  note?: string;
};

export type KnowledgeRetrievalInput = {
  context: TenantContext;
  documentId?: string;
  sourceId?: string;
  limit?: number;
};

export type RetrievedKnowledgeExcerpt = {
  chunkId: string;
  documentId: string;
  documentVersionId: string;
  content: string;
  section: string | null;
  ordinal: number;
  source: {
    id: string;
    name: string;
    type: string;
    externalReference: string | null;
  };
  provenance: {
    sourceReference: string | null;
    importedAt: Date;
    rawContentChecksum: string;
    normalizedContentChecksum: string;
    chunkContentChecksum: string;
  };
  licenseStatus: KnowledgeLicenseStatus;
  externalAiPermission: KnowledgeExternalAiPermission;
  approval: {
    approvedAt: Date;
    approvedByUserId: string | null;
    approvedByPrincipal: string;
    note: string | null;
  };
};

export interface KnowledgeRetrievalPort {
  retrieve(input: KnowledgeRetrievalInput): Promise<RetrievedKnowledgeExcerpt[]>;
  retrieveForExternalAi(input: KnowledgeRetrievalInput): Promise<RetrievedKnowledgeExcerpt[]>;
}

export const KNOWLEDGE_RETRIEVAL_PORT = Symbol('KNOWLEDGE_RETRIEVAL_PORT');
