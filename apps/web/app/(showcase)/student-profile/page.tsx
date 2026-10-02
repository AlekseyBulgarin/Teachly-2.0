import { CapabilityPage } from '@/components/showcase/capabilities';
import { StudentProfileDemo } from '@/components/showcase/demos/student-profile-demo';
export default function Page() { return <CapabilityPage capability="student-profile" demo={<StudentProfileDemo />} />; }
