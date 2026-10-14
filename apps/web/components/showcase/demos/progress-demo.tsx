"use client";

import { useCallback, useState } from "react";
import { Activity, CalendarRange, CheckCircle2, ListTree, TrendingUp } from "lucide-react";
import { api, type LearnerDimensionGroup, type LearnerGroupBy, type LearnerProgress, type LearnerSkill, type LearnerSkillStates } from "@/lib/api";
import { useEcosystem } from "@/lib/ecosystem-context";
import { EmptyState, ErrorState } from "@/components/ui";
import { useDemoData } from "@/components/showcase/demos/use-demo-data";
import { curriculumLine, formatDay, formatShare } from "@/components/showcase/demos/learner-labels";

const GROUP_BY_OPTIONS: LearnerGroupBy[] = ["skill", "topic", "course", "subject"];

function isSkillRow(row: LearnerSkill | LearnerDimensionGroup): row is LearnerSkill {
  return "state" in row;
}

function percent(value: number | null): number {
  return value === null ? 0 : Math.max(0, Math.min(100, Math.round(value * 100)));
}

function LegendDot({ color, label, value }: { color: string; label: string; value: number }) {
  return <div className="flex items-center justify-between gap-4"><span className="flex items-center gap-2 text-slate-400"><span className={`size-2 rounded-full ${color}`} />{label}</span><strong className="text-slate-100">{value}</strong></div>;
}

function ResultDonut({ correct, incorrect, rate }: { correct: number; incorrect: number; rate: number | null }) {
  const { t } = useEcosystem();
  const value = percent(rate);
  const total = correct + incorrect;
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-5">
      <p className="text-[11px] font-bold uppercase tracking-[.14em] text-slate-400">{t("demo.progress.results")}</p>
      <div className="mt-5 flex items-center gap-5">
        <div role="img" aria-label={`${t("demo.li.outcomeRate")}: ${formatShare(rate)}`} className="grid size-28 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(rgb(110 231 183) 0 ${value}%, rgb(251 113 133 / .65) ${value}% 100%)` }}>
          <div className="grid size-[76px] place-items-center rounded-full border border-white/[.06] bg-[#111b29] text-center"><span className="text-2xl font-semibold tracking-[-.04em] text-slate-50">{formatShare(rate)}</span></div>
        </div>
        <div className="min-w-0 space-y-3 text-sm">
          <LegendDot color="bg-emerald-300" label={t("demo.li.correct")} value={correct} />
          <LegendDot color="bg-rose-400" label={t("demo.li.incorrect")} value={incorrect} />
          <p className="text-xs leading-5 text-slate-500">{total} {t("demo.progress.gradedResults").toLowerCase()}</p>
        </div>
      </div>
    </article>
  );
}

function PercentScale({ value, label, detail }: { value: number | null; label: string; detail: string }) {
  const normalized = percent(value);
  return (
    <div>
      <div className="flex items-end justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-[.14em] text-slate-400">{label}</p><p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p></div><strong className="text-2xl font-semibold tracking-[-.04em] text-slate-50">{value === null ? "—" : `${normalized}%`}</strong></div>
      <div className="relative mt-5 h-3 rounded-full bg-slate-800" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value === null ? undefined : normalized}>
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-400/70 to-emerald-300" style={{ width: `${normalized}%` }} />
        {[0, 50, 100].map((tick) => <span key={tick} aria-hidden="true" className="absolute top-0 h-3 w-px bg-slate-950/60" style={{ left: `${tick}%` }} />)}
      </div>
      <div className="mt-2 flex justify-between text-[10px] tabular-nums text-slate-500"><span>0%</span><span>50%</span><span>100%</span></div>
    </div>
  );
}

function StateDistribution({ states }: { states: LearnerSkillStates }) {
  const { t } = useEcosystem();
  const total = Math.max(1, states.observed);
  const items = [
    { key: "showing_progress", count: states.byStatus.showing_progress, color: "bg-emerald-300" },
    { key: "needs_practice", count: states.byStatus.needs_practice, color: "bg-amber-300" },
    { key: "insufficient_evidence", count: states.byStatus.insufficient_evidence, color: "bg-slate-500" },
  ] as const;
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-5">
      <div className="flex items-end justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[.14em] text-slate-400">{t("demo.progress.skillPicture")}</p><p className="mt-1 text-xs text-slate-500">{t("demo.progress.skillPictureDetail")}</p></div><strong className="text-2xl text-slate-50">{states.observed}</strong></div>
      <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-slate-800" role="img" aria-label={items.map((item) => `${t(`demo.li.state.${item.key}`)}: ${item.count}`).join(", ")}>{items.map((item) => item.count > 0 && <span key={item.key} className={item.color} style={{ width: `${(item.count / total) * 100}%` }} />)}</div>
      <div className="mt-4 grid gap-2">{items.map((item) => <LegendDot key={item.key} color={item.color} label={t(`demo.li.state.${item.key}`)} value={item.count} />)}</div>
    </article>
  );
}

function ActivityChart({ days }: { days: LearnerProgress["activityByDay"] }) {
  const { t } = useEcosystem();
  if (!days.length) return <p className="mt-4 text-sm text-slate-500">{t("common.noData")}</p>;
  const maxValue = Math.max(1, ...days.map((day) => day.evidenceCount));
  const middle = Math.ceil(maxValue / 2);
  return (
    <div className="mt-5 grid grid-cols-[32px_1fr] gap-3">
      <div className="flex h-44 flex-col justify-between text-right text-[10px] tabular-nums text-slate-500" aria-hidden="true"><span>{maxValue}</span><span>{middle}</span><span>0</span></div>
      <div className="relative h-52 overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-44 border-y border-white/[.08] bg-[linear-gradient(to_bottom,transparent_calc(50%-0.5px),rgba(255,255,255,.08)_50%,transparent_calc(50%+0.5px))]" />
        <ul className="relative flex h-full items-start gap-2 sm:gap-4">{days.map((day) => <li key={day.date} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end"><span className="mb-2 text-xs font-semibold tabular-nums text-slate-200">{day.evidenceCount}</span><span role="img" aria-label={`${formatDay(day.date)}: ${day.evidenceCount} ${t("demo.progress.learningActions").toLowerCase()}`} className="w-full max-w-12 rounded-t-lg border border-emerald-200/20 bg-gradient-to-t from-emerald-500/45 to-emerald-300" style={{ height: `${Math.max(8, (day.evidenceCount / maxValue) * 144)}px` }} /><span className="mt-2 truncate text-[10px] text-slate-500 sm:text-xs">{formatDay(day.date).slice(5)}</span></li>)}</ul>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: LearnerSkill["state"]["status"] }) {
  const { t } = useEcosystem();
  const color = status === "showing_progress" ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-200" : status === "needs_practice" ? "border-amber-300/25 bg-amber-300/10 text-amber-100" : "border-white/10 bg-white/[.05] text-slate-400";
  return <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.08em] ${color}`}>{t(`demo.li.state.${status}`)}</span>;
}

function ComparisonBar({ label, value, max, active = false }: { label: string; value: number; max: number; active?: boolean }) {
  return <div><div className="mb-2 flex items-center justify-between text-xs"><span className="text-slate-500">{label}</span><strong className={active ? "text-emerald-200" : "text-slate-300"}>{value}</strong></div><div className="h-2 rounded-full bg-slate-800"><div className={`h-full rounded-full ${active ? "bg-emerald-300" : "bg-slate-500"}`} style={{ width: `${(value / max) * 100}%` }} /></div></div>;
}

export function ProgressDemo() {
  const { t } = useEcosystem();
  const [groupBy, setGroupBy] = useState<LearnerGroupBy>("skill");
  const loader = useCallback((signal: AbortSignal) => api.learnerProgress({ groupBy, signal }), [groupBy]);
  const { data: progress, loading, failed, retry } = useDemoData<LearnerProgress>(loader);

  if (loading) return <p className="text-sm text-slate-500">{t("demo.loading")}</p>;
  if (failed) return <ErrorState message={t("demo.error")} retry={retry} retryLabel={t("shell.retry")} />;
  if (!progress) return <EmptyState text={t("common.noData")} />;

  const evaluated = progress.mappingCoverage.evaluatedResults;
  const coverageRate = evaluated ? progress.mappingCoverage.withSkillEvidence / evaluated : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100"><CalendarRange aria-hidden="true" size={14} />{t("demo.progress.period")}: {formatDay(progress.window.from)} — {formatDay(progress.window.to)}</span><span className="text-xs text-slate-500">{t("demo.li.learner")}: {progress.learner.externalUserId}</span></div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ResultDonut correct={progress.summary.correct} incorrect={progress.summary.incorrect} rate={progress.summary.outcomeRate} />
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-5"><PercentScale value={coverageRate} label={t("demo.li.coverage")} detail={`${progress.mappingCoverage.withSkillEvidence} ${t("demo.progress.of")} ${evaluated} ${t("demo.progress.gradedResults").toLowerCase()}`} /><div className="mt-5 flex items-center gap-2 text-xs leading-5 text-slate-500"><CheckCircle2 aria-hidden="true" size={15} className="shrink-0 text-cyan-300" />{t("demo.li.coverageDetail")}</div></article>
        <StateDistribution states={progress.skillStates} />
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-5 sm:p-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.14em] text-slate-300"><Activity aria-hidden="true" size={15} />{t("demo.progress.byDay")}</p><p className="mt-2 text-xs leading-5 text-slate-500">{t("demo.progress.byDayDetail")}</p></div><div className="text-right"><strong className="text-2xl text-slate-50">{progress.summary.evidenceCount}</strong><p className="text-[10px] uppercase tracking-[.1em] text-slate-500">{t("demo.progress.learningActions")}</p></div></div><ActivityChart days={progress.activityByDay} /></section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.14em] text-emerald-200"><ListTree aria-hidden="true" size={15} />{t("demo.progress.breakdown")}</p><p className="mt-2 text-xs text-slate-500">{t("demo.progress.breakdownDetail")}</p></div><div className="flex flex-wrap gap-2" role="group" aria-label={t("demo.progress.dimensions")}>{GROUP_BY_OPTIONS.map((option) => { const active = option === groupBy; return <button key={option} type="button" data-progress-group={option} onClick={() => setGroupBy(option)} aria-pressed={active} className={`interactive rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${active ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100" : "border-[var(--border)] bg-white/[.025] text-slate-400 hover:border-[var(--border-strong)] hover:text-slate-200"}`}>{t(`demo.progress.group.${option}`)}</button>; })}</div></div>
        <div key={groupBy} data-motion-panel="progress" className="content-swap mt-5 grid gap-3">{progress.dimensions.map((row, index) => {
          if (isSkillRow(row)) return <article key={row.curriculum.skill.id} className="rounded-xl border border-[var(--border)] bg-white/[.025] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h3 className="font-semibold text-slate-100">{row.curriculum.skill.name}</h3><p className="mt-1 break-words text-xs text-slate-500">{curriculumLine(row.curriculum)}</p></div><StatusBadge status={row.state.status} /></div><div className="mt-4"><PercentScale value={row.window.outcomeRate} label={t("demo.li.outcomeRate")} detail={`${row.window.correct} ${t("demo.progress.of")} ${row.window.correct + row.window.incorrect} ${t("demo.progress.gradedResults").toLowerCase()}`} /></div></article>;
          const group = row as LearnerDimensionGroup;
          const name = group.reference.name ?? group.reference.code ?? group.reference.id ?? "—";
          return <article key={`${name}-${index}`} className="rounded-xl border border-[var(--border)] bg-white/[.025] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-100">{name}</h3><p className="mt-1 text-xs text-slate-500">{t("demo.progress.observed")}: {group.observedSkillCount}</p></div><strong className="text-lg text-slate-100">{formatShare(group.outcomeRate)}</strong></div><div className="mt-4"><PercentScale value={group.outcomeRate} label={t("demo.li.outcomeRate")} detail={`${group.correct} ${t("demo.progress.of")} ${group.correct + group.incorrect} ${t("demo.progress.gradedResults").toLowerCase()}`} /></div><div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-400"><span>{t("demo.li.state.showing_progress")}: <strong className="text-emerald-200">{group.skillStates.byStatus.showing_progress}</strong></span><span>{t("demo.li.state.needs_practice")}: <strong className="text-amber-200">{group.skillStates.byStatus.needs_practice}</strong></span><span>{t("demo.li.state.insufficient_evidence")}: <strong className="text-slate-300">{group.skillStates.byStatus.insufficient_evidence}</strong></span></div></article>;
        })}</div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-5 sm:p-6"><div><p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.14em] text-slate-300"><TrendingUp aria-hidden="true" size={15} />{t("demo.li.trend.title")}</p><p className="mt-2 text-xs leading-5 text-slate-500">{t("demo.progress.trendDetail")}</p></div>{progress.recentOutcomeTrend.length ? <ul className="mt-4 grid gap-3">{progress.recentOutcomeTrend.map((item) => { const max = Math.max(1, item.trend.currentCorrect, item.trend.previousCorrect); return <li key={item.curriculum.skill.id} className="rounded-xl border border-[var(--border)] bg-white/[.025] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><strong className="text-sm text-slate-100">{item.curriculum.skill.name}</strong><span className="rounded-full border border-white/10 bg-white/[.05] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.08em] text-slate-300">{t(`demo.li.trend.${item.trend.status}`)}</span></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><ComparisonBar label={t("demo.progress.before")} value={item.trend.previousCorrect} max={max} /><ComparisonBar label={t("demo.progress.now")} value={item.trend.currentCorrect} max={max} active /></div></li>; })}</ul> : <p className="mt-4 text-sm text-slate-500">{t("common.noData")}</p>}</section>
    </div>
  );
}
