"use client";

import { useCallback } from "react";
import { ArrowRight, BookOpenCheck, CircleAlert, UserRound } from "lucide-react";
import { api, type LearnerProfile } from "@/lib/api";
import { useEcosystem } from "@/lib/ecosystem-context";
import { useDemoData } from "@/components/showcase/demos/use-demo-data";
import { EmptyState, ErrorState } from "@/components/ui";
import { formatShare } from "@/components/showcase/demos/learner-labels";

export function TeacherPriorityDemo() {
  const { locale, t } = useEcosystem();
  const loader = useCallback((signal: AbortSignal) => api.learnerProfile(signal), []);
  const { data: profile, loading, failed, retry } = useDemoData<LearnerProfile>(loader);
  if (loading) return <p className="text-sm text-slate-500">{t("demo.loading")}</p>;
  if (failed) return <ErrorState message={t("demo.error")} retry={retry} retryLabel={t("shell.retry")} />;
  if (!profile) return <EmptyState text={t("common.noData")} />;

  const priority = profile.needsPractice[0];
  const strong = profile.strengths[0];
  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
      <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[.055] p-5">
        <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-amber-200"><CircleAlert aria-hidden="true" size={14} />{locale === 'ru' ? 'Приоритет преподавателя' : 'Teacher priority'}</p>
        {priority ? <>
          <h3 className="mt-4 text-lg font-semibold text-slate-50">{priority.curriculum.skill.name}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">{locale === 'ru' ? `Трудность повторяется в ${priority.window.evidenceCount} учебных результатах — тему стоит разобрать до следующего блока.` : `The difficulty repeats across ${priority.window.evidenceCount} learning outcomes, so review it before the next unit.`}</p>
          <OutcomeScale value={priority.window.outcomeRate} locale={locale} />
          <div className="mt-4 flex flex-wrap gap-2"><Pill text={locale === 'ru' ? 'Повторяющийся пробел' : 'Repeated gap'} /><Pill text={`${priority.state.evidenceCount} ${locale === 'ru' ? 'учебных событий' : 'learning events'}`} /></div>
        </> : <p className="mt-4 text-sm text-slate-400">{locale === 'ru' ? 'Устойчивых затруднений пока не выявлено.' : 'No persistent difficulty has been detected yet.'}</p>}
      </div>
      <div className="flex flex-col gap-3">
        <Action icon={BookOpenCheck} title={locale === 'ru' ? 'Следующее действие' : 'Next action'} detail={priority ? (locale === 'ru' ? `Назначить короткое повторение по теме «${priority.curriculum.skill.name}».` : `Assign a short review of “${priority.curriculum.skill.name}”.`) : (locale === 'ru' ? 'Продолжить наблюдение.' : 'Continue observing.')} />
        <Action icon={UserRound} title={locale === 'ru' ? 'Опора ученика' : 'Learner strength'} detail={strong ? `${strong.curriculum.skill.name} · ${formatShare(strong.window.outcomeRate)}` : (locale === 'ru' ? 'Появится после накопления данных.' : 'Appears after more evidence.')} />
        <Action icon={ArrowRight} title={locale === 'ru' ? 'На чём основан вывод' : 'Evidence'} detail={locale === 'ru' ? `Только реальные результаты стабильного демо-профиля: ${profile.activity.evidenceCount} учебных событий.` : `Only real results from the stable demo profile: ${profile.activity.evidenceCount} learning events.`} />
      </div>
    </div>
  );
}

function OutcomeScale({ value, locale }: { value: number | null; locale: "ru" | "en" }) {
  const normalized = value === null ? 0 : Math.round(value * 100);
  return <div className="mt-5"><div className="flex items-center justify-between gap-3 text-xs"><span className="font-medium text-slate-300">{locale === "ru" ? "Верные ответы" : "Correct answers"}</span><strong className="text-lg text-amber-100">{formatShare(value)}</strong></div><div role="progressbar" aria-label={locale === "ru" ? "Доля верных ответов" : "Correct answer share"} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value === null ? undefined : normalized} className="relative mt-2 h-3 rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-rose-400/70 via-amber-300 to-emerald-300" style={{ width: `${normalized}%` }} />{[0, 50, 100].map((tick) => <span key={tick} aria-hidden="true" className="absolute top-0 h-3 w-px bg-slate-950/60" style={{ left: `${tick}%` }} />)}</div><div className="mt-2 flex justify-between text-[10px] text-slate-500"><span>0%</span><span>50%</span><span>100%</span></div></div>;
}

function Pill({ text }: { text: string }) {
  return <span className="rounded-full border border-amber-300/20 bg-black/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-amber-100">{text}</span>;
}

function Action({ icon: Icon, title, detail }: { icon: typeof ArrowRight; title: string; detail: string }) {
  return <div className="flex gap-3 rounded-xl border border-[var(--border)] bg-white/[.025] p-4"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-300/10 text-emerald-200"><Icon aria-hidden="true" size={16} /></span><div><p className="text-sm font-semibold text-slate-100">{title}</p><p className="mt-1 text-xs leading-5 text-slate-400">{detail}</p></div></div>;
}
