import { CapabilityPage } from '@/components/showcase/capabilities';
import { VariantsDemo } from '@/components/showcase/demos/variants-demo';
import { metadataForShowcaseRoute } from '@/lib/site';

export const metadata = metadataForShowcaseRoute('/variants');

export default function Page() {
  return <CapabilityPage capability="variants" demo={<VariantsDemo />} />;
}
