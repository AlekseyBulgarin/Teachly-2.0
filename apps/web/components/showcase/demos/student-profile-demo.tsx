"use client";

import { useCallback } from "react";
import { Activity, BookOpenCheck, Target, UserRound } from "lucide-react";
import { api, type LearnerProfile, type LearnerSkill } from "@/lib/api";
import { useEcosystem } from "@/lib/ecosystem-context";
import { EmptyState, ErrorState } from "@/components/ui";
import { useDemoData } from "@/components/showcase/demos/use-demo-data";
import { curriculumLine, formatMoment, formatShare } from "@/components/showcase/demos/learner-labels";

function MetricCard({ title, primary, lines }: { title: string; primary: string; lines: string[] }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-5">
      <p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">{title}</p>
      <p className="mt-3 text-2xl font-semibold text-slate-50">{primary}</p>
      <ul className="mt-3 space-y-1 text-xs leading-5 text-slate-400">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

function SkillRow({ skill }: { skill: LearnerSkill }) {
  const { t } = useEcosystem();
  return (
    <li className="rounded-xl border border-[var(--border)] bg-white/[.025] px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-100">{skill.curriculum.skill.name}</p>
        <span className="text-[10px] font-bold uppercase tracking-[.1em] text-emerald-200">
          {formatShare(skill.window.outcomeRate)}
        </span>
      </div>
      <p className="mt-1 break-words text-xs leading-5 text-slate-500">{curriculumLine(skill.curriculum)}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[.1em] text-emerald-200">
          {t(`demo.li.state.${skill.state.status}`)}
        </span>
        <span className="rounded-full border border-white/10 bg-white/[.055] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[.1em] text-slate-400">
          {t(`demo.li.trend.${skill.trend.status}`)}
        </span>
        <span className="rounded-full border border-white/10 bg-white/[.055] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[.1em] text-slate-400">
          {skill.window.evidenceCount} {t("demo.li.evidence").toLowerCase()}
        </span>
      </div>
    </li>
  );
}

export function StudentProfileDemo() {
  const { t } = useEcosystem();
  const loader = useCallback((signal: AbortSignal) => api.learnerProfile(signal), []);
  const { data: profile, loading, failed, retry } = useDemoData<LearnerProfile>(loader);

  if (loading) return <p className="text-sm text-slate-500">{t("demo.loading")}</p>;
  if (failed) return <ErrorState message={t("demo.error")} retry={retry} retryLabel={t("shell.retry")} />;
  if (!profile) return <EmptyState text={t("common.noData")} />;

  const coverage = profile.mappingCoverage.evaluatedResults
    ? `${profile.mappingCoverage.withSkillEvidence} / ${profile.mappingCoverage.evaluatedResults}`
    : "—";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
          <UserRound aria-hidden="true" size={14} />
          {profile.learner.externalUserId}
        </span>
        <span className="text-xs text-slate-500">
          {t("demo.li.asOf")} {formatMoment(profile.asOf)}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <MetricCard
          title={t("demo.profile.outcomes")}
          primary={formatShare(profile.attempts.outcomeRate)}
          lines={[
            `${profile.attempts.correct} / ${profile.attempts.correct + profile.attempts.incorrect} ${t("demo.li.outcomeRateDetail")}`,
            `${t("demo.li.started")}: ${profile.attempts.started}`,
            `${t("demo.li.submitted")}: ${profile.attempts.submitted}`,
            `${t("demo.li.evaluated")}: ${profile.attempts.evaluated}`,
          ]}
        />
        <MetricCard
          title={t("demo.li.evidence")}
          primary={`${profile.activity.evidenceCount}`}
          lines={[
            `${t("demo.profile.activeDays")}: ${profile.activity.activeDays}`,
            `${t("demo.profile.lastActivity")}: ${formatMoment(profile.activity.lastObservedAt)}`,
          ]}
        />
        <MetricCard
          title={t("demo.li.coverage")}
          primary={coverage}
          lines={[t("demo.li.coverageDetail")]}
        />
        <MetricCard
          title={t("demo.profile.trainer")}
          primary={`${profile.trainer.sessionsCompleted} / ${profile.trainer.sessionsStarted}`}
          lines={[
            `${t("demo.profile.sessions")} · ${t("demo.profile.sessionsCompleted")}`,
            `${t("demo.profile.items")}: ${profile.trainer.itemsSubmitted}`,
            `${t("demo.profile.lastActivity")}: ${formatMoment(profile.trainer.lastActivityAt)}`,
          ]}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-5">
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-emerald-200">
            <BookOpenCheck aria-hidden="true" size={14} />
            {t("demo.profile.strengths")}
          </p>
          {profile.strengths.length ? (
            <ul className="mt-3 flex flex-col gap-2">
              {profile.strengths.map((skill) => (
                <SkillRow key={skill.curriculum.skill.id} skill={skill} />
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">{t("demo.profile.strengthsEmpty")}</p>
          )}
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-5">
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-amber-200">
            <Target aria-hidden="true" size={14} />
            {t("demo.profile.needsPractice")}
          </p>
          {profile.needsPractice.length ? (
            <ul className="mt-3 flex flex-col gap-2">
              {profile.needsPractice.map((skill) => (
                <SkillRow key={skill.curriculum.skill.id} skill={skill} />
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">{t("demo.profile.needsPracticeEmpty")}</p>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-5">
        <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">
          <Activity aria-hidden="true" size={14} />
          {t("demo.profile.recent")}
        </p>
        {profile.recentActivity.length ? (
          <ul className="mt-3 flex flex-col gap-2">
            {profile.recentActivity.map((item, index) => (
              <li
                key={`${item.occurredAt}-${index}`}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-[var(--border)] bg-white/[.025] px-4 py-3 text-xs"
              >
                <span className="font-mono text-slate-500">{formatMoment(item.occurredAt)}</span>
                <span className="rounded-full border border-white/10 bg-white/[.055] px-2 py-0.5 font-semibold uppercase tracking-[.1em] text-slate-400">
                  {t(`demo.li.origin.${item.origin}`)}
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 font-bold uppercase tracking-[.1em] ${
                    item.outcome === "correct"
                      ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-200"
                      : "border-rose-300/25 bg-rose-300/10 text-rose-200"
                  }`}
                >
                  {t(`demo.li.${item.outcome}`)}
                </span>
                <span className="break-words text-slate-300">
                  {item.curriculum.topic.name} / {item.curriculum.skill.name}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-500">{t("demo.profile.recentEmpty")}</p>
        )}
      </section>
    </div>
  );
}
