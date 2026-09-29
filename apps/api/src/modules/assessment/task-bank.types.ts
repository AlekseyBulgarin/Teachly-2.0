import type { AuthenticatedPrincipal } from '../identity/auth.types';
import type { TenantContext } from '../core/core.types';

export const taskBankScopes = ['assessment:read', 'assessment:answer:read', 'assessment:write', 'assessment:manage'] as const;
export type TaskBankScope = typeof taskBankScopes[number];

export type TaskBankAuthContext = {
  tenant?: TenantContext;
  principal?: AuthenticatedPrincipal;
};

export type TaskContentBlock = {
  type: 'paragraph' | 'heading' | 'formula' | 'table' | 'image' | 'list' | 'file' | 'text';
  [key: string]: unknown;
};

export type NormalizedTaskContent = {
  title?: string;
  statement: string;
  blocks?: TaskContentBlock[];
  options?: Array<{ id: string; label: string }>;
  attachments?: Array<{ reference: string; label?: string }>;
  metadata?: Record<string, string | number | boolean>;
  correctOptionId?: string;
};

export type NormalizedAnswerSchema = {
  type: string;
  required?: boolean;
  evaluatorCapability: 'automatic' | 'manual' | 'unsupported';
};

export type TaskBankProposal = {
  statement?: string;
  blocks?: TaskContentBlock[];
  metadata?: Record<string, string | number | boolean>;
  proposedBy: 'ai';
  status: 'draft';
};

export type GenericTaskPayload = {
  title?: unknown;
  statement?: unknown;
  content?: unknown;
  blocks?: unknown;
  options?: unknown;
  attachments?: unknown;
  answer?: unknown;
  answerSchema?: unknown;
  taskType?: unknown;
  metadata?: unknown;
  subjectId?: unknown;
  courseId?: unknown;
  topicId?: unknown;
  skillId?: unknown;
  subject?: unknown;
  course?: unknown;
  topic?: unknown;
  skill?: unknown;
  category?: unknown;
  section?: unknown;
};

export const curriculumMappingTypes = ['subject', 'course', 'topic', 'skill', 'category', 'section'] as const;
export type CurriculumMappingType = typeof curriculumMappingTypes[number];
export type ExternalCurriculumReferences = Partial<Record<CurriculumMappingType, string>>;

export type VariantItemInput = {
  externalTaskId?: string;
  taskVersionId?: string;
  position?: number;
  required?: boolean;
  section?: string;
  metadata?: Record<string, unknown>;
};
