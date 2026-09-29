'use client';

import { Activity, BarChart3, BrainCircuit, FileCheck2, Target, UsersRound } from 'lucide-react';
import { useEcosystem } from '@/lib/ecosystem-context';
import { MetricCard, PageHeader, SectionCard, StatusBadge } from '@/components/ui';

export function AnalyticsPage() {
  const { t, locale, learners, attempts, incorrectAttempts, traces, approvedKnowledge } = useEcosystem();
  const correct = attempts.filter((item) => item.result.outcome === 'correct').length;
  return <div className="flex flex-col gap-12 lg:gap-16">
    <PageHeader eyebrow={t('analytics.eyebrow')} title={t('analytics.title')} description={t('analytics.description')} action={<StatusBadge status="LIVE" locale={locale} />} />
    <SectionCard title={t('analytics.liveTitle')} detail={t('analytics.liveDetail')} icon={BarChart3}><div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7 xl:grid-cols-5"><MetricCard label={t('analytics.learners')} value={learners.length} detail={t('overview.learnersDetail')} icon={UsersRound} /><MetricCard label={t('analytics.attempts')} value={attempts.length} detail={t('overview.attemptsDetail')} icon={Activity} tone="blue" /><MetricCard label={t('analytics.incorrect')} value={incorrectAttempts.length} detail={t('analytics.preview1Detail')} icon={Target} tone="amber" /><MetricCard label={t('analytics.ai')} value={traces.length} detail={t('overview.aiRequestsDetail')} icon={BrainCircuit} /><MetricCard label={t('analytics.knowledge')} value={approvedKnowledge.length} detail={t('knowledge.inventoryDetail')} icon={FileCheck2} /></div><p className="border-t border-[var(--border)] px-5 py-4 text-xs text-slate-500 sm:px-7">{correct} {t('analytics.correct')}</p></SectionCard>
    <section className="grid gap-8 lg:grid-cols-[.7fr_1.3fr] lg:items-start"><div><p className="text-[11px] font-bold uppercase tracking-[.22em] text-emerald-300">{t('analytics.preview')}</p><h2 className="mt-4 text-3xl font-semibold tracking-[-.035em] text-slate-50">{t('analytics.previewTitle')}</h2><p className="mt-4 text-sm leading-7 text-slate-400">{t('analytics.description')}</p></div><div className="grid gap-4 md:grid-cols-3"><Preview title={t('analytics.preview1')} detail={t('analytics.preview1Detail')} /><Preview title={t('analytics.preview2')} detail={t('analytics.preview2Detail')} /><Preview title={t('analytics.preview3')} detail={t('analytics.preview3Detail')} /></div></section>
  </div>;
}

function Preview({ title, detail }: { title: string; detail: string }) { return <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"><span className="flex size-10 items-center justify-center rounded-xl bg-white/[.055] text-emerald-200"><BarChart3 aria-hidden="true" size={18} /></span><h3 className="mt-5 text-base font-semibold text-slate-100">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p><span className="mt-5 inline-flex rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.14em] text-slate-500">Preview</span></div>; }
