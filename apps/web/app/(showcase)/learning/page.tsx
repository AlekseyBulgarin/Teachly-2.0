import { LearningPage } from '@/components/showcase/learning';
import { metadataForShowcaseRoute } from '@/lib/site';

export const metadata = metadataForShowcaseRoute('/learning');

export default function Page() {
  return <LearningPage />;
}
