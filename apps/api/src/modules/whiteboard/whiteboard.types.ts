export const WHITEBOARD_MAX_DATA_BYTES = 2 * 1024 * 1024;

export type WhiteboardStatus = 'active' | 'archived';

export type WhiteboardStateData = Record<string, unknown>;

export type WhiteboardView = {
  id: string;
  title: string;
  externalReference: string | null;
  status: WhiteboardStatus;
  currentRevision: number;
  createdAt: Date;
  updatedAt: Date;
};

export type WhiteboardStateView = {
  id: string;
  revision: number;
  data: WhiteboardStateData | null;
};

export type WhiteboardSaveResult = {
  revision: number;
};

export type WhiteboardResourceType = 'task' | 'theory';

export type WhiteboardResourceView = {
  id: string;
  type: WhiteboardResourceType;
  resourceId: string;
};
