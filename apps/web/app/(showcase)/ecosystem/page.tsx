import { OverviewPage } from '@/components/showcase/overview';
import { metadataForShowcaseRoute } from '@/lib/site';

export const metadata = metadataForShowcaseRoute('/ecosystem');

export default function Page() {
  return <OverviewPage />;
}
