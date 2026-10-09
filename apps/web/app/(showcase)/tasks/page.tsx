import { CapabilityPage } from '@/components/showcase/capabilities';
import { TasksDemo } from '@/components/showcase/demos/tasks-demo';
import { metadataForShowcaseRoute } from '@/lib/site';

export const metadata = metadataForShowcaseRoute('/tasks');

export default function Page() { return <CapabilityPage capability="tasks" demo={<TasksDemo />} />; }
