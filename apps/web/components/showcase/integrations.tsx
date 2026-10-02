"use client";

import {
  ArrowRight,
  Database,
  Layers3,
  Network,
  ShieldCheck,
} from "lucide-react";
import { useEcosystem } from "@/lib/ecosystem-context";
import {
  IconCard,
  PageHeader,
  SectionCard,
  StatusBadge,
} from "@/components/ui";
import {
  EcosystemNextStep,
  PipelineStep,
  PlaceholderCode,
} from "@/components/showcase/shared";
import { QuickSectionNav } from "@/components/showcase/quick-section-nav";

const requestExample = `GET /v1/learner-intelligence/profile?externalUserId=<CUSTOMER_USER_ID>
Authorization: Bearer <SERVER_SIDE_KEY>
Accept: application/json`;

export function IntegrationsPage() {
  const { t, locale } = useEcosystem();
  return (
    <div className="flex flex-col gap-12 lg:gap-16">
      <div id="overview" className="scroll-mt-28">
        <PageHeader
          eyebrow={t("integrations.eyebrow")}
          title={t("integrations.title")}
          description={t("integrations.description")}
          action={<StatusBadge status="LIVE" locale={locale} />}
        />
      </div>
      <QuickSectionNav
        items={
          locale === "ru"
            ? [
                { id: "overview", label: "Обзор" },
                { id: "flow", label: "Как работает" },
                { id: "connection", label: "Подключение" },
              ]
            : [
                { id: "overview", label: "Overview" },
                { id: "flow", label: "How it works" },
                { id: "connection", label: "Connection" },
              ]
        }
      />
      <div id="flow" className="scroll-mt-28">
        <SectionCard title={t("integrations.flowTitle")} icon={Network}>
          <div className="grid gap-3 p-5 sm:p-7 lg:grid-cols-3">
            <PipelineStep
              index="01"
              title={t("integrations.step1")}
              detail={t("integrations.step1Detail")}
              icon={Database}
            />
            <PipelineStep
              index="02"
              title={t("integrations.step2")}
              detail={t("integrations.step2Detail")}
              icon={ShieldCheck}
            />
            <PipelineStep
              index="03"
              title={t("integrations.step3")}
              detail={t("integrations.step3Detail")}
              icon={Layers3}
              last
            />
          </div>
        </SectionCard>
      </div>
      <div
        id="connection"
        className="scroll-mt-28 grid gap-6 lg:grid-cols-[1.1fr_.9fr]"
      >
        <SectionCard
          title={t("integrations.connectionTitle")}
          detail={t("integrations.connectionDetail")}
          icon={Network}
          action={<StatusBadge status="LIVE" locale={locale} />}
        >
          <div className="grid gap-4 p-5 sm:p-7">
            <IconCard
              title={t("integrations.connected")}
              detail={t("integrations.connectionDetail")}
              icon={Network}
            />
            <IconCard
              title={t("integrations.details")}
              detail={t("integrations.detailsNote")}
              icon={Layers3}
            />
          </div>
        </SectionCard>
        <section className="rounded-3xl border border-emerald-300/15 bg-emerald-300/[.05] p-6 sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[.22em] text-emerald-300">
            {t("integrations.details")}
          </p>
          <h2 className="mt-4 text-2xl font-semibold tracking-[-.025em] text-slate-50">
            {t("integrations.description")}
          </h2>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            {t("integrations.detailsNote")}
          </p>
        </section>
      </div>
      <SectionCard
        title={t("integrations.futureTitle")}
        detail={t("integrations.futureDetail")}
        icon={Layers3}
      >
        <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-4">
          <Future title={t("integrations.sdk")} />
          <Future title={t("integrations.webhooks")} />
          <Future title={t("integrations.sso")} />
          <Future title={t("integrations.lti")} />
        </div>
      </SectionCard>
      <SectionCard
        title={t("integrations.details")}
        detail={t("integrations.detailsNote")}
        icon={ArrowRight}
      >
        <div className="p-5 sm:p-7">
          <PlaceholderCode>{requestExample}</PlaceholderCode>
        </div>
      </SectionCard>
      <EcosystemNextStep
        locale={locale}
        module="integrations"
        href="/ecosystem"
      />
    </div>
  );
}

function Future({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-[var(--surface-raised)] p-4">
      <span className="text-sm font-medium text-slate-300">{title}</span>
      <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.14em] text-slate-500">
        Planned
      </span>
    </div>
  );
}
