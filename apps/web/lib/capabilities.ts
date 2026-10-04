import type { Locale } from "@/lib/i18n";

export type CapabilityStatus = "LIVE" | "COMING NEXT" | "PLANNED";
export type CapabilityNavGroup =
  | "overview"
  | "learning"
  | "intelligence"
  | "connection";
export type CapabilityKey =
  | "ecosystem"
  | "platform"
  | "tasks"
  | "variants"
  | "theory"
  | "trainer"
  | "whiteboard"
  | "learning"
  | "ai"
  | "student-profile"
  | "progress"
  | "teacher"
  | "analytics"
  | "knowledge"
  | "integrations";
export type CapabilityPageKey =
  | "tasks"
  | "variants"
  | "theory"
  | "trainer"
  | "whiteboard"
  | "student-profile"
  | "progress";

type LocalizedText = Record<Locale, string>;

export type CapabilityDefinition = {
  key: CapabilityKey;
  path: `/${string}`;
  navGroup: CapabilityNavGroup;
  label: LocalizedText;
  detail: LocalizedText;
  productStatus: CapabilityStatus;
  demoStatus: CapabilityStatus;
  dependencies: readonly CapabilityKey[];
  next: CapabilityKey | null;
};

export const capabilityRegistry = {
  ecosystem: {
    key: "ecosystem",
    path: "/ecosystem",
    navGroup: "overview",
    label: { ru: "Главная", en: "Home" },
    detail: { ru: "Экосистема Teachly", en: "Teachly ecosystem" },
    productStatus: "LIVE",
    demoStatus: "LIVE",
    dependencies: [],
    next: "platform",
  },
  platform: {
    key: "platform",
    path: "/platform",
    navGroup: "overview",
    label: { ru: "Платформа", en: "Platform" },
    detail: { ru: "Единое ядро", en: "One core" },
    productStatus: "LIVE",
    demoStatus: "LIVE",
    dependencies: [],
    next: "tasks",
  },
  tasks: {
    key: "tasks",
    path: "/tasks",
    navGroup: "learning",
    label: { ru: "База заданий", en: "Task bank" },
    detail: { ru: "Основа практики", en: "Practice foundation" },
    productStatus: "LIVE",
    demoStatus: "LIVE",
    dependencies: ["platform"],
    next: "theory",
  },
  variants: {
    key: "variants",
    path: "/variants",
    navGroup: "learning",
    label: { ru: "Варианты", en: "Variants" },
    detail: { ru: "Гибкие сценарии", en: "Flexible scenarios" },
    productStatus: "LIVE",
    demoStatus: "COMING NEXT",
    dependencies: ["tasks"],
    next: "progress",
  },
  theory: {
    key: "theory",
    path: "/theory",
    navGroup: "learning",
    label: { ru: "Теория", en: "Theory" },
    detail: { ru: "Понятный контекст", en: "Clear context" },
    productStatus: "LIVE",
    demoStatus: "LIVE",
    dependencies: ["platform"],
    next: "ai",
  },
  trainer: {
    key: "trainer",
    path: "/trainer",
    navGroup: "learning",
    label: { ru: "Тренажёр", en: "Trainer" },
    detail: { ru: "Практика и поддержка", en: "Practice and support" },
    productStatus: "LIVE",
    demoStatus: "LIVE",
    dependencies: ["tasks", "theory"],
    next: "progress",
  },
  whiteboard: {
    key: "whiteboard",
    path: "/whiteboard",
    navGroup: "learning",
    label: { ru: "Онлайн-доска", en: "Whiteboard" },
    detail: { ru: "Визуальная работа", en: "Visual workspace" },
    productStatus: "LIVE",
    demoStatus: "LIVE",
    dependencies: ["platform"],
    next: "platform",
  },
  learning: {
    key: "learning",
    path: "/learning",
    navGroup: "intelligence",
    label: { ru: "Интеллект обучения", en: "Learning intelligence" },
    detail: { ru: "Прогресс и пробелы", en: "Progress and gaps" },
    productStatus: "LIVE",
    demoStatus: "COMING NEXT",
    dependencies: ["progress"],
    next: "ai",
  },
  ai: {
    key: "ai",
    path: "/ai",
    navGroup: "intelligence",
    label: { ru: "Образовательный AI", en: "Educational AI" },
    detail: { ru: "Помощь по контексту", en: "Contextual assistance" },
    productStatus: "COMING NEXT",
    demoStatus: "COMING NEXT",
    dependencies: ["theory", "knowledge", "progress"],
    next: "student-profile",
  },
  "student-profile": {
    key: "student-profile",
    path: "/student-profile",
    navGroup: "intelligence",
    label: { ru: "Профиль ученика", en: "Learner profile" },
    detail: { ru: "Целостная картина", en: "A connected picture" },
    productStatus: "LIVE",
    demoStatus: "LIVE",
    dependencies: ["platform"],
    next: "progress",
  },
  progress: {
    key: "progress",
    path: "/progress",
    navGroup: "intelligence",
    label: { ru: "Прогресс", en: "Progress" },
    detail: { ru: "Движение в обучении", en: "Learning movement" },
    productStatus: "LIVE",
    demoStatus: "LIVE",
    dependencies: ["tasks"],
    next: "ai",
  },
  teacher: {
    key: "teacher",
    path: "/teacher",
    navGroup: "intelligence",
    label: { ru: "Для преподавателя", en: "Teacher view" },
    detail: { ru: "Ученики, темы и сигналы", en: "Learners, topics and signals" },
    productStatus: "COMING NEXT",
    demoStatus: "COMING NEXT",
    dependencies: ["progress", "learning"],
    next: "analytics",
  },
  analytics: {
    key: "analytics",
    path: "/analytics",
    navGroup: "intelligence",
    label: { ru: "Аналитика", en: "Analytics" },
    detail: { ru: "Учебная картина для команды", en: "Learning picture for teams" },
    productStatus: "PLANNED",
    demoStatus: "PLANNED",
    dependencies: ["progress", "teacher"],
    next: "ecosystem",
  },
  knowledge: {
    key: "knowledge",
    path: "/knowledge",
    navGroup: "connection",
    label: { ru: "Знания", en: "Knowledge" },
    detail: { ru: "Проверенные материалы", en: "Approved materials" },
    productStatus: "LIVE",
    demoStatus: "COMING NEXT",
    dependencies: ["platform"],
    next: "ai",
  },
  integrations: {
    key: "integrations",
    path: "/integrations",
    navGroup: "connection",
    label: { ru: "Интеграции", en: "Integrations" },
    detail: { ru: "Ваша платформа + Teachly", en: "Your platform + Teachly" },
    productStatus: "LIVE",
    demoStatus: "COMING NEXT",
    dependencies: ["platform"],
    next: "ecosystem",
  },
} as const satisfies Record<CapabilityKey, CapabilityDefinition>;

export const capabilityNavigationGroups = [
  {
    key: "overview",
    label: { ru: "Обзор", en: "Overview" },
    items: ["ecosystem", "platform"],
  },
  {
    key: "learning",
    label: { ru: "Обучение", en: "Learning" },
    items: ["tasks", "variants", "theory", "trainer", "whiteboard"],
  },
  {
    key: "intelligence",
    label: { ru: "Интеллект", en: "Intelligence" },
    items: ["ai", "student-profile", "progress", "teacher", "analytics"],
  },
  {
    key: "connection",
    label: { ru: "Подключение", en: "Connection" },
    items: ["knowledge", "integrations"],
  },
] as const satisfies readonly {
  key: CapabilityNavGroup;
  label: LocalizedText;
  items: readonly CapabilityKey[];
}[];

export const capabilityKeys = Object.keys(capabilityRegistry) as CapabilityKey[];

export const liveShowcaseRoutes = capabilityKeys
  .map((key) => capabilityRegistry[key])
  .filter((capability) => capability.demoStatus === "LIVE")
  .map((capability) => capability.path);

export function getCapability(key: CapabilityKey): CapabilityDefinition {
  return capabilityRegistry[key];
}
