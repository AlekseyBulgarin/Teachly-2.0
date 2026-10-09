import { CapabilityPage } from '@/components/showcase/capabilities';
import { ProgressDemo } from '@/components/showcase/demos/progress-demo';
import { metadataForShowcaseRoute } from '@/lib/site';

export const metadata = metadataForShowcaseRoute('/progress');

export default function Page() { return <CapabilityPage capability="progress" demo={<ProgressDemo />} />; }
