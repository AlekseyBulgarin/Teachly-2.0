import { CapabilityPage } from '@/components/showcase/capabilities';
import { TasksDemo } from '@/components/showcase/demos/tasks-demo';
export default function Page() { return <CapabilityPage capability="tasks" demo={<TasksDemo />} />; }
