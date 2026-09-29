'use client';

import { ArrowDown, ArrowUp, Layers3, Network, ShieldCheck, Sparkles, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { useEcosystem } from '@/lib/ecosystem-context';
import { IconCard, InfoRow, PageHeader, SectionCard, StatusBadge } from '@/components/ui';

export function PlatformPage() {
  const { t, locale, integration, externalUsers, traces } = useEcosystem();
  const [details, setDetails] = useState(false);
  return <div className="flex flex-col gap-12 lg:gap-16">
    <PageHeader eyebrow={t('platform.eyebrow')} title={t('platform.title')} description={t('platform.description')} action={<StatusBadge status="LIVE" locale={locale} />} />
    <SectionCard title={t('platform.flowTitle')} icon={Network}><div className="grid gap-3 p-5 sm:p-7 lg:grid-cols-[1fr_auto_1.15fr_auto_1fr] lg:items-center"><Flow title={t('platform.customer')} detail={t('platform.customerDetail')} icon={UsersRound} /><Arrow /><Flow title={t('platform.core')} detail={t('platform.coreDetail')} icon={Network} active /><Arrow /><Flow title={t('platform.modules')} detail={t('platform.modulesDetail')} icon={Layers3} /></div></SectionCard>
    <div className="grid gap-4 md:grid-cols-3"><IconCard icon={ShieldCheck} title={t('platform.benefit1')} detail={t('platform.benefit1Detail')} /><IconCard icon={Sparkles} title={t('platform.benefit2')} detail={t('platform.benefit2Detail')} /><IconCard icon={Layers3} title={t('platform.benefit3')} detail={t('platform.benefit3Detail')} /></div>
    <SectionCard title={t('platform.connection')} detail={t('platform.connectionDetail')} icon={Network} action={<StatusBadge status={integration ? 'LIVE' : 'PLANNED'} locale={locale} />}>
      <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7"><Stat label={t('platform.connected')} value={integration?.name ?? t('common.noData')} /><Stat label={t('platform.users')} value={String(externalUsers.length)} /><Stat label={t('platform.history')} value={String(traces.length)} /></div>
      <div className="border-t border-[var(--border)] px-5 py-4 sm:px-7"><button onClick={() => setDetails((value) => !value)} className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-200 hover:text-emerald-100">{details ? t('platform.hideDetails') : t('platform.details')}{details ? <ArrowUp aria-hidden="true" size={14} /> : <ArrowDown aria-hidden="true" size={14} />}</button>{details && <div className="mt-5 grid gap-4 md:grid-cols-2"><div className="rounded-2xl bg-[var(--surface-raised)] p-5"><InfoRow label="Status" value={integration?.status ?? '—'} tone="green" /><div className="mt-4"><InfoRow label="Organization" value={integration?.organizationId.slice(0, 8) ?? '—'} mono /></div></div><p className="rounded-2xl bg-[var(--surface-raised)] p-5 text-sm leading-6 text-slate-500">{t('platform.note')}</p></div>}</div>
    </SectionCard>
  </div>;
}

function Flow({ title, detail, icon: Icon, active = false }: { title: string; detail: string; icon: typeof Network; active?: boolean }) { return <div className={`rounded-2xl border p-5 ${active ? 'border-emerald-300/25 bg-emerald-300/[.08]' : 'border-white/[.07] bg-white/[.035]'}`}><span className="flex size-10 items-center justify-center rounded-xl bg-white/[.07] text-emerald-200"><Icon aria-hidden="true" size={18} /></span><p className="mt-4 text-base font-semibold text-slate-100">{title}</p><p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p></div>; }
function Arrow() { return <div className="hidden items-center justify-center lg:flex"><span className="h-px w-10 bg-emerald-300/35" /><span className="-ml-1 size-2 rotate-45 border-r border-t border-emerald-300/60" /></div>; }
function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-[var(--surface-raised)] p-5"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-slate-500">{label}</p><p className="mt-3 break-words text-base font-semibold text-slate-100">{value}</p></div>; }
