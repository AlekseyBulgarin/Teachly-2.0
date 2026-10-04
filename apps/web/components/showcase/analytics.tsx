"use client";

import {
  BarChart3,
} from "lucide-react";
import { useEcosystem } from "@/lib/ecosystem-context";
import { capabilityRegistry } from "@/lib/capabilities";
import { PageHeader, StatusBadge } from "@/components/ui";
import { EcosystemNextStep } from "@/components/showcase/shared";
import { QuickSectionNav } from "@/components/showcase/quick-section-nav";

export function AnalyticsPage() {
  const { t, locale } = useEcosystem();
  return (
    <div className="flex flex-col gap-12 lg:gap-16 xl:pr-[176px]">
      <div id="overview" className="scroll-mt-28">
        <PageHeader
          eyebrow={t("analytics.eyebrow")}
          title={t("analytics.title")}
          description={t("analytics.description")}
          action={<StatusBadge status={capabilityRegistry.analytics.demoStatus} locale={locale} />}
        />
      </div>
      <QuickSectionNav
        items={
          locale === "ru"
            ? [
                { id: "overview", label: "Обзор" },
                { id: "signals", label: "Сигналы" },
              ]
            : [
                { id: "overview", label: "Overview" },
                { id: "signals", label: "Signals" },
              ]
        }
      />
      <section id="signals" className="scroll-mt-28 grid gap-8 lg:grid-cols-[.7fr_1.3fr] lg:items-start">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.22em] text-emerald-300">
            {t("analytics.preview")}
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-.035em] text-slate-50">
            {t("analytics.previewTitle")}
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            {t("analytics.description")}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Preview
            title={t("analytics.preview1")}
            detail={t("analytics.preview1Detail")}
          />
          <Preview
            title={t("analytics.preview2")}
            detail={t("analytics.preview2Detail")}
          />
          <Preview
            title={t("analytics.preview3")}
            detail={t("analytics.preview3Detail")}
          />
        </div>
      </section>
      <EcosystemNextStep locale={locale} module="analytics" />
    </div>
  );
}

function Preview({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <span className="flex size-10 items-center justify-center rounded-xl bg-white/[.055] text-emerald-200">
        <BarChart3 aria-hidden="true" size={18} />
      </span>
      <h3 className="mt-5 text-base font-semibold text-slate-100">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p>
      <span className="mt-5 inline-flex rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.14em] text-slate-500">
        Preview
      </span>
    </div>
  );
}
