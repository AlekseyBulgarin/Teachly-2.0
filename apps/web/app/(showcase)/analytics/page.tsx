import { AnalyticsPage } from '@/components/showcase/analytics';
import { metadataForShowcaseRoute } from '@/lib/site';

export const metadata = metadataForShowcaseRoute('/analytics');

export default function Page() {
  return <AnalyticsPage />;
}
