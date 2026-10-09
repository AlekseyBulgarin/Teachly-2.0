import { ConceptLoomPage } from '@/components/showcase/concept-loom';
import { metadataForShowcaseRoute } from '@/lib/site';

export const metadata = metadataForShowcaseRoute('/concept-loom');

export default function Page() {
  return <ConceptLoomPage />;
}
