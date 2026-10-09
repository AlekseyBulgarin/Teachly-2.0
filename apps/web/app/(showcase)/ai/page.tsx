import { AiPage } from '@/components/showcase/ai';
import { metadataForShowcaseRoute } from '@/lib/site';

export const metadata = metadataForShowcaseRoute('/ai');

export default function Page() {
  return <AiPage />;
}
