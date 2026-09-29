'use client';

import { ArrowRight, Database, Layers3, Network, ShieldCheck, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { useEcosystem } from '@/lib/ecosystem-context';
import { InfoRow, MetricCard, PageHeader, SectionCard, StatusBadge } from '@/components/ui';
import { PipelineStep, PlaceholderCode } from '@/components/showcase/shared';

const requestExample = `POST /v1/remediations
Authorization: Bearer <SERVER_SIDE_KEY>

{ "externalUserId": "...", "attemptId": "..." }`;

export function IntegrationsPage() {
  const { t, locale, integration, externalUsers, traces } = useEcosystem();
  const [details, setDetails] = useState(false);
  return <div className="flex flex-col gap-12 lg:gap-16">
    <PageHeader eyebrow={t('integrations.eyebrow')} title={t('integrations.title')} description={t('integrations.description')} action={<StatusBadge status={integration ? 'LIVE' : 'PLANNED'} locale={locale} />} />
    <SectionCard title={t('integrations.flowTitle')} icon={Network}><div className="grid gap-3 p-5 sm:p-7 lg:grid-cols-3"><PipelineStep index="01" title={t('integrations.step1')} detail={t('integrations.step1Detail')} icon={Database} /><PipelineStep index="02" title={t('integrations.step2')} detail={t('integrations.step2Detail')} icon={ShieldCheck} /><PipelineStep index="03" title={t('integrations.step3')} detail={t('integrations.step3Detail')} icon={Layers3} last /></div></SectionCard>
    <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]"><SectionCard title={t('integrations.connectionTitle')} detail={t('integrations.connectionDetail')} icon={Network} action={<StatusBadge status={integration ? 'LIVE' : 'PLANNED'} locale={locale} />}><div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7"><MetricCard label={t('integrations.connected')} value={integration?.name ?? t('common.noData')} detail={t('integrations.connectionDetail')} icon={Network} /><MetricCard label={t('integrations.users')} value={externalUsers.length} detail={t('overview.learnersDetail')} icon={UsersRound} tone="blue" /><MetricCard label={t('integrations.traces')} value={traces.length} detail={t('overview.aiRequestsDetail')} icon={Layers3} tone="amber" /></div><div className="border-t border-[var(--border)] px-5 py-4 sm:px-7"><button onClick={() => setDetails((value) => !value)} className="text-xs font-semibold text-emerald-200 hover:text-emerald-100">{details ? t('platform.hideDetails') : t('integrations.details')}</button>{details && <div className="mt-5 grid gap-4 md:grid-cols-2"><div className="rounded-2xl bg-[var(--surface-raised)] p-5"><InfoRow label={t('common.status')} value={integration?.status ?? '—'} tone="green" /><div className="mt-4"><InfoRow label="Workspace" value={integration?.workspaceId.slice(0, 8) ?? '—'} mono /></div></div><p className="rounded-2xl bg-[var(--surface-raised)] p-5 text-sm leading-6 text-slate-500">{t('integrations.detailsNote')}</p></div>}</div></SectionCard><section className="rounded-3xl border border-emerald-300/15 bg-emerald-300/[.05] p-6 sm:p-8"><p className="text-[11px] font-bold uppercase tracking-[.22em] text-emerald-300">{t('integrations.details')}</p><h2 className="mt-4 text-2xl font-semibold tracking-[-.025em] text-slate-50">{t('integrations.description')}</h2><p className="mt-4 text-sm leading-6 text-slate-400">{t('integrations.detailsNote')}</p></section></div>
    <SectionCard title={t('integrations.futureTitle')} detail={t('integrations.futureDetail')} icon={Layers3}><div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-4"><Future title={t('integrations.sdk')} /><Future title={t('integrations.webhooks')} /><Future title={t('integrations.sso')} /><Future title={t('integrations.lti')} /></div></SectionCard>
    <SectionCard title={t('integrations.details')} detail={t('integrations.detailsNote')} icon={ArrowRight}><div className="p-5 sm:p-7"><PlaceholderCode>{requestExample}</PlaceholderCode></div></SectionCard>
  </div>;
}

function Future({ title }: { title: string }) { return <div className="flex items-center justify-between rounded-2xl bg-[var(--surface-raised)] p-4"><span className="text-sm font-medium text-slate-300">{title}</span><span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.14em] text-slate-500">Planned</span></div>; }
