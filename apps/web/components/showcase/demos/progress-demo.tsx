"use client";

import { useCallback, useState } from "react";
import { Activity, CalendarRange, ListTree, TrendingUp } from "lucide-react";
import {
  api,
  type LearnerDimensionGroup,
  type LearnerGroupBy,
  type LearnerProgress,
  type LearnerSkill,
} from "@/lib/api";
import { useEcosystem } from "@/lib/ecosystem-context";
import { EmptyState, ErrorState } from "@/components/ui";
import { useDemoData } from "@/components/showcase/demos/use-demo-data";
import { curriculumLine, formatDay, formatShare } from "@/components/showcase/demos/learner-labels";

const GROUP_BY_OPTIONS: LearnerGroupBy[] = ["skill", "topic", "course", "subject"];

function isSkillRow(row: LearnerSkill | LearnerDimensionGroup): row is LearnerSkill {
  return "state" in row;
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-slate-50">{value}</p>
    </div>
  );
}

export function ProgressDemo() {
  const { t } = useEcosystem();
  const [groupBy, setGroupBy] = useState<LearnerGroupBy>("skill");
  const loader = useCallback(
    (signal: AbortSignal) => api.learnerProgress({ groupBy, signal }),
    [groupBy],
  );
  const { data: progress, loading, failed, retry } = useDemoData<LearnerProgress>(loader);

  if (loading) return <p className="text-sm text-slate-500">{t("demo.loading")}</p>;
  if (failed) return <ErrorState message={t("demo.error")} retry={retry} retryLabel={t("shell.retry")} />;
  if (!progress) return <EmptyState text={t("common.noData")} />;

  const maxDay = Math.max(1, ...progress.activityByDay.map((day) => day.evidenceCount));
  const coverage = progress.mappingCoverage.evaluatedResults
    ? `${progress.mappingCoverage.withSkillEvidence} / ${progress.mappingCoverage.evaluatedResults}`
    : "—";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
          <CalendarRange aria-hidden="true" size={14} />
          {t("demo.progress.window")}: {formatDay(progress.window.from)} — {formatDay(progress.window.to)}
        </span>
        <span className="text-xs text-slate-500">
          {progress.learner.externalUserId}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryTile label={t("demo.li.evidence")} value={`${progress.summary.evidenceCount}`} />
        <SummaryTile
          label={t("demo.li.outcomeRate")}
          value={`${formatShare(progress.summary.outcomeRate)} (${progress.summary.correct}/${progress.summary.correct + progress.summary.incorrect})`}
        />
        <SummaryTile label={t("demo.li.coverage")} value={coverage} />
        <SummaryTile label={t("demo.progress.observed")} value={`${progress.skillStates.observed}`} />
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-5">
        <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">
          <Activity aria-hidden="true" size={14} />
          {t("demo.progress.byDay")}
        </p>
        {progress.activityByDay.length ? (
          <ul className="mt-3 flex flex-col gap-1.5">
            {progress.activityByDay.map((day) => (
              <li key={day.date} className="flex items-center gap-3 text-xs">
                <span className="w-24 shrink-0 font-mono text-slate-500">{formatDay(day.date)}</span>
                <span
                  className="h-2 rounded-full bg-emerald-300/60"
                  style={{ width: `${Math.max(6, Math.round((day.evidenceCount / maxDay) * 100))}%` }}
                  aria-hidden="true"
                />
                <span className="shrink-0 font-semibold text-slate-300">{day.evidenceCount}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-500">{t("common.noData")}</p>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-emerald-200">
            <ListTree aria-hidden="true" size={14} />
            {t("demo.progress.dimensions")}
          </p>
          <div className="flex flex-wrap gap-2" role="group" aria-label={t("demo.progress.dimensions")}>
            {GROUP_BY_OPTIONS.map((option) => {
              const active = option === groupBy;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setGroupBy(option)}
                  aria-pressed={active}
                  className={`interactive rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
                      : "border-[var(--border)] bg-white/[.025] text-slate-400 hover:border-[var(--border-strong)] hover:text-slate-200"
                  }`}
                >
                  {t(`demo.progress.group.${option}`)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-xs">
            <caption className="sr-only">{t("demo.progress.skills")}</caption>
            <thead>
              <tr className="border-b border-[var(--border)] text-slate-500">
                <th scope="col" className="py-2 pr-4 font-bold uppercase tracking-[.1em]">
                  {t(`demo.progress.group.${groupBy}`)}
                </th>
                <th scope="col" className="py-2 pr-4 font-bold uppercase tracking-[.1em]">
                  {t("demo.li.evidence")}
                </th>
                <th scope="col" className="py-2 pr-4 font-bold uppercase tracking-[.1em]">
                  {t("demo.li.outcomeRate")}
                </th>
                <th scope="col" className="py-2 font-bold uppercase tracking-[.1em]">
                  {t("common.status")}
                </th>
              </tr>
            </thead>
            <tbody>
              {progress.dimensions.map((row, index) => {
                if (isSkillRow(row)) {
                  return (
                    <tr key={row.curriculum.skill.id} className="border-b border-white/[.05] text-slate-300">
                      <th scope="row" className="py-2.5 pr-4 font-semibold text-slate-100">
                        {row.curriculum.skill.name}
                        <span className="mt-0.5 block break-words text-[11px] font-normal text-slate-500">
                          {curriculumLine(row.curriculum)}
                        </span>
                      </th>
                      <td className="py-2.5 pr-4">{row.window.evidenceCount}</td>
                      <td className="py-2.5 pr-4">{formatShare(row.window.outcomeRate)}</td>
                      <td className="py-2.5">
                        <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2 py-0.5 font-bold uppercase tracking-[.1em] text-emerald-200">
                          {t(`demo.li.state.${row.state.status}`)}
                        </span>
                      </td>
                    </tr>
                  );
                }
                const group = row as LearnerDimensionGroup;
                const name = group.reference.name ?? group.reference.code ?? group.reference.id ?? "—";
                return (
                  <tr key={`${name}-${index}`} className="border-b border-white/[.05] text-slate-300">
                    <th scope="row" className="py-2.5 pr-4 font-semibold text-slate-100">
                      {name}
                      <span className="mt-0.5 block text-[11px] font-normal text-slate-500">
                        {t("demo.progress.observed")}: {group.observedSkillCount}
                      </span>
                    </th>
                    <td className="py-2.5 pr-4">{group.evidenceCount}</td>
                    <td className="py-2.5 pr-4">{formatShare(group.outcomeRate)}</td>
                    <td className="py-2.5 text-[11px] text-slate-400">
                      {t("demo.li.state.showing_progress")}: {group.skillStates.byStatus.showing_progress}
                      {" · "}
                      {t("demo.li.state.needs_practice")}: {group.skillStates.byStatus.needs_practice}
                      {" · "}
                      {t("demo.li.state.insufficient_evidence")}: {group.skillStates.byStatus.insufficient_evidence}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-5">
        <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">
          <TrendingUp aria-hidden="true" size={14} />
          {t("demo.li.trend.title")}
        </p>
        {progress.recentOutcomeTrend.length ? (
          <ul className="mt-3 flex flex-col gap-2">
            {progress.recentOutcomeTrend.map((item) => (
              <li
                key={item.curriculum.skill.id}
                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-[var(--border)] bg-white/[.025] px-4 py-3 text-xs"
              >
                <span className="break-words font-semibold text-slate-100">
                  {item.curriculum.skill.name}
                </span>
                <span className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/10 bg-white/[.055] px-2 py-0.5 font-bold uppercase tracking-[.1em] text-slate-400">
                    {t(`demo.li.trend.${item.trend.status}`)}
                  </span>
                  <span className="font-mono text-slate-500">
                    {item.trend.currentCorrect} / {item.trend.previousCorrect}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-500">{t("common.noData")}</p>
        )}
      </section>
    </div>
  );
}
