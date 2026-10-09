import { KnowledgePage } from '@/components/showcase/knowledge';
import { metadataForShowcaseRoute } from '@/lib/site';

export const metadata = metadataForShowcaseRoute('/knowledge');

export default function Page() {
  return <KnowledgePage />;
}
