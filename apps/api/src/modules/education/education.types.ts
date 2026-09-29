export type TaskOption = {
  id: string;
  label: string;
};

export type PublishedTaskVersion = {
  id: string;
  taskId: string;
  version: number;
  taskType: string;
  status: 'published';
  content: {
    statement: string;
    options?: TaskOption[];
    correctOptionId?: string;
    title?: string;
    blocks?: Array<Record<string, unknown>>;
    attachments?: Array<{ reference: string; label?: string }>;
    metadata?: Record<string, string | number | boolean>;
  };
  evaluationRule: string;
  publishedAt: Date;
  createdAt: Date;
};

export type PublicTaskVersion = Omit<PublishedTaskVersion, 'content'> & {
  content: {
    statement: string;
    options?: TaskOption[];
    title?: string;
    blocks?: Array<Record<string, unknown>>;
    attachments?: Array<{ reference: string; label?: string }>;
    metadata?: Record<string, string | number | boolean>;
  };
};

export type PublishedTaskContext = {
  workspaceId: string;
  taskVersion: PublishedTaskVersion;
  task: {
    id: string;
    subjectId: string | null;
    courseId: string | null;
    topicId: string | null;
    skillId: string | null;
  };
  subject: { id: string; code: string; name: string } | null;
  course: { id: string; subjectId: string; name: string } | null;
  topic: { id: string; courseId: string; name: string } | null;
  skill: { id: string; topicId: string; name: string } | null;
};
