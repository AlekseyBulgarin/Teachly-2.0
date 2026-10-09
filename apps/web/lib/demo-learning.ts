import type { Locale } from '@/lib/i18n';
import type { PublicTaskVersion } from '@/lib/api';

export type DemoTrack = 'python' | 'algorithms' | 'web';

export const demoTracks: Array<{
  id: DemoTrack;
  title: Record<Locale, string>;
  detail: Record<Locale, string>;
}> = [
  {
    id: 'python',
    title: { ru: 'Python: первые программы', en: 'Python: first programs' },
    detail: { ru: 'Переменные, списки, циклы, функции и типы.', en: 'Variables, lists, loops, functions and types.' },
  },
  {
    id: 'algorithms',
    title: { ru: 'Алгоритмы и отладка', en: 'Algorithms and debugging' },
    detail: { ru: 'Поиск, логика и диагностика ошибок.', en: 'Search, logic and diagnosing errors.' },
  },
  {
    id: 'web',
    title: { ru: 'Web: клиент и API', en: 'Web: client and API' },
    detail: { ru: 'HTTP, JSON и границы клиент-сервер.', en: 'HTTP, JSON and client-server boundaries.' },
  },
];

type LocalizedTaskContent = {
  title?: string;
  statement?: string;
  options?: Array<{ id: string; label: string }>;
  explanation?: string;
};

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

export function localizeTask(task: PublicTaskVersion, locale: Locale) {
  const metadata = record(task.content.metadata);
  const translations = record(metadata?.translations);
  const localized = record(translations?.[locale]) as LocalizedTaskContent | null;
  const options = Array.isArray(localized?.options)
    ? localized.options.filter((option) => typeof option?.id === 'string' && typeof option?.label === 'string')
    : task.content.options ?? [];
  return {
    ...task,
    content: {
      ...task.content,
      title: typeof localized?.title === 'string' ? localized.title : task.content.title,
      statement: typeof localized?.statement === 'string' ? localized.statement : task.content.statement,
      options,
    },
    explanation: typeof localized?.explanation === 'string'
      ? localized.explanation
      : typeof metadata?.explanation === 'string' ? metadata.explanation : null,
    code: typeof metadata?.code === 'string' ? metadata.code : null,
    track: typeof metadata?.track === 'string' ? metadata.track as DemoTrack : null,
    showcase: metadata?.showcase === true,
  };
}
