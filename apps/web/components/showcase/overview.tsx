"use client";

import Link from "next/link";
import {
  Activity,
  AppWindow,
  ArrowRight,
  BarChart3,
  BookOpen,
  BrainCircuit,
  Building2,
  GraduationCap,
  Layers3,
  Link2,
  ListChecks,
  Mail,
  MessageCircle,
  Network,
  PanelsTopLeft,
  Phone,
  Sparkles,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { useEcosystem } from "@/lib/ecosystem-context";
import { StatusBadge } from "@/components/ui";

type ModuleGroup = "learning" | "intelligence" | "connection";
type ProductModule = {
  path: string;
  icon: LucideIcon;
  group: ModuleGroup;
  status: "LIVE" | "COMING NEXT" | "PLANNED";
  ru: [string, string, string];
  en: [string, string, string];
};

const modules: ProductModule[] = [
  {
    path: "/tasks",
    group: "learning",
    icon: ListChecks,
    status: "LIVE",
    ru: [
      "База заданий",
      "Практика, связанная с учебным контекстом.",
      "Создаёт основу для прогресса, AI и поддержки преподавателя.",
    ],
    en: [
      "Task bank",
      "Practice connected to learning context.",
      "Creates the foundation for progress, AI and teacher support.",
    ],
  },
  {
    path: "/variants",
    group: "learning",
    icon: PanelsTopLeft,
    status: "PLANNED",
    ru: [
      "Варианты",
      "Гибкие сценарии для разных групп и целей.",
      "Помогают расширять практику без разрыва общей логики продукта.",
    ],
    en: [
      "Variants",
      "Flexible scenarios for different groups and goals.",
      "Expand practice without breaking the product’s learning logic.",
    ],
  },
  {
    path: "/theory",
    group: "learning",
    icon: BookOpen,
    status: "LIVE",
    ru: [
      "Теория",
      "Проверенный материал рядом с практикой.",
      "Даёт ученику и AI понятную образовательную опору.",
    ],
    en: [
      "Theory",
      "Approved learning material next to practice.",
      "Gives learners and AI a clear educational foundation.",
    ],
  },
  {
    path: "/trainer",
    group: "learning",
    icon: GraduationCap,
    status: "LIVE",
    ru: [
      "Тренажёр",
      "Самостоятельная практика с понятным следующим шагом.",
      "Связывает попытки, помощь и движение ученика.",
    ],
    en: [
      "Trainer",
      "Independent practice with a clear next step.",
      "Connects attempts, support and learner movement.",
    ],
  },
  {
    path: "/whiteboard",
    group: "learning",
    icon: PanelsTopLeft,
    status: "LIVE",
    ru: [
      "Онлайн-доска",
      "Наглядная работа вокруг учебной задачи.",
      "Поддерживает визуальное объяснение; совместное редактирование запланировано.",
    ],
    en: [
      "Whiteboard",
      "Visual work around a learning task.",
      "Supports visual explanation; real-time collaboration is planned.",
    ],
  },
  {
    path: "/ai",
    group: "intelligence",
    icon: BrainCircuit,
    status: "LIVE",
    ru: [
      "AI",
      "Помощь, которая понимает учебную ситуацию.",
      "Объясняет ошибки и использует проверенный контекст.",
    ],
    en: [
      "AI",
      "Assistance that understands the learning situation.",
      "Explains mistakes using controlled learning context.",
    ],
  },
  {
    path: "/student-profile",
    group: "intelligence",
    icon: UserRound,
    status: "LIVE",
    ru: [
      "Профиль ученика",
      "Одна картина вместо разрозненных событий.",
      "Помогает преподавателю и команде быстрее понять ситуацию.",
    ],
    en: [
      "Learner profile",
      "One picture instead of scattered events.",
      "Helps teachers and teams understand the situation sooner.",
    ],
  },
  {
    path: "/progress",
    group: "intelligence",
    icon: Activity,
    status: "LIVE",
    ru: [
      "Прогресс",
      "Движение ученика, а не только последний балл.",
      "Показывает сильные стороны, пробелы и точки поддержки.",
    ],
    en: [
      "Progress",
      "Learner movement, not only the latest score.",
      "Shows strengths, gaps and useful support moments.",
    ],
  },
  {
    path: "/analytics",
    group: "intelligence",
    icon: BarChart3,
    status: "PLANNED",
    ru: [
      "Аналитика",
      "Понятные сигналы для команды и руководителя.",
      "Соединяет учебную картину с развитием продукта.",
    ],
    en: [
      "Analytics",
      "Clear signals for teams and leaders.",
      "Connects the learning picture to product development.",
    ],
  },
  {
    path: "/integrations",
    group: "connection",
    icon: Network,
    status: "LIVE",
    ru: [
      "Интеграции",
      "Teachly внутри продукта, который уже работает.",
      "Одно подключение открывает путь к связанным модулям.",
    ],
    en: [
      "Integrations",
      "Teachly inside the product you already run.",
      "One connection opens the path to connected modules.",
    ],
  },
];

const copy = {
  ru: {
    eyebrow: "Teachly для образовательного бизнеса",
    title: "Teachly усиливает вашу образовательную платформу.",
    description:
      "Ваши пользователи, курсы и продукт остаются вашими. Teachly добавляет связанные учебные модули и понятный интеллект поверх привычного опыта.",
    primary: "Обсудить интеграцию",
    secondary: "Посмотреть возможности",
    audience: "Онлайн-школы · LMS · EdTech-продукты",
    promise: [
      "Единое ядро",
      "Связанные образовательные модули",
      "Одна интеграция",
    ],
    howEyebrow: "Как работает Teachly",
    howTitle: "От подключения к полезному учебному сценарию",
    howDetail:
      "Ваша платформа остаётся главным продуктом. Teachly добавляет связанный образовательный слой.",
    steps: [
      [
        "01",
        "Подключаете свою платформу",
        "Пользователи, курсы и привычный интерфейс остаются у вас.",
      ],
      [
        "02",
        "Teachly объединяет учебный контекст",
        "Задания, попытки, материалы и прогресс становятся связанной картиной.",
      ],
      [
        "03",
        "Команда получает связанные инструменты",
        "Ученики, преподаватели и бизнес используют один образовательный контекст.",
      ],
    ],
    modulesEyebrow: "Возможности",
    modulesTitle: "Подключайте нужные модули постепенно",
    modulesDetail:
      "Начните с одной бизнес-задачи. Следующие модули используют то же ядро и тот же учебный контекст.",
    explore: "Посмотреть модуль",
    ecosystemEyebrow: "Почему одна экосистема",
    ecosystemTitle: "Каждое учебное действие делает следующий шаг точнее",
    ecosystemDetail:
      "Teachly не собирает набор несвязанных функций. Контекст проходит через весь путь ученика и помогает следующим модулям работать осмысленно.",
    chain: [
      "Задание",
      "Попытка",
      "Результат",
      "Прогресс",
      "AI-контекст",
      "Сигнал преподавателю",
      "Следующая активность",
    ],
    aiEyebrow: "Единый AI-слой",
    aiTitle: "Один AI-контекст — три понятных результата",
    aiDetail:
      "AI встроен в учебный процесс и опирается на задачу, результат и доступные материалы.",
    aiCards: [
      ["Ученику", "Объясняет ошибку и даёт уместную подсказку."],
      [
        "Преподавателю",
        "Подсвечивает повторяющиеся трудности и точки внимания.",
      ],
      [
        "Организации",
        "Сохраняет управляемость AI и создаёт основу для развития рекомендаций.",
      ],
    ],
    integrationEyebrow: "Подключение",
    integrationTitle: "Не заменяет вашу платформу. Усиливает её.",
    integrationDetail:
      "Подключите первый нужный модуль, проверьте сценарий и расширяйте Teachly, когда это действительно нужно продукту.",
    integrationFlow: [
      "Ваш продукт",
      "API-интеграция",
      "Teachly Core",
      "Нужные модули",
    ],
    integrationAction: "Как устроена интеграция",
    contactEyebrow: "Контакт",
    contactTitle: "Обсудим, с какого модуля начать",
    contactDetail:
      "Можно обсудить пилот, формат интеграции и первый модуль, который соответствует вашей задаче.",
    contactAction: "Обсудить интеграцию",
    telegram: "Telegram",
    phone: "Телефон",
    email: "Корпоративная почта",
  },
  en: {
    eyebrow: "Teachly for education businesses",
    title: "Make your education platform stronger.",
    description:
      "Your users, courses and product remain yours. Teachly adds connected learning modules and useful intelligence to the experience people already know.",
    primary: "Discuss integration",
    secondary: "Explore capabilities",
    audience: "Online schools · LMS · EdTech products",
    promise: ["One core", "Connected education modules", "One integration"],
    howEyebrow: "How Teachly works",
    howTitle: "From connection to a useful learning scenario",
    howDetail:
      "Your platform remains the primary product. Teachly adds a connected educational layer.",
    steps: [
      [
        "01",
        "Connect your platform",
        "Users, courses and the familiar interface stay with you.",
      ],
      [
        "02",
        "Teachly connects learning context",
        "Tasks, attempts, material and progress become one picture.",
      ],
      [
        "03",
        "Your team gets connected tools",
        "Learners, teachers and the business use one learning context.",
      ],
    ],
    modulesEyebrow: "Capabilities",
    modulesTitle: "Enable the modules you need, step by step",
    modulesDetail:
      "Start with one business need. The next modules use the same core and learning context.",
    explore: "Explore module",
    ecosystemEyebrow: "Why one ecosystem",
    ecosystemTitle: "Every learning action makes the next step more useful",
    ecosystemDetail:
      "Teachly is not a collection of disconnected features. Context moves through the learner journey and helps each next module work with purpose.",
    chain: [
      "Task",
      "Attempt",
      "Result",
      "Progress",
      "AI context",
      "Teacher signal",
      "Next activity",
    ],
    aiEyebrow: "One AI layer",
    aiTitle: "One AI context, three clear outcomes",
    aiDetail:
      "AI sits inside the learning process and uses the task, result and available material.",
    aiCards: [
      ["For learners", "Explains a mistake and gives a relevant hint."],
      [
        "For teachers",
        "Highlights repeated difficulty and useful attention signals.",
      ],
      [
        "For the organization",
        "Keeps AI manageable and creates a foundation for future recommendations.",
      ],
    ],
    integrationEyebrow: "Connection",
    integrationTitle: "It does not replace your platform. It strengthens it.",
    integrationDetail:
      "Connect the first useful module, validate the scenario and expand Teachly when the product needs it.",
    integrationFlow: [
      "Your product",
      "API integration",
      "Teachly Core",
      "The modules you need",
    ],
    integrationAction: "How integration works",
    contactEyebrow: "Contact",
    contactTitle: "Let’s discuss the right first module",
    contactDetail:
      "Discuss a pilot, the integration approach and the first module that fits your current need.",
    contactAction: "Discuss integration",
    telegram: "Telegram",
    phone: "Phone",
    email: "Corporate email",
  },
} as const;

export function OverviewPage() {
  const { locale } = useEcosystem();
  const c = copy[locale];
  const [moduleGroup, setModuleGroup] = useState<ModuleGroup>("learning");
  return (
    <div className="flex flex-col gap-24 pb-4 lg:gap-32">
      <section className="grid min-h-[650px] items-center gap-12 py-4 lg:grid-cols-[1.15fr_.85fr] lg:py-10">
        <div className="max-w-4xl">
          <p className="text-[11px] font-bold uppercase tracking-[.23em] text-emerald-300">
            {c.eyebrow}
          </p>
          <h1 className="mt-6 text-[clamp(2.65rem,5vw,5.15rem)] font-semibold leading-[1.02] tracking-[-.055em] text-slate-50">
            {c.title}
          </h1>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">
            {c.description}
          </p>
          <p className="mt-5 text-sm font-medium text-slate-500">
            {c.audience}
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href="#contact"
              className="interactive inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--green)] px-6 py-4 text-sm font-semibold text-slate-950 shadow-[0_18px_50px_-22px_rgba(25,201,139,.8)] hover:-translate-y-0.5 hover:bg-[var(--green-accent)]"
            >
              {c.primary}
              <MessageCircle aria-hidden="true" size={17} />
            </a>
            <a
              href="#modules"
              className="interactive inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] bg-white/[.035] px-6 py-4 text-sm font-semibold text-slate-100 hover:-translate-y-0.5 hover:bg-white/[.075]"
            >
              {c.secondary}
              <ArrowRight aria-hidden="true" size={17} />
            </a>
          </div>
          <ContactActions locale={locale} compact />
        </div>
        <div className="section-reveal relative overflow-hidden rounded-[32px] border border-emerald-300/15 bg-[linear-gradient(145deg,rgba(25,201,139,.12),transparent_55%),var(--surface)] p-7 shadow-[0_36px_120px_-55px_rgba(25,201,139,.45)] sm:p-9">
          <div className="absolute -right-16 -top-20 size-56 rounded-full bg-emerald-300/[.08] blur-3xl" />
          <span className="relative flex size-12 items-center justify-center rounded-2xl bg-emerald-300/10 text-emerald-200">
            <Layers3 aria-hidden="true" size={23} />
          </span>
          <div className="relative mt-8 space-y-5">
            {c.promise.map((item) => (
              <div key={item} className="flex items-center gap-4">
                <p className="text-xl font-semibold tracking-[-.02em] text-slate-100 sm:text-2xl">
                  {item}
                </p>
              </div>
            ))}
          </div>
          <p className="relative mt-8 text-sm leading-7 text-slate-400">
            {c.howDetail}
          </p>
        </div>
      </section>
      <section className="section-reveal">
        <SectionHeading
          eyebrow={c.howEyebrow}
          title={c.howTitle}
          detail={c.howDetail}
        />
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {c.steps.map(([, title, detail], index) => (
            <div
              key={title}
              className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-white/[.05] text-emerald-200">
                  {index === 0 ? (
                    <Network aria-hidden="true" size={20} />
                  ) : index === 1 ? (
                    <Layers3 aria-hidden="true" size={20} />
                  ) : (
                    <UsersRound aria-hidden="true" size={20} />
                  )}
                </span>
              </div>
              <h3 className="mt-8 text-xl font-semibold text-slate-100">
                {title}
              </h3>
              <p className="mt-3 text-[15px] leading-7 text-slate-400">
                {detail}
              </p>
            </div>
          ))}
        </div>
      </section>
      <section id="modules" className="section-reveal scroll-mt-28">
        <SectionHeading
          eyebrow={c.modulesEyebrow}
          title={c.modulesTitle}
          detail={c.modulesDetail}
        />
        <ModuleShowcase
          locale={locale}
          explore={c.explore}
          active={moduleGroup}
          onChange={setModuleGroup}
        />
      </section>
      <section className="section-reveal overflow-hidden rounded-[34px] border border-[var(--border)] bg-[linear-gradient(130deg,rgba(125,182,255,.08),transparent_48%),var(--surface)] p-7 sm:p-10 lg:p-12">
        <SectionHeading
          eyebrow={c.ecosystemEyebrow}
          title={c.ecosystemTitle}
          detail={c.ecosystemDetail}
        />
        <InteractiveEcosystemFlow locale={locale} chain={c.chain} />
      </section>
      <section className="section-reveal">
        <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:items-start">
          <SectionHeading
            eyebrow={c.aiEyebrow}
            title={c.aiTitle}
            detail={c.aiDetail}
          />
          <div className="grid gap-4 md:grid-cols-3">
            {c.aiCards.map(([title, detail], index) => (
              <div
                key={title}
                className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7"
              >
                <span className="flex size-11 items-center justify-center rounded-2xl bg-white/[.05] text-emerald-200">
                  {index === 0 ? (
                    <UserRound aria-hidden="true" size={20} />
                  ) : index === 1 ? (
                    <GraduationCap aria-hidden="true" size={20} />
                  ) : (
                    <Building2 aria-hidden="true" size={20} />
                  )}
                </span>
                <h3 className="mt-7 text-lg font-semibold text-slate-100">
                  {title}
                </h3>
                <p className="mt-3 text-[15px] leading-7 text-slate-400">
                  {detail}
                </p>
              </div>
            ))}
          </div>
        </div>
        <Link
          href="/ai"
          className="interactive mt-8 inline-flex items-center gap-2 text-sm font-semibold text-emerald-200 hover:text-emerald-100"
        >
          {locale === "ru"
            ? "Посмотреть AI целиком"
            : "Explore the complete AI layer"}
          <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </section>
      <section className="section-reveal grid gap-8 rounded-[34px] border border-emerald-300/15 bg-emerald-300/[.045] p-7 sm:p-10 lg:grid-cols-[.85fr_1.15fr] lg:p-12">
        <div>
          <SectionHeading
            eyebrow={c.integrationEyebrow}
            title={c.integrationTitle}
            detail={c.integrationDetail}
          />
          <Link
            href="/integrations"
            className="interactive mt-8 inline-flex items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/[.07] px-5 py-3.5 text-sm font-semibold text-emerald-100 hover:bg-emerald-300/[.12]"
          >
            {c.integrationAction}
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
        <div className="grid content-center gap-3 sm:grid-cols-2">
          {c.integrationFlow.map((item, index) => (
            <div
              key={item}
              className="flex items-center gap-4 rounded-2xl border border-white/[.07] bg-black/15 p-5"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[.05] text-emerald-200">
                {index === 0 ? (
                  <AppWindow aria-hidden="true" size={18} />
                ) : index === 1 ? (
                  <Link2 aria-hidden="true" size={18} />
                ) : index === 2 ? (
                  <Layers3 aria-hidden="true" size={18} />
                ) : (
                  <PanelsTopLeft aria-hidden="true" size={18} />
                )}
              </span>
              <p className="font-semibold text-slate-200">{item}</p>
            </div>
          ))}
        </div>
      </section>
      <section
        id="contact"
        className="section-reveal scroll-mt-28 overflow-hidden rounded-[36px] border border-emerald-300/20 bg-[linear-gradient(125deg,rgba(25,201,139,.16),rgba(14,23,37,.92)_58%)] p-7 sm:p-10 lg:p-12"
      >
        <div className="grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.22em] text-emerald-200">
              {c.contactEyebrow}
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-.04em] text-slate-50 sm:text-4xl">
              {c.contactTitle}
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
              {c.contactDetail}
            </p>
            <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[.08] px-4 py-2 text-sm font-semibold text-emerald-100">
              <Sparkles aria-hidden="true" size={15} />
              {c.contactAction}
            </p>
          </div>
          <ContactActions locale={locale} />
        </div>
      </section>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  detail,
}: {
  eyebrow: string;
  title: string;
  detail: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-[11px] font-bold uppercase tracking-[.22em] text-emerald-300">
        {eyebrow}
      </p>
      <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-.04em] text-slate-50 sm:text-4xl">
        {title}
      </h2>
      <p className="mt-5 text-base leading-8 text-slate-400">{detail}</p>
    </div>
  );
}
function ProductCard({
  module,
  locale,
  explore,
}: {
  module: ProductModule;
  locale: "ru" | "en";
  explore: string;
}) {
  const [title, statement, benefit] = module[locale];
  const Icon = module.icon;
  return (
    <Link
      href={module.path}
      className="interactive group flex min-h-[280px] flex-col rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7 hover:-translate-y-1 hover:border-emerald-300/25 hover:bg-[var(--surface-raised)]"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-white/[.055] text-emerald-200">
          <Icon aria-hidden="true" size={22} />
        </span>
        <StatusBadge status={module.status} locale={locale} />
      </div>
      <h3 className="mt-7 text-xl font-semibold text-slate-100">{title}</h3>
      <p className="mt-3 text-base leading-7 text-slate-300">{statement}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{benefit}</p>
      <span className="mt-auto flex items-center gap-2 pt-7 text-sm font-semibold text-emerald-200">
        {explore}
        <ArrowRight
          aria-hidden="true"
          size={15}
          className="transition-transform group-hover:translate-x-1"
        />
      </span>
    </Link>
  );
}

function ModuleShowcase({
  locale,
  explore,
  active,
  onChange,
}: {
  locale: "ru" | "en";
  explore: string;
  active: ModuleGroup;
  onChange: (group: ModuleGroup) => void;
}) {
  const labels: Record<ModuleGroup, string> =
    locale === "ru"
      ? {
          learning: "Обучение",
          intelligence: "Интеллект",
          connection: "Подключение",
        }
      : {
          learning: "Learning",
          intelligence: "Intelligence",
          connection: "Connection",
        };
  const visible = modules.filter((module) => module.group === active);
  return (
    <div className="mt-10">
      <div
        role="tablist"
        aria-label={locale === "ru" ? "Группы модулей" : "Module groups"}
        className="flex overflow-x-auto pb-2 [scrollbar-width:thin]"
      >
        <div className="flex min-w-max gap-2 rounded-2xl border border-[var(--border)] bg-white/[.025] p-1.5">
          {(Object.keys(labels) as ModuleGroup[]).map((group) => (
            <button
              key={group}
              role="tab"
              aria-selected={active === group}
              onClick={() => onChange(group)}
              className={`interactive rounded-xl px-4 py-2.5 text-sm font-semibold transition ${active === group ? "bg-emerald-300/10 text-emerald-100" : "text-slate-400 hover:bg-white/[.055] hover:text-slate-200"}`}
            >
              {labels[group]}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((module) => (
          <ProductCard
            key={module.path}
            module={module}
            locale={locale}
            explore={explore}
          />
        ))}
      </div>
    </div>
  );
}

function InteractiveEcosystemFlow({
  locale,
  chain,
}: {
  locale: "ru" | "en";
  chain: readonly string[];
}) {
  const [active, setActive] = useState(0);
  const details =
    locale === "ru"
      ? [
          "Задание задаёт учебную цель и тему.",
          "Попытка показывает, как ученик работает с задачей.",
          "Результат становится понятным сигналом, а не отдельным баллом.",
          "Прогресс связывает результаты в картину движения ученика.",
          "AI получает только уместный учебный контекст.",
          "Преподаватель видит сигнал там, где нужна поддержка.",
          "Следующая активность опирается на уже пройденный путь.",
        ]
      : [
          "A task sets the learning goal and topic.",
          "An attempt shows how a learner works with the task.",
          "A result becomes a useful signal, not an isolated score.",
          "Progress connects results into a picture of learner movement.",
          "AI receives only the relevant learning context.",
          "A teacher sees a signal where support is useful.",
          "The next activity builds on the learner journey so far.",
        ];
  return (
    <div className="mt-10">
      <div
        role="tablist"
        aria-label={
          locale === "ru"
            ? "Этапы учебного контекста"
            : "Learning-context steps"
        }
        className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]"
      >
        {chain.map((item, index) => (
          <button
            key={item}
            role="tab"
            aria-selected={active === index}
            aria-controls="ecosystem-flow-detail"
            onClick={() => setActive(index)}
            className={`interactive shrink-0 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition ${active === index ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100" : "border-white/[.08] bg-white/[.025] text-slate-400 hover:border-white/[.16] hover:text-slate-200"}`}
          >
            {item}
          </button>
        ))}
      </div>
      <div
        id="ecosystem-flow-detail"
        role="tabpanel"
        className="mt-4 min-h-[104px] rounded-2xl border border-emerald-300/15 bg-emerald-300/[.045] p-5 sm:flex sm:items-center sm:justify-between sm:gap-8"
      >
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-emerald-200">
            {locale === "ru" ? "Шаг в экосистеме" : "Ecosystem step"}
          </p>
          <h3 className="mt-2 text-xl font-semibold text-slate-50">
            {chain[active]}
          </h3>
        </div>
        <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300 sm:mt-0">
          {details[active]}
        </p>
      </div>
    </div>
  );
}

function ContactActions({
  locale,
  compact = false,
}: {
  locale: "ru" | "en";
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const copyEmail = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText("teachly@yandex.ru");
      } else {
        const field = document.createElement("textarea");
        field.value = "teachly@yandex.ru";
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.append(field);
        field.select();
        document.execCommand("copy");
        field.remove();
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };
  const emailLabel = locale === "ru" ? "Почта" : "Email";
  return (
    <div className={`relative ${compact ? "mt-5" : ""}`}>
      <div className={`flex flex-wrap gap-2 ${compact ? "" : ""}`}>
        <a
          href="https://t.me/teachlyecosystem"
          target="_blank"
          rel="noreferrer"
          className="interactive inline-flex items-center gap-2 rounded-xl border border-white/[.1] bg-white/[.035] px-3.5 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/[.075]"
        >
          <MessageCircle aria-hidden="true" size={16} />
          Telegram
        </a>
        <a
          href="tel:+79923135778"
          className="interactive inline-flex items-center gap-2 rounded-xl border border-white/[.1] bg-white/[.035] px-3.5 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/[.075]"
        >
          <Phone aria-hidden="true" size={16} />
          +7 992 313-57-78
        </a>
        <button
          type="button"
          onClick={() => void copyEmail()}
          className="interactive inline-flex items-center gap-2 rounded-xl border border-white/[.1] bg-white/[.035] px-3.5 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/[.075]"
        >
          <Mail aria-hidden="true" size={16} />
          {emailLabel}
        </button>
      </div>
      {copied && (
        <p
          role="status"
          className="absolute left-0 top-full z-20 mt-2 rounded-lg border border-emerald-300/20 bg-slate-950 px-3 py-2 text-xs font-medium text-emerald-200 shadow-xl"
        >
          {locale === "ru" ? "Почта скопирована" : "Email copied"}
        </p>
      )}
    </div>
  );
}
