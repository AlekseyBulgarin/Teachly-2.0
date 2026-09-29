'use client';

import Link from 'next/link';
import { Activity, BarChart3, BrainCircuit, CheckCircle2, FileCheck2, Layers3, Lightbulb, Network, Sparkles, UsersRound } from 'lucide-react';
import { useEcosystem } from '@/lib/ecosystem-context';
import { MetricCard, PageHeader, SectionCard, StatusBadge } from '@/components/ui';
import { AudienceCard, Benefit, ModuleCard } from '@/components/showcase/shared';

const modules = [
  { path: '/platform', key: 'core', status: 'LIVE' as const, icon: Layers3 },
  { path: '/learning', key: 'learning', status: 'LIVE' as const, icon: Activity },
  { path: '/ai', key: 'ai', status: 'LIVE' as const, icon: BrainCircuit },
  { path: '/teacher', key: 'teacher', status: 'COMING NEXT' as const, icon: Lightbulb },
  { path: '/knowledge', key: 'knowledge', status: 'LIVE' as const, icon: FileCheck2 },
  { path: '/analytics', key: 'analytics', status: 'PLANNED' as const, icon: BarChart3 },
  { path: '/integrations', key: 'integrations', status: 'LIVE' as const, icon: Network },
];

export function OverviewPage() {
  const { t, locale, learners, attempts, traces, approvedKnowledge, integration } = useEcosystem();
  return <div className="flex flex-col gap-12 lg:gap-20">
    <PageHeader eyebrow={t('overview.eyebrow')} title={t('overview.title')} description={t('overview.description')} action={<div className="flex flex-col gap-3 sm:flex-row"><Link href="/platform" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--green)] px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-[var(--green-accent)]">{t('overview.primary')}<Sparkles aria-hidden="true" size={16} /></Link><Link href="/ai" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] bg-white/[.035] px-5 py-3.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[.08]">{t('overview.secondary')}<BrainCircuit aria-hidden="true" size={16} /></Link></div>} />

    <SectionCard className="bg-[linear-gradient(135deg,rgba(25,201,139,.09),transparent_45%),var(--surface)]" title={t('overview.flowTitle')} detail={t('overview.flowDetail')} icon={Network}>
      <div className="grid gap-3 p-5 sm:p-7 lg:grid-cols-[1fr_auto_1.1fr_auto_1.3fr] lg:items-center">
        <FlowNode title={t('overview.customer')} detail={t('overview.customerDetail')} icon={Layers3} />
        <Connector />
        <FlowNode title={t('overview.core')} detail={t('overview.coreDetail')} icon={Network} active />
        <Connector />
        <FlowNode title={t('overview.modules')} detail={t('overview.modulesDetail')} icon={Sparkles} />
      </div>
      <div className="border-t border-[var(--border)] px-5 py-4 text-xs leading-6 text-slate-500 sm:px-7"><span className="font-semibold text-slate-300">{t('overview.flowLabel')}:</span> {t('overview.flowDetail')}</div>
    </SectionCard>

    <section><div className="mb-7 max-w-xl"><p className="text-[11px] font-bold uppercase tracking-[.22em] text-emerald-300">{t('overview.modulesTitle')}</p><p className="mt-3 text-sm leading-6 text-slate-500">{t('overview.modulesDetail2')}</p></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{modules.map((module) => <ModuleCard key={module.key} path={module.path} title={t(`module.${module.key}`)} kicker={t(`module.${module.key}.kicker`)} description={t(`module.${module.key}.detail`)} status={module.status} icon={module.icon} locale={locale} exploreLabel={t('common.explore')} />)}</div></section>

    <section className="grid gap-8 lg:grid-cols-[.7fr_1.3fr] lg:items-start"><div><p className="text-[11px] font-bold uppercase tracking-[.22em] text-emerald-300">{t('overview.valueTitle')}</p><h2 className="mt-4 text-3xl font-semibold tracking-[-.035em] text-slate-50 sm:text-4xl">{t('overview.valueTitle')}</h2><p className="mt-4 text-sm leading-7 text-slate-400">{t('overview.valueDetail')}</p><ul className="mt-7 flex flex-col gap-4"><Benefit>{t('platform.benefit1')}</Benefit><Benefit>{t('platform.benefit2')}</Benefit><Benefit>{t('platform.benefit3')}</Benefit></ul></div><div className="grid gap-4 md:grid-cols-3"><AudienceCard label={t('overview.student')} title={t('overview.studentTitle')} detail={t('overview.studentDetail')} /><AudienceCard label={t('overview.teacher')} title={t('overview.teacherTitle')} detail={t('overview.teacherDetail')} accent="blue" /><AudienceCard label={t('overview.business')} title={t('overview.businessTitle')} detail={t('overview.businessDetail')} accent="amber" /></div></section>

    <SectionCard title={t('overview.snapshot')} detail={t('overview.snapshotDetail')} icon={CheckCircle2} action={<StatusBadge status={integration ? 'LIVE' : 'PLANNED'} locale={locale} />}><div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-7 xl:grid-cols-4"><MetricCard label={t('overview.learners')} value={learners.length} detail={t('overview.learnersDetail')} icon={UsersRound} /><MetricCard label={t('overview.attempts')} value={attempts.length} detail={t('overview.attemptsDetail')} icon={Activity} tone="blue" /><MetricCard label={t('overview.aiRequests')} value={traces.length} detail={t('overview.aiRequestsDetail')} icon={BrainCircuit} tone="amber" /><MetricCard label={t('overview.knowledge')} value={approvedKnowledge.length} detail={t('overview.knowledgeDetail')} icon={FileCheck2} /></div></SectionCard>

    <section className="rounded-3xl border border-emerald-300/15 bg-emerald-300/[.06] p-6 sm:p-9 lg:flex lg:items-center lg:justify-between lg:gap-8"><div><h2 className="text-2xl font-semibold tracking-[-.025em] text-slate-50 sm:text-3xl">{t('cta.title')}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">{t('cta.detail')}</p></div><Link href="/integrations" className="mt-6 inline-flex shrink-0 items-center justify-center rounded-xl bg-slate-100 px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-white lg:mt-0">{t('cta.action')}</Link></section>
  </div>;
}

function FlowNode({ title, detail, icon: Icon, active = false }: { title: string; detail: string; icon: typeof Network; active?: boolean }) { return <div className={`rounded-2xl border p-5 ${active ? 'border-emerald-300/25 bg-emerald-300/[.08]' : 'border-white/[.07] bg-white/[.035]'}`}><span className="flex size-10 items-center justify-center rounded-xl bg-white/[.07] text-emerald-200"><Icon aria-hidden="true" size={18} /></span><p className="mt-4 text-base font-semibold text-slate-100">{title}</p><p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p></div>; }
function Connector() { return <div className="hidden items-center justify-center lg:flex"><span className="h-px w-10 bg-emerald-300/35" /><span className="-ml-1 size-2 rotate-45 border-r border-t border-emerald-300/60" /></div>; }
