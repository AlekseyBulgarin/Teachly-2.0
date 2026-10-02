"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  GraduationCap,
  ListChecks,
  PanelsTopLeft,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useEcosystem } from "@/lib/ecosystem-context";
import {
  IconCard,
  PageHeader,
  SectionCard,
  StatusBadge,
} from "@/components/ui";
import { PipelineStep } from "@/components/showcase/shared";
import { QuickSectionNav } from "@/components/showcase/quick-section-nav";
import { ModuleDemoSection } from "@/components/showcase/module-demo";

type CapabilityKey =
  | "tasks"
  | "variants"
  | "theory"
  | "trainer"
  | "whiteboard"
  | "student-profile"
  | "progress";
type CapabilityCopy = {
  eyebrow: string;
  title: string;
  description: string;
  audience: string;
  outcomes: [string, string, string];
  hints: [string, string, string];
  flowTitle: string;
  flow: [string, string, string];
  ecosystem: string;
  next: string;
  nextAction: string;
  nextHref: string;
  status: "LIVE" | "COMING NEXT" | "PLANNED";
};

const copy: Record<"ru" | "en", Record<CapabilityKey, CapabilityCopy>> = {
  ru: {
    tasks: {
      eyebrow: "База заданий",
      title: "Соберите практику в основу понятного обучения.",
      description:
        "Teachly помогает связать задания с темами и дальнейшей работой ученика — без разрозненных сценариев в продукте.",
      audience: "Для методиста, преподавателя и команды продукта",
      outcomes: [
        "Единая основа для практики",
        "Понятный путь от задания к прогрессу",
        "Контекст для следующих модулей",
      ],
      hints: [
        "Задания связаны с темами, поэтому практика не распадается на отдельные списки.",
        "Каждая попытка сохраняется рядом с темой и становится сигналом прогресса.",
        "Тот же набор заданий понадобится теории, тренажёру и аналитике.",
      ],
      flowTitle: "Как модуль работает в экосистеме",
      flow: [
        "Команда создаёт учебное задание",
        "Ученик выполняет попытку",
        "Результат становится контекстом Teachly",
      ],
      ecosystem:
        "База заданий запускает связанную цепочку: попытка, прогресс, AI-помощь и сигнал преподавателю.",
      next: "Посмотрите, как один учебный материал становится понятной теорией.",
      nextAction: "Открыть теорию",
      nextHref: "/theory",
      status: "LIVE",
    },
    variants: {
      eyebrow: "Варианты",
      title: "Давайте разным ученикам подходящую практику.",
      description:
        "Варианты помогают готовить сценарии обучения под разные группы и цели, сохраняя общую логику продукта.",
      audience: "Для команды, которая развивает курсы и практику",
      outcomes: [
        "Больше гибкости в учебных сценариях",
        "Общий подход для разных групп",
        "Основа для персонализации",
      ],
      hints: [
        "Разным группам — разные наборы практики при общей логике продукта.",
        "Варианты опираются на одну базу заданий и общие правила.",
        "Путь каждого ученика собирается из подходящих вариантов.",
      ],
      flowTitle: "Как модуль работает в экосистеме",
      flow: [
        "Команда задаёт учебный сценарий",
        "Ученик получает подходящую практику",
        "Teachly связывает результат с общим контекстом",
      ],
      ecosystem:
        "Варианты работают не отдельно: их результаты пополняют профиль ученика и картину прогресса.",
      next: "Посмотрите, как Teachly показывает прогресс после практики.",
      nextAction: "Открыть прогресс",
      nextHref: "/progress",
      status: "PLANNED",
    },
    theory: {
      eyebrow: "Теория",
      title: "Давайте ученику опору именно там, где она нужна.",
      description:
        "Теория объединяет проверенные учебные материалы с практикой, чтобы объяснение не отрывалось от темы и задачи.",
      audience: "Для ученика, методиста и преподавателя",
      outcomes: [
        "Понятная поддержка в процессе обучения",
        "Единый источник учебного контекста",
        "Основа для аккуратной AI-помощи",
      ],
      hints: [
        "Объяснение открывается рядом с темой и заданием, а не отдельно.",
        "Материал связан с темами, поэтому его видят и ученик, и AI.",
        "AI опирается на проверенный материал, а не на догадки.",
      ],
      flowTitle: "Как модуль работает в экосистеме",
      flow: [
        "Команда готовит материал",
        "Материал связывается с темой и заданием",
        "Ученик и AI получают нужный контекст",
      ],
      ecosystem:
        "Теория делает помощь Teachly связанной с образовательной логикой, а не случайной подсказкой.",
      next: "Посмотрите, как образовательный AI использует этот контекст.",
      nextAction: "Открыть AI",
      nextHref: "/ai",
      status: "LIVE",
    },
    trainer: {
      eyebrow: "Тренажёр",
      title: "Превращайте практику в управляемый учебный опыт.",
      description:
        "Тренажёр соединяет попытки ученика, подсказки и следующий шаг в одном спокойном сценарии обучения.",
      audience: "Для ученика и команды, которая отвечает за результат обучения",
      outcomes: [
        "Больше понятной самостоятельной практики",
        "Поддержка после попытки",
        "Сигналы для следующего действия",
      ],
      hints: [
        "Ученик решает шаг за шагом, в собственном темпе.",
        "Подсказка приходит после попытки, а не вместо неё.",
        "Результат связан с темой, поэтому видно, что делать дальше.",
      ],
      flowTitle: "Как модуль работает в экосистеме",
      flow: [
        "Ученик решает задачу",
        "Teachly учитывает результат и контекст",
        "Следующая практика или помощь становится понятнее",
      ],
      ecosystem:
        "Тренажёр использует общее ядро Teachly, поэтому опыт ученика связан с прогрессом и AI.",
      next: "Посмотрите, как Teachly помогает понять учебный результат.",
      nextAction: "Открыть прогресс",
      nextHref: "/progress",
      status: "LIVE",
    },
    whiteboard: {
      eyebrow: "Онлайн-доска",
      title: "Объясняйте ход решения на наглядной учебной доске.",
      description:
        "Онлайн-доска — пространство для визуальной работы с материалом. В этой демоверсии черновики сохраняются на сервере и переживают перезагрузку страницы; совместное редактирование пока не входит в модуль.",
      audience: "Для преподавателя, группы и ученика",
      outcomes: [
        "Наглядная работа с материалом",
        "Единый учебный сценарий",
        "Контекст для следующего шага",
      ],
      hints: [
        "Рисунки, фигуры и текст живут рядом с учебной задачей.",
        "Доска — часть учебного сценария, а не отдельный инструмент.",
        "Черновик сохраняется на сервере и переживает перезагрузку страницы.",
      ],
      flowTitle: "Как модуль работает в экосистеме",
      flow: [
        "Преподаватель открывает учебную задачу",
        "Ученик или преподаватель разбирает материал на доске",
        "Работа сохраняется на сервере платформы",
      ],
      ecosystem:
        "Онлайн-доска дополняет обучение, не становясь отдельным несвязанным инструментом.",
      next: "Посмотрите платформу, которая объединяет модули.",
      nextAction: "Открыть платформу",
      nextHref: "/platform",
      status: "LIVE",
    },
    "student-profile": {
      eyebrow: "Профиль ученика",
      title: "Видьте путь ученика целиком, а не отдельные события.",
      description:
        "Профиль собирает учебный контекст в понятную картину: что уже пройдено, где нужна поддержка и что исследовать дальше.",
      audience: "Для преподавателя и команды сопровождения",
      outcomes: [
        "Целостная картина обучения",
        "Меньше ручного поиска контекста",
        "Основа для персональной поддержки",
      ],
      hints: [
        "Задания, попытки и материалы собраны в один профиль.",
        "Не нужно собирать историю ученика по разным экранам.",
        "Видно, где нужна поддержка и что предложить дальше.",
      ],
      flowTitle: "Как модуль работает в экосистеме",
      flow: [
        "Задания и материалы создают контекст",
        "Попытки показывают движение ученика",
        "Teachly связывает сигналы в один профиль",
      ],
      ecosystem:
        "Профиль соединяет практику, прогресс и AI, чтобы каждый модуль видел одну учебную историю.",
      next: "Посмотрите, как Teachly показывает движение в обучении.",
      nextAction: "Открыть прогресс",
      nextHref: "/progress",
      status: "LIVE",
    },
    progress: {
      eyebrow: "Прогресс",
      title: "Понимайте движение ученика, а не только последний результат.",
      description:
        "Teachly превращает учебные попытки в понятные сигналы: где всё получается, где нужна поддержка и какой следующий шаг полезен.",
      audience: "Для ученика, преподавателя и образовательного бизнеса",
      outcomes: [
        "Понятная картина сильных сторон и пробелов",
        "Точки поддержки для преподавателя",
        "Контекст для AI и аналитики",
      ],
      hints: [
        "Видно, какие темы получаются, а где нужна практика.",
        "Сигналы подсказывают, когда вмешаться, а не только оценить.",
        "Те же данные питают AI-помощь и будущую аналитику.",
      ],
      flowTitle: "Как модуль работает в экосистеме",
      flow: [
        "Ученик выполняет работу",
        "Teachly связывает попытку с темой",
        "Команда видит более понятный следующий шаг",
      ],
      ecosystem:
        "Прогресс — общий язык между практикой, профилем ученика, AI и аналитикой Teachly.",
      next: "Посмотрите, как AI использует учебный контекст.",
      nextAction: "Открыть AI",
      nextHref: "/ai",
      status: "LIVE",
    },
  },
  en: {
    tasks: {
      eyebrow: "Task bank",
      title: "Make practice the foundation of clear learning.",
      description:
        "Teachly connects tasks to topics and the learner’s next step, without scattered product scenarios.",
      audience: "For curriculum, teaching and product teams",
      outcomes: [
        "One foundation for practice",
        "A clear path from task to progress",
        "Context for connected modules",
      ],
      hints: [
        "Tasks are linked to topics, so practice does not break into separate lists.",
        "Every attempt is kept with its topic context and becomes a progress signal.",
        "The same tasks support theory, the trainer and analytics.",
      ],
      flowTitle: "How it works in the ecosystem",
      flow: [
        "The team creates a learning task",
        "A learner makes an attempt",
        "The result becomes Teachly context",
      ],
      ecosystem:
        "The task bank starts a connected chain: attempt, progress, AI assistance and a teacher signal.",
      next: "See how learning material becomes clear theory.",
      nextAction: "Open theory",
      nextHref: "/theory",
      status: "LIVE",
    },
    variants: {
      eyebrow: "Variants",
      title: "Give different learners practice that fits.",
      description:
        "Variants help teams prepare learning scenarios for different groups and goals while keeping one product logic.",
      audience: "For teams growing courses and practice",
      outcomes: [
        "More flexible learning scenarios",
        "One approach across groups",
        "A foundation for personalization",
      ],
      hints: [
        "Different groups get different practice sets within one product logic.",
        "Variants build on one task bank and shared rules.",
        "Each learner path is assembled from fitting variants.",
      ],
      flowTitle: "How it works in the ecosystem",
      flow: [
        "The team sets a learning scenario",
        "The learner receives fitting practice",
        "Teachly connects the result to shared context",
      ],
      ecosystem:
        "Variants are not isolated: their results feed the learner profile and the progress picture.",
      next: "See how Teachly presents progress after practice.",
      nextAction: "Open progress",
      nextHref: "/progress",
      status: "PLANNED",
    },
    theory: {
      eyebrow: "Theory",
      title: "Give learners support exactly where it helps.",
      description:
        "Theory connects approved learning material with practice, so an explanation stays tied to the topic and task.",
      audience: "For learners, curriculum teams and teachers",
      outcomes: [
        "Clear support during learning",
        "One source of learning context",
        "A foundation for careful AI assistance",
      ],
      hints: [
        "The explanation opens next to the topic and task, not on its own.",
        "Material is linked to topics, so learners and AI use the same source.",
        "AI works from approved material instead of guessing.",
      ],
      flowTitle: "How it works in the ecosystem",
      flow: [
        "The team prepares material",
        "Material is connected to a topic and task",
        "Learners and AI receive relevant context",
      ],
      ecosystem:
        "Theory makes Teachly help follow educational logic rather than become a random hint.",
      next: "See how Educational AI uses this context.",
      nextAction: "Open AI",
      nextHref: "/ai",
      status: "LIVE",
    },
    trainer: {
      eyebrow: "Trainer",
      title: "Turn practice into a guided learning experience.",
      description:
        "The trainer connects learner attempts, hints and the next step into one calm learning scenario.",
      audience: "For learners and teams responsible for learning outcomes",
      outcomes: [
        "More clear independent practice",
        "Support after an attempt",
        "Signals for the next action",
      ],
      hints: [
        "Learners solve step by step, at their own pace.",
        "A hint arrives after the attempt instead of replacing it.",
        "The result is tied to the topic, so the next move is clear.",
      ],
      flowTitle: "How it works in the ecosystem",
      flow: [
        "A learner solves a task",
        "Teachly accounts for result and context",
        "The next practice or help becomes clearer",
      ],
      ecosystem:
        "The trainer uses the shared Teachly core, so learner experience connects to progress and AI.",
      next: "See how Teachly makes a learning outcome easier to understand.",
      nextAction: "Open progress",
      nextHref: "/progress",
      status: "LIVE",
    },
    whiteboard: {
      eyebrow: "Whiteboard",
      title: "Explain the path to a solution on a visual learning board.",
      description:
        "The whiteboard supports visual work with learning material. In this demo, drafts are saved on the server and survive a page reload; real-time collaboration is not included yet.",
      audience: "For teachers, groups and learners",
      outcomes: [
        "Visual work with learning material",
        "One learning scenario",
        "Context for the next step",
      ],
      hints: [
        "Drawings, shapes and text live next to the learning task.",
        "The board is part of the learning scenario, not a separate tool.",
        "The draft is saved on the server and survives a page reload.",
      ],
      flowTitle: "How it works in the ecosystem",
      flow: [
        "A teacher opens a learning task",
        "A learner or teacher works through material on the board",
        "The work is saved to the platform server",
      ],
      ecosystem:
        "The whiteboard complements learning without becoming another disconnected tool.",
      next: "See the platform that connects the modules.",
      nextAction: "Open platform",
      nextHref: "/platform",
      status: "LIVE",
    },
    "student-profile": {
      eyebrow: "Learner profile",
      title: "See the learner journey, not scattered events.",
      description:
        "The profile brings learning context into a clear picture: what is complete, where support is useful and what to explore next.",
      audience: "For teachers and learner-support teams",
      outcomes: [
        "A connected learning picture",
        "Less manual context gathering",
        "A foundation for personal support",
      ],
      hints: [
        "Tasks, attempts and material come together in one profile.",
        "No need to piece the learner history across separate screens.",
        "You can see where support helps and what to offer next.",
      ],
      flowTitle: "How it works in the ecosystem",
      flow: [
        "Tasks and material create context",
        "Attempts show learner movement",
        "Teachly connects signals into one profile",
      ],
      ecosystem:
        "The profile connects practice, progress and AI so every module can see one learning story.",
      next: "See how Teachly presents learning movement.",
      nextAction: "Open progress",
      nextHref: "/progress",
      status: "LIVE",
    },
    progress: {
      eyebrow: "Progress",
      title: "Understand learning movement, not only the latest result.",
      description:
        "Teachly turns attempts into clear signals: where progress is strong, where support helps and what next step is useful.",
      audience: "For learners, teachers and education businesses",
      outcomes: [
        "A clear view of strengths and gaps",
        "Support moments for teachers",
        "Context for AI and analytics",
      ],
      hints: [
        "You can see which topics are solid and where practice is needed.",
        "Signals show when to step in, not only how to grade.",
        "The same data feeds AI assistance and future analytics.",
      ],
      flowTitle: "How it works in the ecosystem",
      flow: [
        "A learner does the work",
        "Teachly connects the attempt to the topic",
        "The team sees a clearer next step",
      ],
      ecosystem:
        "Progress is the shared language between practice, learner profile, AI and Teachly analytics.",
      next: "See how AI uses learning context.",
      nextAction: "Open AI",
      nextHref: "/ai",
      status: "LIVE",
    },
  },
};

const icons: Record<CapabilityKey, LucideIcon> = {
  tasks: ListChecks,
  variants: PanelsTopLeft,
  theory: BookOpen,
  trainer: GraduationCap,
  whiteboard: PanelsTopLeft,
  "student-profile": UserRound,
  progress: Activity,
};

export function CapabilityPage({ capability, demo }: { capability: CapabilityKey; demo?: ReactNode }) {
  const { locale, t } = useEcosystem();
  const item = copy[locale][capability];
  const Icon = icons[capability];
  const base =
    locale === "ru"
      ? [
          { id: "overview", label: "Обзор" },
          { id: "benefits", label: "Возможности" },
          { id: "flow", label: "Как работает" },
        ]
      : [
          { id: "overview", label: "Overview" },
          { id: "benefits", label: "Benefits" },
          { id: "flow", label: "How it works" },
        ];
  const nav = [
    ...base,
    ...(demo ? [{ id: "demo", label: t("demo.nav") }] : []),
    locale === "ru" ? { id: "next", label: "Дальше" } : { id: "next", label: "Next" },
  ];
  return (
    <div className="flex flex-col gap-14 lg:gap-20 xl:pr-[176px]">
      <div id="overview">
        <PageHeader
          eyebrow={item.eyebrow}
          title={item.title}
          description={item.description}
          action={<StatusBadge status={item.status} locale={locale} />}
        />
      </div>
      <QuickSectionNav items={nav} />
      <section
        id="benefits"
        className="section-reveal scroll-mt-28 grid gap-5 lg:grid-cols-[.8fr_1.2fr]"
      >
        <div className="rounded-3xl border border-emerald-300/15 bg-emerald-300/[.055] p-7 sm:p-9">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-300/10 text-emerald-200">
            <Icon aria-hidden="true" size={23} />
          </span>
          <p className="mt-7 text-[11px] font-bold uppercase tracking-[.18em] text-emerald-200">
            {item.audience}
          </p>
          <p className="mt-4 text-xl font-semibold leading-8 text-slate-100">
            {item.ecosystem}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {item.outcomes.map((outcome, index) => (
            <IconCard
              key={outcome}
              icon={[BrainCircuit, UserRound, Activity][index]}
              title={outcome}
              detail=""
              hint={item.hints[index]}
            />
          ))}
        </div>
      </section>
      <div id="flow" className="scroll-mt-28">
        <SectionCard
          className="section-reveal"
          title={item.flowTitle}
          detail={item.ecosystem}
          icon={Icon}
        >
          <div className="grid gap-3 p-5 sm:p-7 lg:grid-cols-3">
            {item.flow.map((step, index) => (
              <PipelineStep
                key={step}
                index={`0${index + 1}`}
                title={step}
                detail={
                  index === 2
                    ? item.ecosystem
                    : locale === "ru"
                      ? "Часть общего учебного сценария Teachly."
                      : "Part of one connected Teachly learning scenario."
                }
                icon={[ListChecks, Activity, BrainCircuit][index]}
                last={index === 2}
                reveal
              />
            ))}
          </div>
        </SectionCard>
      </div>
      {demo ? <ModuleDemoSection>{demo}</ModuleDemoSection> : null}
      <section
        id="next"
        className="section-reveal scroll-mt-28 rounded-3xl border border-white/[.09] bg-[linear-gradient(135deg,rgba(69,230,168,.1),transparent_56%),var(--surface)] p-7 sm:p-9 lg:flex lg:items-center lg:justify-between lg:gap-8"
      >
        <div className="max-w-2xl">
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-emerald-200">
            Teachly Ecosystem
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-50 sm:text-3xl">
            {item.next}
          </h2>
        </div>
        <Link
          href={item.nextHref}
          className="interactive mt-6 inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-100 px-5 py-3.5 text-sm font-semibold text-slate-950 hover:bg-white lg:mt-0"
        >
          {item.nextAction}
          <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </section>
    </div>
  );
}
