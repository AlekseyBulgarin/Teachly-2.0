import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Check } from "lucide-react";
import { StatusBadge } from "@/components/ui";
import { capabilityRegistry, type CapabilityKey } from "@/lib/capabilities";
import type { Locale } from "@/lib/i18n";

export function shortId(value: string) {
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}
export function ModuleCard({
  path,
  title,
  kicker,
  description,
  status,
  icon: Icon,
  locale,
  exploreLabel = "Explore",
}: {
  path: string;
  title: string;
  kicker: string;
  description: string;
  status: "LIVE" | "COMING NEXT" | "PLANNED";
  icon: LucideIcon;
  locale: Locale;
  exploreLabel?: string;
}) {
  return (
    <Link
      href={path}
      className="card-lift group flex min-h-[236px] flex-col rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 transition hover:border-emerald-300/30 hover:bg-[var(--surface-raised)]"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-white/[.055] text-emerald-200">
          <Icon aria-hidden="true" size={21} />
        </span>
        <StatusBadge status={status} locale={locale} />
      </div>
      <p className="mt-6 text-lg font-semibold text-slate-100">{title}</p>
      <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">
        {kicker}
      </p>
      <p className="mt-3 text-[15px] leading-7 text-slate-400 group-hover:text-slate-300">
        {description}
      </p>
      <span className="mt-auto flex items-center gap-1.5 pt-6 text-sm font-semibold text-emerald-200">
        {exploreLabel}
        <ArrowRight
          aria-hidden="true"
          size={15}
          className="transition group-hover:translate-x-1"
        />
      </span>
    </Link>
  );
}

export function PipelineStep({
  title,
  detail,
  icon: Icon,
  reveal = false,
}: {
  index: string;
  title: string;
  detail: string;
  icon: LucideIcon;
  last?: boolean;
  reveal?: boolean;
}) {
  return (
    <div
      tabIndex={reveal ? 0 : undefined}
      className={`group relative rounded-2xl bg-[var(--surface-raised)] p-5 ${reveal ? "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60" : ""}`}
    >
      <div className="flex items-center justify-between">
        <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-300/10 text-emerald-200">
          <Icon aria-hidden="true" size={17} />
        </span>
      </div>
      <p className="mt-5 text-sm font-semibold text-slate-200">{title}</p>
      <p
        className={`mt-2 text-xs leading-5 transition-opacity duration-200 ${
          reveal
            ? "text-slate-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus:opacity-100 md:group-focus-within:opacity-100"
            : "text-slate-400"
        }`}
      >
        {detail}
      </p>
    </div>
  );
}

export function AudienceCard({
  label,
  title,
  detail,
  accent = "green",
}: {
  label: string;
  title: string;
  detail: string;
  accent?: "green" | "blue" | "amber";
}) {
  const color =
    accent === "green"
      ? "text-emerald-200"
      : accent === "blue"
        ? "text-blue-200"
        : "text-amber-200";
  return (
    <div className="rounded-2xl bg-[var(--surface-raised)] p-6">
      <p
        className={`text-[10px] font-bold uppercase tracking-[.17em] ${color}`}
      >
        {label}
      </p>
      <p className="mt-4 text-lg font-semibold text-slate-200">{title}</p>
      <p className="mt-2 text-[15px] leading-7 text-slate-400">{detail}</p>
    </div>
  );
}

export function Benefit({ children }: { children: string }) {
  return (
    <li className="flex items-start gap-3 text-sm leading-6 text-slate-400">
      <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-300/10 text-emerald-200">
        <Check aria-hidden="true" size={12} />
      </span>
      {children}
    </li>
  );
}
export function PlaceholderCode({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[#070b12] p-5 font-mono text-[11px] leading-6 text-slate-500">
      <code>{children}</code>
    </pre>
  );
}

const nextStep = {
  ru: {
    platform: [
      "Начать с учебной практики",
      "Единое ядро связывает первый модуль с прогрессом, AI и будущими возможностями.",
      "Открыть базу заданий",
    ],
    learning: [
      "Посмотреть следующий модуль",
      "Контекст обучения становится основой для понятной AI-помощи.",
      "Открыть образовательный AI",
    ],
    ai: [
      "Посмотреть профиль ученика",
      "AI-сценарий использует ту же учебную историю, что и другие модули Teachly.",
      "Открыть профиль ученика",
    ],
    teacher: [
      "Посмотреть общую учебную аналитику",
      "Сигналы преподавателя становятся частью общей картины обучения для команды и руководителя.",
      "Открыть аналитику",
    ],
    knowledge: [
      "Посмотреть AI в экосистеме",
      "Одобренные материалы становятся понятной основой для AI-помощи.",
      "Открыть образовательный AI",
    ],
    analytics: [
      "Посмотреть связанные модули",
      "Картина обучения складывается из одного контекста, а не из разрозненных отчётов.",
      "Открыть обзор экосистемы",
    ],
    integrations: [
      "Посмотреть возможности после подключения",
      "Одно подключение открывает путь к связанным образовательным модулям Teachly.",
      "Открыть экосистему",
    ],
  },
  en: {
    platform: [
      "Start with learning practice",
      "One core connects the first module to progress, AI and future capabilities.",
      "Open task bank",
    ],
    learning: [
      "Explore the next module",
      "Learning context becomes the foundation for clear AI assistance.",
      "Open educational AI",
    ],
    ai: [
      "Explore the learner profile",
      "The AI scenario uses the same learning story as the other Teachly modules.",
      "Open learner profile",
    ],
    teacher: [
      "Explore the complete learning picture",
      "Teacher signals become part of the learning view for education teams and leaders.",
      "Open analytics",
    ],
    knowledge: [
      "See AI in the ecosystem",
      "Approved materials provide a clear foundation for AI assistance.",
      "Open educational AI",
    ],
    analytics: [
      "Explore connected modules",
      "The learning picture comes from one context, not disconnected reports.",
      "Open ecosystem overview",
    ],
    integrations: [
      "See what one connection unlocks",
      "One connection opens the path to connected Teachly education modules.",
      "Open ecosystem",
    ],
  },
} as const;

export function EcosystemNextStep({
  locale,
  module,
}: {
  locale: Locale;
  module: keyof typeof nextStep.ru & CapabilityKey;
}) {
  const [title, detail, action] = nextStep[locale][module];
  const next = capabilityRegistry[module].next;
  const href = next ? capabilityRegistry[next].path : capabilityRegistry.ecosystem.path;
  return (
    <section className="rounded-3xl border border-emerald-300/15 bg-emerald-300/[.055] p-6 sm:p-8 lg:flex lg:items-center lg:justify-between lg:gap-8">
      <div className="max-w-2xl">
        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-emerald-200">
          Teachly Ecosystem
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-[-.025em] text-slate-50 sm:text-3xl">
          {title}
        </h2>
        <p className="mt-3 text-[15px] leading-7 text-slate-300">{detail}</p>
      </div>
      <Link
        href={href}
        className="mt-6 inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-100 px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-white lg:mt-0"
      >
        {action}
        <ArrowRight aria-hidden="true" size={16} />
      </Link>
    </section>
  );
}
