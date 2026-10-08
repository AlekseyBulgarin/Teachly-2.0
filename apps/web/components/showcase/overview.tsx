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
  CheckCircle2,
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
  Waypoints,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { useEcosystem } from "@/lib/ecosystem-context";
import { capabilityRegistry, type CapabilityKey } from "@/lib/capabilities";
import { StatusBadge } from "@/components/ui";
import { EcosystemCatalog } from "@/components/showcase/ecosystem-catalog";
import {
  AudienceAndComparison,
  BusinessProblemAndCore,
  IntegrationPilotAndTrust,
} from "@/components/showcase/overview-business";

type ModuleGroup = "learning" | "intelligence" | "connection";
type ProductModule = {
  key: CapabilityKey;
  icon: LucideIcon;
  group: ModuleGroup;
  ru: [string, string, string];
  en: [string, string, string];
};

const modules: ProductModule[] = [
  {
    key: "tasks",
    group: "learning",
    icon: ListChecks,
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
    key: "variants",
    group: "learning",
    icon: PanelsTopLeft,
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
    key: "theory",
    group: "learning",
    icon: BookOpen,
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
    key: "trainer",
    group: "learning",
    icon: GraduationCap,
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
    key: "whiteboard",
    group: "learning",
    icon: PanelsTopLeft,
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
    key: "concept-loom",
    group: "intelligence",
    icon: Waypoints,
    ru: [
      "Карта понимания",
      "Короткий маршрут от цели к подтверждённому пониманию.",
      "Находит границу знаний и предлагает следующий полезный шаг вместо длинного общего объяснения.",
    ],
    en: [
      "Understanding map",
      "A short route from a goal to evidenced understanding.",
      "Finds the knowledge frontier and proposes the next useful step instead of a broad explanation.",
    ],
  },
  {
    key: "ai",
    group: "intelligence",
    icon: BrainCircuit,
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
    key: "student-profile",
    group: "intelligence",
    icon: UserRound,
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
    key: "progress",
    group: "intelligence",
    icon: Activity,
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
    key: "analytics",
    group: "intelligence",
    icon: BarChart3,
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
    key: "integrations",
    group: "connection",
    icon: Network,
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
    eyebrow: "Teachly — образовательный слой для вашего продукта",
    title: "Развивайте образовательную платформу без месяцев собственной разработки.",
    description:
      "Teachly подключается к онлайн-школе, LMS или EdTech-продукту через единое ядро. Добавляйте задания, прогресс, AI и аналитику поэтапно — без миграции с вашей платформы.",
    primary: "Запросить демонстрацию",
    secondary: "Запустить пилот",
    tertiary: "Посмотреть возможности",
    audience: "Для владельцев онлайн-школ, LMS и EdTech-продуктов",
    pilotNote: "Начинаем с одного полезного сценария и проверяем его вместе с вашей командой.",
    trust: [
      "Ваш продукт остаётся главным",
      "Одна API-интеграция",
      "Модули подключаются поэтапно",
      "Данные и правила остаются на сервере",
    ],
    proofEyebrow: "Связанный учебный контекст",
    proofTitle: "Ошибка превращается в понятный следующий шаг",
    proofItems: [
      ["Задание и результат", "Teachly видит конкретную учебную ситуацию."],
      ["Прогресс и пробел", "Один ответ становится частью общей истории."],
      ["Сигнал преподавателю", "Команда понимает, где нужна поддержка."],
    ],
    proofCaption: "Практика → прогресс → поддержка",
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
      "Ученик",
      "Задание",
      "Попытка",
      "Результат",
      "Teachly Core",
      "Прогресс",
      "AI-контекст",
      "Преподаватель",
      "Аналитика",
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
      "Расскажите о продукте и ближайшей образовательной задаче. Вместе выберем первый модуль и понятный сценарий пилота.",
    contactAction: "Пилот без лишней перестройки",
    contactPoints: [
      "Выбираем одну задачу с понятной ценностью",
      "Согласуем точки подключения и границы пилота",
      "Проверяем сценарий на вашем продукте",
    ],
    telegram: "Telegram",
    phone: "Телефон",
    email: "Корпоративная почта",
  },
  en: {
    eyebrow: "Teachly — the education layer for your product",
    title: "Grow your education platform without months of in-house development.",
    description:
      "Teachly connects to an online school, LMS or EdTech product through one core. Add tasks, progress, AI and analytics step by step — without migrating away from your platform.",
    primary: "Request a demo",
    secondary: "Start a pilot",
    tertiary: "Explore capabilities",
    audience: "For owners of online schools, LMS and EdTech products",
    pilotNote: "Start with one useful scenario and validate it together with your team.",
    trust: [
      "Your product stays primary",
      "One API integration",
      "Enable modules step by step",
      "Data and rules stay server-side",
    ],
    proofEyebrow: "Connected learning context",
    proofTitle: "A mistake becomes a clear next step",
    proofItems: [
      ["Task and result", "Teachly sees the exact learning situation."],
      ["Progress and gap", "One answer becomes part of the learning history."],
      ["Teacher signal", "The team sees where support is needed."],
    ],
    proofCaption: "Practice → progress → support",
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
      "Learner",
      "Task",
      "Attempt",
      "Result",
      "Teachly Core",
      "Progress",
      "AI context",
      "Teacher",
      "Analytics",
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
      "Tell us about your product and the next educational problem to solve. Together we will choose the first module and a clear pilot scenario.",
    contactAction: "A pilot without a platform rebuild",
    contactPoints: [
      "Choose one problem with clear value",
      "Agree on connection points and pilot boundaries",
      "Validate the scenario inside your product",
    ],
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
    <div className="flex flex-col gap-20 pb-4 lg:gap-28">
      <section className="shine-surface relative grid min-h-[600px] items-center gap-10 overflow-hidden rounded-[36px] border border-white/[.08] bg-[radial-gradient(circle_at_15%_15%,rgba(25,201,139,.13),transparent_32%),radial-gradient(circle_at_88%_70%,rgba(77,170,255,.09),transparent_34%),#090f19] p-6 shadow-[0_44px_140px_-70px_rgba(25,201,139,.5)] sm:p-10 lg:grid-cols-[.96fr_1.04fr] lg:p-12">
        <div className="hero-grid-motion pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.018)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent_88%)]" />
        <div className="relative max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[.23em] text-emerald-300">
            {c.eyebrow}
          </p>
          <h1 className="mt-5 text-[clamp(2.35rem,4.1vw,3.55rem)] font-semibold leading-[1.04] tracking-[-.052em] text-slate-50">
            {c.title}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
            {c.description}
          </p>
          <p className="mt-5 inline-flex rounded-full border border-white/[.09] bg-white/[.04] px-4 py-2 text-sm font-medium text-slate-300">
            {c.audience}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a
              href="#contact"
              className="cta-glow interactive inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--green)] px-6 py-4 text-sm font-semibold text-slate-950 shadow-[0_18px_50px_-22px_rgba(25,201,139,.8)] hover:-translate-y-0.5 hover:bg-[var(--green-accent)]"
            >
              {c.primary}
              <MessageCircle aria-hidden="true" size={17} />
            </a>
            <a
              href="#pilot"
              className="interactive inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] bg-white/[.035] px-6 py-4 text-sm font-semibold text-slate-100 hover:-translate-y-0.5 hover:bg-white/[.075]"
            >
              {c.secondary}
              <ArrowRight aria-hidden="true" size={17} />
            </a>
            <a
              href="#catalog"
              className="interactive inline-flex items-center justify-center px-3 py-4 text-sm font-semibold text-slate-300 hover:text-white"
            >
              {c.tertiary}
            </a>
          </div>
          <p className="mt-5 flex max-w-xl items-start gap-2 text-sm leading-6 text-slate-400">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0 text-emerald-300" size={17} />
            {c.pilotNote}
          </p>
        </div>
        <ProductProof
          locale={locale}
          eyebrow={c.proofEyebrow}
          title={c.proofTitle}
          items={c.proofItems}
          caption={c.proofCaption}
        />
      </section>

      <section aria-label={locale === "ru" ? "Принципы подключения" : "Connection principles"} className="grid overflow-hidden rounded-[28px] border border-[var(--border)] bg-white/[.025] sm:grid-cols-2 xl:grid-cols-4">
        {c.trust.map((item) => (
          <div key={item} className="group card-lift flex min-h-24 items-center gap-3 border-b border-[var(--border)] px-5 py-5 last:border-b-0 sm:[&:nth-child(odd)]:border-r sm:[&:nth-last-child(-n+2)]:border-b-0 xl:border-b-0 xl:border-r xl:last:border-r-0">
            <CheckCircle2 aria-hidden="true" className="motion-icon shrink-0 text-emerald-300" size={19} />
            <p className="text-sm font-semibold leading-6 text-slate-200">{item}</p>
          </div>
        ))}
      </section>

      <BusinessProblemAndCore locale={locale} />

      <section id="how" className="section-reveal scroll-mt-28">
        <SectionHeading
          eyebrow={c.howEyebrow}
          title={c.howTitle}
          detail={c.howDetail}
        />
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {c.steps.map(([step, title, detail], index) => (
            <div
              key={title}
              className="card-lift group relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[linear-gradient(150deg,rgba(255,255,255,.035),transparent_55%),var(--surface)] p-7 transition hover:border-emerald-300/20"
            >
              <div className="flex items-center justify-between">
                <span className="motion-icon flex size-11 items-center justify-center rounded-2xl bg-white/[.05] text-emerald-200">
                  {index === 0 ? (
                    <Network aria-hidden="true" size={20} />
                  ) : index === 1 ? (
                    <Layers3 aria-hidden="true" size={20} />
                  ) : (
                    <UsersRound aria-hidden="true" size={20} />
                  )}
                </span>
                <span className="text-3xl font-semibold tracking-[-.06em] text-white/[.09] transition group-hover:text-emerald-200/20">{step}</span>
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
        <div id="catalog" className="mt-16 scroll-mt-28 border-t border-white/[.08] pt-14">
          <SectionHeading
            eyebrow={locale === "ru" ? "Полная карта экосистемы" : "Complete ecosystem map"}
            title={locale === "ru" ? "Понимайте статус и ценность каждого модуля" : "Understand the status and value of every module"}
            detail={locale === "ru" ? "Выберите направление и откройте модуль: что он делает, кому помогает, какие данные использует и готов ли он к подключению." : "Choose an area and open a module to see what it does, who it helps, which data it uses and whether it is ready to connect."}
          />
          <EcosystemCatalog locale={locale} />
        </div>
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
                className="card-lift group rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7"
              >
                <span className="motion-icon flex size-11 items-center justify-center rounded-2xl bg-white/[.05] text-emerald-200">
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
      <AudienceAndComparison locale={locale} />
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
              className="card-lift group flex items-center gap-4 rounded-2xl border border-white/[.07] bg-black/15 p-5"
            >
              <span className="motion-icon flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[.05] text-emerald-200">
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
      <IntegrationPilotAndTrust locale={locale} />
      <section
        id="contact"
        className="section-reveal scroll-mt-28 overflow-hidden rounded-[36px] border border-emerald-300/20 bg-[linear-gradient(125deg,rgba(25,201,139,.16),rgba(14,23,37,.92)_58%)] p-7 sm:p-10 lg:p-12"
      >
        <div className="grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
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
          <div className="shine-surface relative overflow-hidden rounded-[28px] border border-white/[.09] bg-black/15 p-5 sm:p-7">
            <div className="space-y-4">
              {c.contactPoints.map((point) => (
                <div key={point} className="flex items-start gap-3">
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0 text-emerald-300" size={18} />
                  <p className="text-sm font-medium leading-6 text-slate-200">{point}</p>
                </div>
              ))}
            </div>
            <ContactActions locale={locale} />
          </div>
        </div>
      </section>
    </div>
  );
}

function ProductProof({
  locale,
  eyebrow,
  title,
  items,
  caption,
}: {
  locale: "ru" | "en";
  eyebrow: string;
  title: string;
  items: readonly (readonly [string, string])[];
  caption: string;
}) {
  const icons = [ListChecks, Activity, GraduationCap] as const;
  const capabilities = [
    capabilityRegistry.tasks,
    capabilityRegistry.progress,
    capabilityRegistry.teacher,
  ] as const;
  return (
    <div id="demo" className="shine-surface section-reveal relative overflow-hidden rounded-[30px] border border-white/[.1] bg-[#0b1420]/95 p-4 shadow-[0_34px_90px_-48px_rgba(77,170,255,.55)] sm:p-6">
      <div className="flex items-center justify-between border-b border-white/[.07] pb-4">
        <div className="flex items-center gap-2" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-rose-300/70" />
          <span className="size-2.5 rounded-full bg-amber-300/70" />
          <span className="status-blink size-2.5 rounded-full bg-emerald-300/70" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">
          Teachly / learning flow
        </span>
      </div>
      <div className="pt-6">
        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-emerald-300">{eyebrow}</p>
        <h2 className="mt-3 max-w-md text-2xl font-semibold leading-tight tracking-[-.035em] text-slate-50 sm:text-3xl">{title}</h2>
        <div className="mt-7 space-y-3">
          {items.map(([itemTitle, detail], index) => {
            const Icon = icons[index];
            const capability = capabilities[index];
            return (
              <div key={itemTitle} className="proof-step group flex gap-4 rounded-2xl border border-white/[.07] bg-white/[.025] p-4" style={{ animationDelay: `${index * 800}ms` }}>
                <span className="motion-icon flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-300/[.08] text-emerald-200">
                  <Icon aria-hidden="true" size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-slate-100">{itemTitle}</h3>
                    <StatusBadge status={capability.demoStatus} locale={locale} />
                  </div>
                  <p className="mt-1.5 text-sm leading-6 text-slate-400">{detail}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-300/15 bg-emerald-300/[.055] px-4 py-3 text-sm font-semibold text-emerald-100">
          <Sparkles aria-hidden="true" size={16} />
          {caption}
        </div>
      </div>
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
  const capability = capabilityRegistry[module.key];
  return (
    <Link
      href={capability.path}
      className="card-lift interactive group flex min-h-[280px] flex-col rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7 hover:border-emerald-300/25 hover:bg-[var(--surface-raised)]"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="motion-icon flex size-12 items-center justify-center rounded-2xl bg-white/[.055] text-emerald-200">
          <Icon aria-hidden="true" size={22} />
        </span>
        <StatusBadge status={capability.demoStatus} locale={locale} />
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
      <div key={active} className="content-swap mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((module) => (
          <ProductCard
            key={module.key}
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
          "Ученик работает в привычном интерфейсе вашей платформы.",
          "Задание задаёт учебную цель и тему.",
          "Попытка показывает, как ученик работает с задачей.",
          "Результат становится понятным сигналом, а не отдельным баллом.",
          "Teachly Core связывает разрешённый контекст, правила и состояние.",
          "Прогресс связывает результаты в картину движения ученика.",
          "AI получает только уместный учебный контекст.",
          "Преподаватель видит сигнал там, где нужна поддержка.",
          "Аналитика объединяет подтверждённые учебные сигналы для команды.",
          "Следующая активность опирается на уже пройденный путь.",
        ]
      : [
          "The learner stays inside your product's familiar interface.",
          "A task sets the learning goal and topic.",
          "An attempt shows how a learner works with the task.",
          "A result becomes a useful signal, not an isolated score.",
          "Teachly Core connects approved context, rules and state.",
          "Progress connects results into a picture of learner movement.",
          "AI receives only the relevant learning context.",
          "A teacher sees a signal where support is useful.",
          "Analytics combines evidenced learning signals for the team.",
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
        key={active}
        id="ecosystem-flow-detail"
        role="tabpanel"
        className="content-swap mt-4 min-h-[104px] rounded-2xl border border-emerald-300/15 bg-emerald-300/[.045] p-5 sm:flex sm:items-center sm:justify-between sm:gap-8"
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

function ContactActions({ locale }: { locale: "ru" | "en" }) {
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
    <div className="relative mt-7">
      <div className="flex flex-wrap gap-2">
        <a
          href="https://t.me/teachlyecosystem"
          target="_blank"
          rel="noreferrer"
          className="interactive inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_14px_36px_-22px_rgba(69,230,168,.8)] hover:-translate-y-0.5 hover:bg-emerald-200"
        >
          <MessageCircle aria-hidden="true" size={16} />
          Telegram
        </a>
        <a
          href="tel:+79923135778"
          className="interactive inline-flex items-center gap-2 rounded-xl border border-white/[.1] bg-white/[.035] px-4 py-3 text-sm font-medium text-slate-200 hover:bg-white/[.075]"
        >
          <Phone aria-hidden="true" size={16} />
          +7 992 313-57-78
        </a>
        <button
          type="button"
          onClick={() => void copyEmail()}
          className="interactive inline-flex items-center gap-2 rounded-xl border border-white/[.1] bg-white/[.035] px-4 py-3 text-sm font-medium text-slate-200 hover:bg-white/[.075]"
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
