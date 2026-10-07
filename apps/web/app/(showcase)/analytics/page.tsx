import { AnalyticsPage } from '@/components/showcase/analytics';
import { showcaseMetadata } from '@/lib/site';

export const metadata = showcaseMetadata(
  'Учебная аналитика',
  'Понятная картина прогресса, пробелов и активности для руководителя образовательного продукта.',
  '/analytics',
);

export default function Page() {
  return <AnalyticsPage />;
}
