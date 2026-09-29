import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, Check } from 'lucide-react';
import { StatusBadge } from '@/components/ui';
import type { Locale } from '@/lib/i18n';

export function shortId(value: string) { return `${value.slice(0, 8)}...${value.slice(-4)}`; }
export function ModuleCard({ path, title, kicker, description, status, icon: Icon, locale, exploreLabel = 'Explore' }: { path: string; title: string; kicker: string; description: string; status: 'LIVE' | 'COMING NEXT' | 'PLANNED'; icon: LucideIcon; locale: Locale; exploreLabel?: string }) {
  return <Link href={path} className="group flex min-h-[216px] flex-col rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 transition hover:-translate-y-1 hover:border-emerald-300/30 hover:bg-[var(--surface-raised)]"><div className="flex items-start justify-between gap-2"><span className="flex size-12 items-center justify-center rounded-2xl bg-white/[.055] text-emerald-200"><Icon aria-hidden="true" size={21} /></span><StatusBadge status={status} locale={locale} /></div><p className="mt-6 text-lg font-semibold text-slate-100">{title}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">{kicker}</p><p className="mt-3 text-sm leading-6 text-slate-400 group-hover:text-slate-300">{description}</p><span className="mt-auto flex items-center gap-1.5 pt-5 text-xs font-semibold text-emerald-200">{exploreLabel}<ArrowRight aria-hidden="true" size={14} className="transition group-hover:translate-x-1" /></span></Link>;
}

export function PipelineStep({ index, title, detail, icon: Icon, last = false }: { index: string; title: string; detail: string; icon: LucideIcon; last?: boolean }) {
  return <div className="relative rounded-2xl bg-[var(--surface-raised)] p-5"><div className="flex items-center justify-between"><span className="flex size-10 items-center justify-center rounded-xl bg-emerald-300/10 text-emerald-200"><Icon aria-hidden="true" size={17} /></span><span className="font-mono text-[10px] text-slate-600">{index}</span></div><p className="mt-5 text-sm font-semibold text-slate-200">{title}</p><p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>{!last && <ArrowRight aria-hidden="true" className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 text-emerald-300/50 lg:block" size={16} />}</div>;
}

export function AudienceCard({ label, title, detail, accent = 'green' }: { label: string; title: string; detail: string; accent?: 'green' | 'blue' | 'amber' }) {
  const color = accent === 'green' ? 'text-emerald-200' : accent === 'blue' ? 'text-blue-200' : 'text-amber-200';
  return <div className="rounded-2xl bg-[var(--surface-raised)] p-5"><p className={`text-[10px] font-bold uppercase tracking-[.17em] ${color}`}>{label}</p><p className="mt-4 text-base font-semibold text-slate-200">{title}</p><p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p></div>;
}

export function Benefit({ children }: { children: string }) { return <li className="flex items-start gap-3 text-sm leading-6 text-slate-400"><span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-300/10 text-emerald-200"><Check aria-hidden="true" size={12} /></span>{children}</li>; }
export function PlaceholderCode({ children }: { children: string }) { return <pre className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[#070b12] p-5 font-mono text-[11px] leading-6 text-slate-500"><code>{children}</code></pre>; }
