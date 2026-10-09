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
          <p className="mt-2 text-sm leading-6 text-slate-400">{locale === 'ru' ? `Верных ответов: ${formatShare(priority.window.outcomeRate)} по ${priority.window.evidenceCount} сигналам. Ошибка повторяется — тему стоит разобрать до следующего блока.` : `Correct outcomes: ${formatShare(priority.window.outcomeRate)} across ${priority.window.evidenceCount} signals. The difficulty repeats, so review it before the next unit.`}</p>
          <div className="mt-4 flex flex-wrap gap-2"><Pill text={locale === 'ru' ? 'Повторяющийся пробел' : 'Repeated gap'} /><Pill text={`${priority.state.evidenceCount} ${locale === 'ru' ? 'сигналов' : 'signals'}`} /></div>
        </> : <p className="mt-4 text-sm text-slate-400">{locale === 'ru' ? 'Устойчивых затруднений пока не выявлено.' : 'No persistent difficulty has been detected yet.'}</p>}
      </div>
      <div className="flex flex-col gap-3">
        <Action icon={BookOpenCheck} title={locale === 'ru' ? 'Следующее действие' : 'Next action'} detail={priority ? (locale === 'ru' ? `Назначить короткое повторение по теме «${priority.curriculum.skill.name}».` : `Assign a short review of “${priority.curriculum.skill.name}”.`) : (locale === 'ru' ? 'Продолжить наблюдение.' : 'Continue observing.')} />
        <Action icon={UserRound} title={locale === 'ru' ? 'Опора ученика' : 'Learner strength'} detail={strong ? `${strong.curriculum.skill.name} · ${formatShare(strong.window.outcomeRate)}` : (locale === 'ru' ? 'Появится после накопления данных.' : 'Appears after more evidence.')} />
        <Action icon={ArrowRight} title={locale === 'ru' ? 'Основание' : 'Evidence'} detail={locale === 'ru' ? `Только реальные результаты стабильного демо-профиля: ${profile.activity.evidenceCount} сигналов.` : `Only real results from the stable demo profile: ${profile.activity.evidenceCount} signals.`} />
      </div>
    </div>
  );
}

function Pill({ text }: { text: string }) {
  return <span className="rounded-full border border-amber-300/20 bg-black/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-amber-100">{text}</span>;
}

function Action({ icon: Icon, title, detail }: { icon: typeof ArrowRight; title: string; detail: string }) {
  return <div className="flex gap-3 rounded-xl border border-[var(--border)] bg-white/[.025] p-4"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-300/10 text-emerald-200"><Icon aria-hidden="true" size={16} /></span><div><p className="text-sm font-semibold text-slate-100">{title}</p><p className="mt-1 text-xs leading-5 text-slate-400">{detail}</p></div></div>;
}
