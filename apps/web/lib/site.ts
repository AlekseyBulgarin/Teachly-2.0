import type { Metadata } from 'next';

export const siteUrl = new URL(process.env.TEACHLY_SITE_URL ?? 'https://teachly-tau.vercel.app');

export const showcaseRoutes = [
  '/ecosystem', '/platform', '/tasks', '/variants', '/theory', '/trainer', '/whiteboard',
  '/learning', '/ai', '/student-profile', '/progress', '/teacher', '/analytics', '/knowledge', '/integrations',
  '/concept-loom',
] as const;

export type ShowcaseRoute = (typeof showcaseRoutes)[number];

type ShowcaseMetadataDefinition = {
  title: string;
  description: string;
};

export const showcaseMetadataCatalog = {
  '/ecosystem': {
    title: 'Teachly Ecosystem — образовательные модули для бизнеса',
    description: 'Teachly Ecosystem добавляет задания, AI-помощь, учебную аналитику и инструменты преподавателя в существующий образовательный продукт.',
  },
  '/platform': {
    title: 'Teachly Core для образовательного продукта',
    description: 'Единое интеграционное ядро связывает пользователей, учебный контекст и модули Teachly без замены вашей платформы.',
  },
  '/tasks': {
    title: 'База учебных заданий',
    description: 'Версионируемые задания, темы и навыки как управляемая основа практики в вашем образовательном продукте.',
  },
  '/variants': {
    title: 'Варианты учебных заданий',
    description: 'Управляемые наборы практики для разных групп и учебных сценариев.',
  },
  '/theory': {
    title: 'Проверенные учебные материалы',
    description: 'Свяжите теорию с темами, навыками и заданиями, чтобы объяснения оставались внутри утверждённого учебного контекста.',
  },
  '/trainer': {
    title: 'Учебный тренажёр',
    description: 'Практика, проверка и следующий шаг объединены в один управляемый учебный сценарий.',
  },
  '/whiteboard': {
    title: 'Онлайн-доска для обучения',
    description: 'Визуальная работа с учебным материалом и серверное сохранение черновика внутри сценария Teachly.',
  },
  '/learning': {
    title: 'Интеллект обучения',
    description: 'Teachly превращает историю учебных действий в понятную картину прогресса, пробелов и следующего полезного шага.',
  },
  '/concept-loom': {
    title: 'Карта понимания Concept Loom',
    description: 'Интерактивный прототип Teachly: цель, граница знаний, короткий учебный маршрут и проверка понимания без подсказки ответа.',
  },
  '/ai': {
    title: 'Образовательный AI',
    description: 'Контекстная AI-помощь ученику на основе задания, результата и проверенных учебных материалов.',
  },
  '/student-profile': {
    title: 'Профиль ученика',
    description: 'Единая картина активности, навыков, прогресса и учебных сигналов ученика для вашего продукта.',
  },
  '/progress': {
    title: 'Прогресс и пробелы ученика',
    description: 'Детерминированная аналитика прогресса по навыкам, темам, курсам и предметам на основе реальных учебных результатов.',
  },
  '/teacher': {
    title: 'Аналитика преподавателя',
    description: 'Показывает, каким ученикам и темам нужна поддержка и на каких учебных сигналах основан вывод.',
  },
  '/analytics': {
    title: 'Учебная аналитика',
    description: 'Понятная картина прогресса, пробелов и активности для руководителя образовательного продукта.',
  },
  '/knowledge': {
    title: 'Управляемая база знаний',
    description: 'Teachly даёт AI доступ только к проверенным учебным материалам с контролируемыми версиями и разрешениями.',
  },
  '/integrations': {
    title: 'Интеграция Teachly',
    description: 'Подключите образовательные модули Teachly к существующей платформе через стабильный API.',
  },
} as const satisfies Record<ShowcaseRoute, ShowcaseMetadataDefinition>;

export function metadataForShowcaseRoute(path: ShowcaseRoute): Metadata {
  const { title, description } = showcaseMetadataCatalog[path];
  return {
    title: path === '/ecosystem' ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, type: 'website', siteName: 'Teachly Ecosystem' },
    twitter: { card: 'summary', title, description },
  };
}
