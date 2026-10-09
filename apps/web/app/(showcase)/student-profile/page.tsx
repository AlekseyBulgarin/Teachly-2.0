import { CapabilityPage } from '@/components/showcase/capabilities';
import { StudentProfileDemo } from '@/components/showcase/demos/student-profile-demo';
import { metadataForShowcaseRoute } from '@/lib/site';

export const metadata = metadataForShowcaseRoute('/student-profile');

export default function Page() { return <CapabilityPage capability="student-profile" demo={<StudentProfileDemo />} />; }
