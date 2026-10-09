'use client';

import { useCallback } from 'react';
import { BookOpen, BrainCircuit, CheckCircle2, Database, FileCheck2, ShieldCheck } from 'lucide-react';
import { api, type KnowledgeStatus } from '@/lib/api';
import { useEcosystem } from '@/lib/ecosystem-context';
import { capabilityRegistry } from '@/lib/capabilities';
import { EmptyState, ErrorState, IconCard, PageHeader, SectionCard, StatusBadge } from '@/components/ui';
import { useDemoData } from '@/components/showcase/demos/use-demo-data';
import { EcosystemNextStep, PipelineStep } from '@/components/showcase/shared';

export function KnowledgePage() {
  const { t, locale } = useEcosystem();
  const loader = useCallback((signal: AbortSignal) => api.knowledge(signal), []);
  const { data: knowledge, loading, failed, retry } = useDemoData<KnowledgeStatus[]>(loader);
  const approvedKnowledge = (knowledge ?? []).filter((item) => item.versionStatus === 'approved');
  return <div className="flex flex-col gap-12 lg:gap-16">
    <PageHeader eyebrow={t('knowledge.eyebrow')} title={t('knowledge.title')} description={t('knowledge.description')} action={<StatusBadge status={capabilityRegistry.knowledge.demoStatus} locale={locale} />} />
    <SectionCard title={t('knowledge.flowTitle')} icon={BookOpen}><div className="grid gap-3 p-5 sm:p-7 lg:grid-cols-4"><PipelineStep index="01" title={t('knowledge.step1')} detail={t('knowledge.step1Detail')} icon={Database} /><PipelineStep index="02" title={t('knowledge.step2')} detail={t('knowledge.step2Detail')} icon={FileCheck2} /><PipelineStep index="03" title={t('knowledge.step3')} detail={t('knowledge.step3Detail')} icon={ShieldCheck} /><PipelineStep index="04" title={t('knowledge.step4')} detail={t('knowledge.step4Detail')} icon={BrainCircuit} last /></div></SectionCard>
    <SectionCard title={t('knowledge.inventory')} detail={t('knowledge.inventoryDetail')} icon={FileCheck2} action={<StatusBadge status={approvedKnowledge.length ? 'LIVE' : 'PLANNED'} locale={locale} />}>
      {loading ? <p className="p-5 text-sm text-slate-500 sm:p-7">{t('demo.loading')}</p> : failed ? <div className="p-5 sm:p-7"><ErrorState message={t('demo.error')} retry={retry} retryLabel={t('shell.retry')} /></div> : knowledge?.length ? <div className="divide-y divide-[var(--border)]">{knowledge.map((item) => <div key={item.versionId} className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7"><div><p className="text-base font-semibold text-slate-100">{item.documentTitle}</p><p className="mt-1 text-sm text-slate-500">{item.sourceName} · {locale === 'ru' ? 'версия' : 'version'} {item.version}</p></div><div className="flex flex-wrap gap-2"><StatusBadge status={item.versionStatus} locale={locale} /><StatusBadge status={item.externalAiPermission} locale={locale} /></div></div>)}</div> : <EmptyState text={t('knowledge.empty')} />}
    </SectionCard>
    <div className="grid gap-4 md:grid-cols-3"><IconCard icon={FileCheck2} title={t('knowledge.value1')} detail="" /><IconCard icon={ShieldCheck} title={t('knowledge.value2')} detail="" /><IconCard icon={CheckCircle2} title={t('knowledge.value3')} detail="" /></div>
    <EcosystemNextStep locale={locale} module="knowledge" />
  </div>;
}
