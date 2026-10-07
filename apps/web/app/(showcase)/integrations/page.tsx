import { IntegrationsPage } from '@/components/showcase/integrations';
import { showcaseMetadata } from '@/lib/site';

export const metadata = showcaseMetadata(
  'Интеграция Teachly',
  'Подключите образовательные модули Teachly к существующей платформе через стабильный API.',
  '/integrations',
);

export default function Page() {
  return <IntegrationsPage />;
}
