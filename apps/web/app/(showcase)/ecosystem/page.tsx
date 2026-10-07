import { OverviewPage } from '@/components/showcase/overview';
import { showcaseMetadata } from '@/lib/site';

export const metadata = showcaseMetadata(
  'Экосистема образовательных модулей',
  'Teachly добавляет задания, AI-помощь, учебную аналитику и инструменты преподавателя в существующий образовательный продукт.',
  '/ecosystem',
);

export default function Page() {
  return <OverviewPage />;
}
