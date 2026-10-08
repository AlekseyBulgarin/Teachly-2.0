import type { LucideIcon } from 'lucide-react';
import { CircleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Locale } from '@/lib/i18n';

export function StatusBadge({ status, locale }: { status: 'LIVE' | 'COMING NEXT' | 'PLANNED' | string; locale: Locale }) {
  const normalized = status.toUpperCase();
  const live = normalized === 'LIVE' || normalized === 'APPROVED' || normalized === 'ALLOWED' || normalized === 'ACTIVE';
  const demo = normalized === 'DEMO';
  const next = normalized === 'COMING NEXT' || normalized === 'REVIEW' || normalized === 'NOT_REVIEWED';
  const text = normalized === 'LIVE' ? 'LIVE' : normalized === 'DEMO' ? (locale === 'ru' ? 'ДЕМО' : 'DEMO') : normalized === 'COMING NEXT' ? (locale === 'ru' ? 'СКОРО' : 'COMING NEXT') : normalized === 'PLANNED' ? (locale === 'ru' ? 'В ПЛАНАХ' : 'PLANNED') : status.replaceAll('_', ' ');
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.14em] ${live ? 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200' : demo ? 'border-cyan-300/25 bg-cyan-300/10 text-cyan-200' : next ? 'border-amber-300/25 bg-amber-300/10 text-amber-200' : 'border-white/10 bg-white/[.05] text-slate-400'}`}><span className={`size-1.5 rounded-full ${live ? 'bg-emerald-300' : demo ? 'bg-cyan-300' : next ? 'bg-amber-300' : 'bg-slate-500'}`} />{text}</span>;
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="shine-surface relative mb-10 overflow-hidden rounded-[32px] border border-white/[.08] bg-[radial-gradient(circle_at_12%_10%,rgba(25,201,139,.11),transparent_32%),linear-gradient(135deg,rgba(255,255,255,.025),transparent_52%),var(--surface)] p-6 shadow-[0_34px_110px_-70px_rgba(25,201,139,.55)] sm:p-8 lg:mb-12"><div className="hero-grid-motion pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.015)_1px,transparent_1px)] bg-[size:42px_42px] [mask-image:linear-gradient(to_right,black,transparent_82%)]" /><div className="relative flex flex-col items-start gap-7 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-4xl"><p className="text-[11px] font-bold uppercase tracking-[.24em] text-emerald-300">{eyebrow}</p><h1 className="mt-4 text-[clamp(2.25rem,4.2vw,3.4rem)] font-semibold leading-[1.04] tracking-[-.05em] text-slate-50">{title}</h1><p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 sm:text-[17px] sm:leading-8">{description}</p></div>{action}</div></div>;
}

export function SectionCard({ children, className = '', title, detail, icon: Icon, action }: { children: ReactNode; className?: string; title?: string; detail?: string; icon?: LucideIcon; action?: ReactNode }) {
  return <section className={`relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-[linear-gradient(150deg,rgba(255,255,255,.025),transparent_46%),var(--surface)] shadow-[0_30px_90px_-58px_rgba(0,0,0,.98)] ${className}`}>{title && <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-6 sm:px-7 sm:py-7"><div className="group flex items-start gap-3.5">{Icon && <span className="motion-icon flex size-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/10 bg-emerald-300/[.08] text-emerald-200"><Icon aria-hidden="true" size={19} /></span>}<div><h2 className="text-lg font-semibold tracking-[-.015em] text-slate-50">{title}</h2>{detail && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{detail}</p>}</div></div>{action}</div>}{children}</section>;
}

export function IconCard({ icon: Icon, title, detail, status, locale, hint }: { icon: LucideIcon; title: string; detail: string; status?: 'LIVE' | 'COMING NEXT' | 'PLANNED'; locale?: Locale; hint?: string }) {
  return <div tabIndex={hint ? 0 : undefined} className={`card-lift group rounded-3xl border border-[var(--border)] bg-[linear-gradient(150deg,rgba(255,255,255,.026),transparent_52%),var(--surface)] p-6 transition hover:border-emerald-300/20 hover:bg-[var(--surface-raised)] ${hint ? 'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60' : ''}`}><div className="flex items-start justify-between gap-3"><span className="motion-icon flex size-11 items-center justify-center rounded-2xl border border-white/[.04] bg-white/[.055] text-emerald-200"><Icon aria-hidden="true" size={20} /></span>{status && locale && <StatusBadge status={status} locale={locale} />}</div><h3 className="mt-5 text-lg font-semibold tracking-[-.015em] text-slate-100">{title}</h3>{detail && <p className="mt-2 text-[15px] leading-7 text-slate-400">{detail}</p>}{hint && <p className="mt-2 text-[13px] leading-6 text-slate-400 opacity-100 transition-opacity duration-200 md:opacity-0 md:group-hover:opacity-100 md:group-focus:opacity-100 md:group-focus-within:opacity-100">{hint}</p>}</div>;
}

export function MetricCard({ label, value, detail, icon: Icon, tone = 'green' }: { label: string; value: string | number; detail: string; icon: LucideIcon; tone?: 'green' | 'blue' | 'amber' }) {
  const color = tone === 'green' ? 'text-emerald-200 bg-emerald-300/10' : tone === 'blue' ? 'text-blue-200 bg-blue-300/10' : 'text-amber-200 bg-amber-300/10';
  return <div className="card-lift group rounded-3xl border border-[var(--border)] bg-[linear-gradient(145deg,rgba(255,255,255,.025),transparent_55%),var(--surface)] p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-slate-500">{label}</p><p className="mt-4 text-3xl font-semibold tracking-[-.04em] text-slate-50">{value}</p><p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p></div><span className={`motion-icon flex size-10 items-center justify-center rounded-xl ${color}`}><Icon aria-hidden="true" size={18} /></span></div></div>;
}

export function Fact({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div className="rounded-2xl bg-[var(--surface-raised)] p-4"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-slate-500">{label}</p><p className={`mt-2 break-words text-sm font-medium text-slate-200 ${mono ? 'font-mono text-xs' : ''}`}>{value}</p></div>;
}

export function InfoRow({ label, value, mono = false, tone = 'normal' }: { label: string; value: string; mono?: boolean; tone?: 'normal' | 'green' }) {
  return <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] pb-3 last:border-b-0 last:pb-0"><span className="text-xs text-slate-500">{label}</span><span className={`text-right text-xs ${tone === 'green' ? 'text-emerald-200' : 'text-slate-300'} ${mono ? 'font-mono' : ''}`}>{value}</span></div>;
}

export function EmptyState({ text }: { text: string }) { return <div className="flex min-h-[140px] items-center justify-center px-6 text-center text-sm text-slate-500">{text}</div>; }
export function ErrorState({ message, retry, retryLabel }: { message: string; retry: () => void; retryLabel: string; dismiss?: () => void; dismissLabel?: string }) { return <div role="status" className="flex flex-col gap-3 rounded-2xl border border-amber-300/15 bg-amber-300/[.06] p-4 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><CircleAlert aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-amber-200" /><span>{message}</span></div><button onClick={retry} className="rounded-lg border border-amber-200/20 px-3 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-200/10">{retryLabel}</button></div>; }
