import { TeacherPage } from '@/components/showcase/teacher';
import { metadataForShowcaseRoute } from '@/lib/site';

export const metadata = metadataForShowcaseRoute('/teacher');

export default function Page() {
  return <TeacherPage />;
}
