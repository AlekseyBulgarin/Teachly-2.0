import { CapabilityPage } from '@/components/showcase/capabilities';
import { TheoryDemo } from '@/components/showcase/demos/theory-demo';
import { metadataForShowcaseRoute } from '@/lib/site';

export const metadata = metadataForShowcaseRoute('/theory');

export default function Page() { return <CapabilityPage capability="theory" demo={<TheoryDemo />} />; }
