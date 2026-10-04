"use client";

import {
  Layers3,
  Network,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { useEcosystem } from "@/lib/ecosystem-context";
import { capabilityRegistry } from "@/lib/capabilities";
import {
  IconCard,
  PageHeader,
  SectionCard,
  StatusBadge,
} from "@/components/ui";
import { EcosystemNextStep } from "@/components/showcase/shared";
import { QuickSectionNav } from "@/components/showcase/quick-section-nav";

export function PlatformPage() {
  const { t, locale } = useEcosystem();
  return (
    <div className="flex flex-col gap-12 lg:gap-16 xl:pr-[176px]">
      <div id="overview" className="scroll-mt-28">
        <PageHeader
          eyebrow={t("platform.eyebrow")}
          title={t("platform.title")}
          description={t("platform.description")}
          action={<StatusBadge status={capabilityRegistry.platform.demoStatus} locale={locale} />}
        />
      </div>
      <QuickSectionNav
        items={
          locale === "ru"
            ? [
                { id: "overview", label: "Обзор" },
                { id: "flow", label: "Как работает" },
                { id: "benefits", label: "Возможности" },
                { id: "connection", label: "Подключение" },
              ]
            : [
                { id: "overview", label: "Overview" },
                { id: "flow", label: "How it works" },
                { id: "benefits", label: "Benefits" },
                { id: "connection", label: "Connection" },
              ]
        }
      />
      <div id="flow" className="scroll-mt-28">
        <SectionCard title={t("platform.flowTitle")} icon={Network}>
          <div className="grid gap-3 p-5 sm:p-7 lg:grid-cols-[1fr_auto_1.15fr_auto_1fr] lg:items-center">
            <Flow
              title={t("platform.customer")}
              detail={t("platform.customerDetail")}
              icon={UsersRound}
            />
            <Arrow />
            <Flow
              title={t("platform.core")}
              detail={t("platform.coreDetail")}
              icon={Network}
              active
            />
            <Arrow />
            <Flow
              title={t("platform.modules")}
              detail={t("platform.modulesDetail")}
              icon={Layers3}
            />
          </div>
        </SectionCard>
      </div>
      <div id="benefits" className="scroll-mt-28 grid gap-4 md:grid-cols-3">
        <IconCard
          icon={ShieldCheck}
          title={t("platform.benefit1")}
          detail={t("platform.benefit1Detail")}
        />
        <IconCard
          icon={Sparkles}
          title={t("platform.benefit2")}
          detail={t("platform.benefit2Detail")}
        />
        <IconCard
          icon={Layers3}
          title={t("platform.benefit3")}
          detail={t("platform.benefit3Detail")}
        />
      </div>
      <div id="connection" className="scroll-mt-28">
        <SectionCard
          title={t("platform.connection")}
          detail={t("platform.connectionDetail")}
          icon={Network}
          action={<StatusBadge status={capabilityRegistry.platform.demoStatus} locale={locale} />}
        >
          <div className="grid gap-4 p-5 sm:grid-cols-3 sm:p-7">
            <Stat label={t("platform.customer")} value={t("platform.customerDetail")} />
            <Stat label={t("platform.core")} value={t("platform.coreDetail")} />
            <Stat label={t("platform.modules")} value={t("platform.modulesDetail")} />
          </div>
        </SectionCard>
      </div>
      <EcosystemNextStep locale={locale} module="platform" />
    </div>
  );
}

function Flow({
  title,
  detail,
  icon: Icon,
  active = false,
}: {
  title: string;
  detail: string;
  icon: typeof Network;
  active?: boolean;
}) {
  return (
    <div
      tabIndex={0}
      className={`group rounded-2xl border p-5 transition duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60 ${active ? "border-emerald-300/25 bg-emerald-300/[.08] ring-1 ring-inset ring-emerald-300/25 shadow-[0_28px_64px_-40px_rgba(69,230,168,.55)] hover:border-emerald-300/45 hover:shadow-[0_32px_72px_-36px_rgba(69,230,168,.65)]" : "border-white/[.07] bg-white/[.035] hover:border-emerald-300/30 hover:bg-white/[.055]"}`}
    >
      <span className="flex size-10 items-center justify-center rounded-xl bg-white/[.07] text-emerald-200">
        <Icon aria-hidden="true" size={18} />
      </span>
      <p className="mt-4 text-base font-semibold text-slate-100">{title}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500 transition-colors group-hover:text-slate-400">
        {detail}
      </p>
    </div>
  );
}
function Arrow() {
  return (
    <div className="hidden items-center justify-center lg:flex" aria-hidden="true">
      <span className="relative h-px w-10 overflow-hidden bg-emerald-300/35">
        <span className="flow-sweep absolute inset-0" />
      </span>
      <span className="flow-tip -ml-1 size-2 rotate-45 border-r border-t border-emerald-300/60" />
    </div>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[var(--surface-raised)] p-5">
      <p className="text-[10px] font-bold uppercase tracking-[.15em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 break-words text-sm font-medium leading-6 text-slate-200">
        {value}
      </p>
    </div>
  );
}
