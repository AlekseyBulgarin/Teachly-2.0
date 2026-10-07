import { CapabilityPage } from '@/components/showcase/capabilities';
import { VariantsDemo } from '@/components/showcase/demos/variants-demo';
import { showcaseMetadata } from '@/lib/site';

export const metadata = showcaseMetadata(
  'Варианты учебных заданий',
  'Управляемые наборы практики для разных групп и учебных сценариев.',
  '/variants',
);

export default function Page() {
  return <CapabilityPage capability="variants" demo={<VariantsDemo />} />;
}
