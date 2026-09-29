'use client';

import { ArrowRight, BarChart3, Lightbulb, Target, UsersRound } from 'lucide-react';
import { useEcosystem } from '@/lib/ecosystem-context';
import { IconCard, MetricCard, PageHeader, SectionCard, StatusBadge } from '@/components/ui';
import { PipelineStep } from '@/components/showcase/shared';

export function TeacherPage() {
  const { t, locale, learners, selected } = useEcosystem();
  return <div className="flex flex-col gap-12 lg:gap-16">
    <PageHeader eyebrow={t('teacher.eyebrow')} title={t('teacher.title')} description={t('teacher.description')} action={<StatusBadge status="COMING NEXT" locale={locale} />} />
    <div className="grid gap-4 md:grid-cols-3"><IconCard status="COMING NEXT" locale={locale} icon={Target} title={t('teacher.card1')} detail={t('teacher.card1Detail')} /><IconCard status="COMING NEXT" locale={locale} icon={Lightbulb} title={t('teacher.card2')} detail={t('teacher.card2Detail')} /><IconCard status="COMING NEXT" locale={locale} icon={UsersRound} title={t('teacher.card3')} detail={t('teacher.card3Detail')} /></div>
    <SectionCard title={t('teacher.flowTitle')} detail={t('teacher.preview')} icon={ArrowRight}><div className="grid gap-3 p-5 sm:p-7 lg:grid-cols-4"><PipelineStep index="01" title={t('teacher.flow1')} detail={t('teacher.preview')} icon={Target} /><PipelineStep index="02" title={t('teacher.flow2')} detail={t('teacher.preview')} icon={BarChart3} /><PipelineStep index="03" title={t('teacher.flow3')} detail={t('teacher.preview')} icon={Lightbulb} /><PipelineStep index="04" title={t('teacher.flow4')} detail={t('teacher.preview')} icon={ArrowRight} last /></div></SectionCard>
    <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]"><SectionCard title={t('teacher.liveTitle')} detail={t('teacher.liveDetail')} icon={Lightbulb} action={<StatusBadge status="LIVE" locale={locale} />}><div className="p-5 sm:p-7"><div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[.06] p-5"><p className="text-lg font-semibold text-slate-100">{selected?.student.displayName ?? t('learning.learner')}</p><p className="mt-2 text-sm leading-6 text-slate-400">{selected?.state?.explanation.reason ?? t('teacher.liveDetail')}</p></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><MetricCard label={t('teacher.learners')} value={learners.length} detail={t('teacher.liveDetail')} icon={UsersRound} /><MetricCard label={t('teacher.signals')} value={selected?.state?.evidenceCount ?? 0} detail={t('teacher.liveDetail')} icon={Target} tone="amber" /></div></div></SectionCard><section className="rounded-3xl border border-emerald-300/15 bg-emerald-300/[.05] p-6 sm:p-8"><p className="text-[11px] font-bold uppercase tracking-[.22em] text-emerald-300">{t('teacher.valueTitle')}</p><h2 className="mt-4 text-2xl font-semibold tracking-[-.025em] text-slate-50">{t('teacher.valueTitle')}</h2><ul className="mt-6 flex flex-col gap-4 text-sm leading-6 text-slate-400"><li>{t('teacher.value1')}</li><li>{t('teacher.value2')}</li><li>{t('teacher.value3')}</li></ul></section></div>
  </div>;
}
