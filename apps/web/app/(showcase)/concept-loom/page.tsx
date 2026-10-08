import { ConceptLoomPage } from '@/components/showcase/concept-loom';
import { showcaseMetadata } from '@/lib/site';

export const metadata = showcaseMetadata(
  'Карта понимания Concept Loom',
  'Интерактивный прототип Teachly: цель, граница знаний, короткий учебный маршрут и проверка понимания без подсказки ответа.',
  '/concept-loom',
);

export default function Page() {
  return <ConceptLoomPage />;
}
