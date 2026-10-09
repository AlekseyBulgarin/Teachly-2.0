'use client';

import { Activity, ArrowRight, CheckCircle2, CircleDot, Gauge, Target, UsersRound, Workflow } from 'lucide-react';
import { useEcosystem } from '@/lib/ecosystem-context';
import { capabilityRegistry } from '@/lib/capabilities';
import { IconCard, PageHeader, SectionCard, StatusBadge } from '@/components/ui';
import { ProgressDemo } from '@/components/showcase/demos/progress-demo';
import { EcosystemNextStep, PipelineStep } from '@/components/showcase/shared';

export function LearningPage() {
  const { t, locale } = useEcosystem();
  return <div className="flex flex-col gap-12 lg:gap-16">
    <PageHeader eyebrow={t('learning.eyebrow')} title={t('learning.title')} description={t('learning.description')} action={<StatusBadge status={capabilityRegistry.learning.demoStatus} locale={locale} />} />
    <SectionCard title={t('learning.flowTitle')} icon={Workflow}><div className="grid gap-3 p-5 sm:p-7 lg:grid-cols-4"><PipelineStep index="01" title={t('learning.step1')} detail={t('learning.step1Detail')} icon={Activity} /><PipelineStep index="02" title={t('learning.step2')} detail={t('learning.step2Detail')} icon={CircleDot} /><PipelineStep index="03" title={t('learning.step3')} detail={t('learning.step3Detail')} icon={Gauge} /><PipelineStep index="04" title={t('learning.step4')} detail={t('learning.step4Detail')} icon={ArrowRight} last /></div></SectionCard>
    <SectionCard title={t('learning.liveTitle')} detail={t('learning.liveDetail')} icon={UsersRound} action={<StatusBadge status="LIVE" locale={locale} />}>
      <div className="p-5 sm:p-7"><ProgressDemo /></div>
    </SectionCard>
    <section className="grid gap-8 lg:grid-cols-[.7fr_1.3fr] lg:items-start"><div><p className="text-[11px] font-bold uppercase tracking-[.22em] text-emerald-300">{t('learning.valueTitle')}</p><h2 className="mt-4 text-3xl font-semibold tracking-[-.035em] text-slate-50">{t('learning.valueTitle')}</h2></div><div className="grid gap-4 md:grid-cols-3"><IconCard icon={Target} title={t('learning.value1')} detail="" /><IconCard icon={CheckCircle2} title={t('learning.value2')} detail="" /><IconCard icon={UsersRound} title={t('learning.value3')} detail="" /></div></section>
    <EcosystemNextStep locale={locale} module="learning" />
  </div>;
}
