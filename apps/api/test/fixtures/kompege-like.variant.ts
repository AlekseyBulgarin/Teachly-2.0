import { kompegeRichTask, kompegeTextTask } from './kompege-like.tasks';

export const kompegeLikeVariant = {
  externalVariantId: 'kompege-like-variant-001',
  title: 'Kompege-like algebra variant',
  metadata: { provider: 'local-fixture' },
  tasks: [
    { taskId: kompegeRichTask.externalTaskId, position: 0, section: 'Section B' },
    { taskId: kompegeTextTask.externalTaskId, position: 1, section: 'Section A' },
  ],
} as const;

export const kompegeUnresolvedVariantId = 'kompege-like-unresolved';

export const kompegeUnresolvedVariant = {
  title: 'Unresolved',
  tasks: [{ taskId: 'missing-task' }],
} as const;
