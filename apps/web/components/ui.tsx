import type { LucideIcon } from 'lucide-react';
import { CircleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Locale } from '@/lib/i18n';

export function StatusBadge({ status, locale }: { status: 'LIVE' | 'COMING NEXT' | 'PLANNED' | string; locale: Locale }) {
  const normalized = status.toUpperCase();
  const live = normalized === 'LIVE' || normalized === 'APPROVED' || normalized === 'ALLOWED' || normalized === 'ACTIVE';
  const next = normalized === 'COMING NEXT' || normalized === 'REVIEW' || normalized === 'NOT_REVIEWED';
  const text = normalized === 'LIVE' ? 'LIVE' : normalized === 'COMING NEXT' ? (locale === 'ru' ? 'СКОРО' : 'COMING NEXT') : normalized === 'PLANNED' ? (locale === 'ru' ? 'В ПЛАНАХ' : 'PLANNED') : status.replaceAll('_', ' ');
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.14em] ${live ? 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200' : next ? 'border-amber-300/25 bg-amber-300/10 text-amber-200' : 'border-white/10 bg-white/[.05] text-slate-400'}`}><span className={`size-1.5 rounded-full ${live ? 'bg-emerald-300' : next ? 'bg-amber-300' : 'bg-slate-500'}`} />{text}</span>;
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="mb-12 flex flex-col gap-7 lg:mb-16 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-3xl"><p className="text-[11px] font-bold uppercase tracking-[.24em] text-emerald-300">{eyebrow}</p><h1 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-[-.045em] text-slate-50 sm:text-5xl lg:text-[64px]">{title}</h1><p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-[17px]">{description}</p></div>{action}</div>;
}

export function SectionCard({ children, className = '', title, detail, icon: Icon, action }: { children: ReactNode; className?: string; title?: string; detail?: string; icon?: LucideIcon; action?: ReactNode }) {
  return <section className={`overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_28px_80px_-52px_rgba(0,0,0,.95)] ${className}`}>{title && <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-6 sm:px-7"><div className="flex items-start gap-3">{Icon && <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-300/10 text-emerald-200"><Icon aria-hidden="true" size={18} /></span>}<div><h2 className="text-lg font-semibold text-slate-50">{title}</h2>{detail && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{detail}</p>}</div></div>{action}</div>}{children}</section>;
}

export function IconCard({ icon: Icon, title, detail, status, locale, hint }: { icon: LucideIcon; title: string; detail: string; status?: 'LIVE' | 'COMING NEXT' | 'PLANNED'; locale?: Locale; hint?: string }) {
  return <div tabIndex={hint ? 0 : undefined} className={`group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition hover:-translate-y-0.5 hover:border-[var(--border-strong)] ${hint ? 'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60' : ''}`}><div className="flex items-start justify-between gap-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-white/[.055] text-emerald-200"><Icon aria-hidden="true" size={20} /></span>{status && locale && <StatusBadge status={status} locale={locale} />}</div><h3 className="mt-5 text-lg font-semibold text-slate-100">{title}</h3>{detail && <p className="mt-2 text-[15px] leading-7 text-slate-400">{detail}</p>}{hint && <p className="mt-2 text-[13px] leading-6 text-slate-400 opacity-100 transition-opacity duration-200 md:opacity-0 md:group-hover:opacity-100 md:group-focus:opacity-100 md:group-focus-within:opacity-100">{hint}</p>}</div>;
}

export function MetricCard({ label, value, detail, icon: Icon, tone = 'green' }: { label: string; value: string | number; detail: string; icon: LucideIcon; tone?: 'green' | 'blue' | 'amber' }) {
  const color = tone === 'green' ? 'text-emerald-200 bg-emerald-300/10' : tone === 'blue' ? 'text-blue-200 bg-blue-300/10' : 'text-amber-200 bg-amber-300/10';
  return <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-slate-500">{label}</p><p className="mt-4 text-3xl font-semibold tracking-[-.03em] text-slate-50">{value}</p><p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p></div><span className={`flex size-10 items-center justify-center rounded-xl ${color}`}><Icon aria-hidden="true" size={18} /></span></div></div>;
}

export function Fact({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div className="rounded-2xl bg-[var(--surface-raised)] p-4"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-slate-500">{label}</p><p className={`mt-2 break-words text-sm font-medium text-slate-200 ${mono ? 'font-mono text-xs' : ''}`}>{value}</p></div>;
}

export function InfoRow({ label, value, mono = false, tone = 'normal' }: { label: string; value: string; mono?: boolean; tone?: 'normal' | 'green' }) {
  return <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] pb-3 last:border-b-0 last:pb-0"><span className="text-xs text-slate-500">{label}</span><span className={`text-right text-xs ${tone === 'green' ? 'text-emerald-200' : 'text-slate-300'} ${mono ? 'font-mono' : ''}`}>{value}</span></div>;
}

export function EmptyState({ text }: { text: string }) { return <div className="flex min-h-[140px] items-center justify-center px-6 text-center text-sm text-slate-500">{text}</div>; }
export function ErrorState({ message, retry, retryLabel }: { message: string; retry: () => void; retryLabel: string; dismiss?: () => void; dismissLabel?: string }) { return <div role="status" className="flex flex-col gap-3 rounded-2xl border border-amber-300/15 bg-amber-300/[.06] p-4 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><CircleAlert aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-amber-200" /><span>{message}</span></div><button onClick={retry} className="rounded-lg border border-amber-200/20 px-3 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-200/10">{retryLabel}</button></div>; }
