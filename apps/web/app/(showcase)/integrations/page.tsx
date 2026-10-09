import { IntegrationsPage } from '@/components/showcase/integrations';
import { metadataForShowcaseRoute } from '@/lib/site';

export const metadata = metadataForShowcaseRoute('/integrations');

export default function Page() {
  return <IntegrationsPage />;
}
