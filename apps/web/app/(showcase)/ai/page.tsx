import { AiPage } from '@/components/showcase/ai';
import { showcaseMetadata } from '@/lib/site';

export const metadata = showcaseMetadata(
  'Образовательный AI',
  'Контекстная AI-помощь ученику на основе задания, результата и проверенных учебных материалов.',
  '/ai',
);

export default function Page() {
  return <AiPage />;
}
