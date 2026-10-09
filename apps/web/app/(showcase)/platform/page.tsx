import { PlatformPage } from '@/components/showcase/platform';
import { metadataForShowcaseRoute } from '@/lib/site';

export const metadata = metadataForShowcaseRoute('/platform');

export default function Page() {
  return <PlatformPage />;
}
