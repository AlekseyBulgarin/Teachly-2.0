import { TeacherPage } from '@/components/showcase/teacher';
import { showcaseMetadata } from '@/lib/site';

export const metadata = showcaseMetadata(
  'Аналитика преподавателя',
  'Показывает, каким ученикам и темам нужна поддержка и на каких учебных сигналах основан вывод.',
  '/teacher',
);

export default function Page() {
  return <TeacherPage />;
}
