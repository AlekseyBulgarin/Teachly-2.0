"use client";

import {
  BrainCircuit,
  CheckCircle2,
  Lightbulb,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  Zap,
} from "lucide-react";
import { useEcosystem } from "@/lib/ecosystem-context";
import {
  ErrorState,
  Fact,
  PageHeader,
  SectionCard,
  StatusBadge,
} from "@/components/ui";
import {
  EcosystemNextStep,
  PipelineStep,
  shortId,
} from "@/components/showcase/shared";
import { QuickSectionNav } from "@/components/showcase/quick-section-nav";

export function AiPage() {
  const {
    t,
    locale,
    selected,
    selectedAttempt,
    remediation,
    actionError,
    requestRemediation,
  } = useEcosystem();
  return (
    <div className="flex flex-col gap-12 lg:gap-16">
      <div id="overview" className="scroll-mt-28">
        <PageHeader
          eyebrow={t("ai.eyebrow")}
          title={t("ai.title")}
          description={t("ai.description")}
          action={<StatusBadge status="LIVE" locale={locale} />}
        />
      </div>
      <QuickSectionNav
        items={
          locale === "ru"
            ? [
                { id: "overview", label: "Обзор" },
                { id: "scenario", label: "Как работает" },
                { id: "benefits", label: "Для команды" },
                { id: "assistant", label: "Помощь AI" },
              ]
            : [
                { id: "overview", label: "Overview" },
                { id: "scenario", label: "How it works" },
                { id: "benefits", label: "For your team" },
                { id: "assistant", label: "AI assistance" },
              ]
        }
      />
      <div id="scenario" className="scroll-mt-28">
        <SectionCard
          title={t("ai.scenarioTitle")}
          detail={t("ai.scenarioDetail")}
          icon={BrainCircuit}
        >
          <div className="grid gap-3 p-5 sm:p-7 lg:grid-cols-5">
            <PipelineStep
              index="01"
              title={t("ai.step1")}
              detail={t("ai.step1Detail")}
              icon={Target}
            />
            <PipelineStep
              index="02"
              title={t("ai.step2")}
              detail={t("ai.step2Detail")}
              icon={ShieldCheck}
            />
            <PipelineStep
              index="03"
              title={t("ai.step3")}
              detail={t("ai.step3Detail")}
              icon={MessageCircle}
            />
            <PipelineStep
              index="04"
              title={t("ai.step4")}
              detail={t("ai.step4Detail")}
              icon={UserRound}
            />
            <PipelineStep
              index="05"
              title={t("ai.step5")}
              detail={t("ai.step5Detail")}
              icon={Sparkles}
              last
            />
          </div>
        </SectionCard>
      </div>
      <div id="benefits" className="scroll-mt-28 grid gap-4 md:grid-cols-3">
        <StoryCard
          icon={UserRound}
          label={t("ai.student")}
          title={t("ai.studentResult")}
          detail={t("ai.studentCopy")}
        />
        <StoryCard
          icon={Lightbulb}
          label={t("ai.teacher")}
          title={t("ai.teacherResult")}
          detail={t("ai.teacherCopy")}
          tone="blue"
        />
        <StoryCard
          icon={Zap}
          label={t("ai.business")}
          title={t("ai.businessResult")}
          detail={t("ai.businessCopy")}
          tone="amber"
        />
      </div>
      <div
        id="assistant"
        className="scroll-mt-28 grid gap-6 xl:grid-cols-[.85fr_1.15fr]"
      >
        <SectionCard
          title={t("ai.context")}
          detail={t("ai.contextDetail")}
          icon={ShieldCheck}
        >
          <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-7">
            <Fact
              label={t("ai.task")}
              value={selected?.task?.topic.name ?? "—"}
            />
            <Fact
              label={t("ai.result")}
              value={selectedAttempt?.result.outcome ?? "—"}
            />
            <Fact
              label={t("ai.knowledge")}
              value={selected ? t("common.live") : t("common.preview")}
            />
            <Fact
              label={t("labels.learner")}
              value={selected?.student.displayName ?? "—"}
            />
          </div>
          <div className="border-t border-[var(--border)] px-5 py-4 text-xs leading-5 text-slate-500 sm:px-7">
            {t("ai.requestDetail")}
          </div>
        </SectionCard>
        <SectionCard
          title={remediation ? t("ai.live") : t("ai.proposal")}
          detail={remediation ? t("ai.requestDetail") : t("ai.previewDetail")}
          icon={Sparkles}
          action={
            <StatusBadge
              status={remediation ? "LIVE" : "COMING NEXT"}
              locale={locale}
            />
          }
        >
          <div className="p-5 sm:p-7">
            {actionError && (
              <ErrorState
                message={t("ai.unavailable")}
                retry={() => void requestRemediation()}
                retryLabel={t("shell.retry")}
              />
            )}
            {remediation ? (
              <div className="flex flex-col gap-5">
                <div>
                  <p className="text-xl font-semibold text-slate-50">
                    {remediation.remediation.summary}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-400">
                    {remediation.remediation.explanation}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Fact
                    label={t("ai.hint")}
                    value={remediation.remediation.hint}
                  />
                  <Fact
                    label={t("ai.gap")}
                    value={remediation.remediation.likelyGap ?? "—"}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  {Math.round(remediation.remediation.confidence * 100)}%{" "}
                  {locale === "ru" ? "уверенность" : "confidence"} ·{" "}
                  {shortId(remediation.requestId)}
                </p>
              </div>
            ) : (
              <div>
                <p className="max-w-xl text-sm leading-7 text-slate-400">
                  {t("ai.previewDetail")}
                </p>
                <button
                  onClick={() => void requestRemediation()}
                  disabled={!selectedAttempt}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--green)] px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-[var(--green-accent)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t("ai.request")}
                  <Zap aria-hidden="true" size={16} />
                </button>
              </div>
            )}
          </div>
        </SectionCard>
      </div>
      <SectionCard title={t("ai.roadmapTitle")} icon={CheckCircle2}>
        <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-7">
          <Road label={t("ai.roadmapLive")} status="LIVE" locale={locale} />
          <Road
            label={t("ai.roadmapNext")}
            status="COMING NEXT"
            locale={locale}
          />
          <Road
            label={t("ai.roadmapPlanned")}
            status="PLANNED"
            locale={locale}
          />
        </div>
      </SectionCard>
      <EcosystemNextStep locale={locale} module="ai" href="/student-profile" />
    </div>
  );
}

function StoryCard({
  icon: Icon,
  label,
  title,
  detail,
  tone = "green",
}: {
  icon: typeof UserRound;
  label: string;
  title: string;
  detail: string;
  tone?: "green" | "blue" | "amber";
}) {
  const color =
    tone === "green"
      ? "text-emerald-200"
      : tone === "blue"
        ? "text-blue-200"
        : "text-amber-200";
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div
        className={`flex size-10 items-center justify-center rounded-xl bg-white/[.055] ${color}`}
      >
        <Icon aria-hidden="true" size={18} />
      </div>
      <p
        className={`mt-5 text-[10px] font-bold uppercase tracking-[.16em] ${color}`}
      >
        {label}
      </p>
      <p className="mt-3 text-base font-semibold text-slate-100">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p>
    </div>
  );
}
function Road({
  label,
  status,
  locale,
}: {
  label: string;
  status: "LIVE" | "COMING NEXT" | "PLANNED";
  locale: "ru" | "en";
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--surface-raised)] p-4">
      <span className="text-sm text-slate-300">{label}</span>
      <StatusBadge status={status} locale={locale} />
    </div>
  );
}
