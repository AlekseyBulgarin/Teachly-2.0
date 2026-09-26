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
    options: TaskOption[];
    correctOptionId: string;
  };
  evaluationRule: string;
  publishedAt: Date;
  createdAt: Date;
};

export type PublicTaskVersion = Omit<PublishedTaskVersion, 'content'> & {
  content: {
    statement: string;
    options: TaskOption[];
  };
};

export type PublishedTaskContext = {
  workspaceId: string;
  taskVersion: PublishedTaskVersion;
  task: {
    id: string;
    subjectId: string;
    courseId: string;
    topicId: string;
    skillId: string;
  };
  subject: { id: string; code: string; name: string };
  course: { id: string; subjectId: string; name: string };
  topic: { id: string; courseId: string; name: string };
  skill: { id: string; topicId: string; name: string };
};
