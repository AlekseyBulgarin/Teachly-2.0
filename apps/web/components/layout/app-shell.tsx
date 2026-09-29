'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, BarChart3, BookOpen, BrainCircuit, Layers3, Lightbulb, Menu, Network, RefreshCw, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { EcosystemProvider, useEcosystem } from '@/lib/ecosystem-context';

const nav = [
  { path: '/ecosystem', key: 'ecosystem', icon: Layers3 },
  { path: '/platform', key: 'platform', icon: Network },
  { path: '/learning', key: 'learning', icon: Activity },
  { path: '/ai', key: 'ai', icon: BrainCircuit },
  { path: '/teacher', key: 'teacher', icon: Lightbulb },
  { path: '/knowledge', key: 'knowledge', icon: BookOpen },
  { path: '/analytics', key: 'analytics', icon: BarChart3 },
  { path: '/integrations', key: 'integrations', icon: Network },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return <EcosystemProvider><ShellFrame>{children}</ShellFrame></EcosystemProvider>;
}

function ShellFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t, locale, setLocale, apiStatus, refreshing, reload } = useEcosystem();
  const [mobileNav, setMobileNav] = useState(false);
  const active = nav.find((item) => pathname.startsWith(item.path)) ?? nav[0];

  // Mobile drawer: lock body scroll, handle Escape key, close on overlay click
  useEffect(() => {
    if (!mobileNav) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileNav(false); };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.body.style.overflow = originalOverflow; document.removeEventListener('keydown', onKeyDown); };
  }, [mobileNav]);

  // Close drawer on navigation (mobile)
  const handleNavClick = () => { if (mobileNav) setMobileNav(false); };

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-slate-100 lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[min(88vw,320px)] flex-col border-r border-[var(--border)] bg-[var(--sidebar)] px-5 py-6 transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:w-[280px] lg:translate-x-0 ${mobileNav ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between">
          <Brand t={t} />
          <button className="rounded-lg p-2 text-slate-400 hover:bg-white/[.06] hover:text-slate-100 lg:hidden" onClick={() => setMobileNav(false)} aria-label={t('shell.closeNav')}>
            <X aria-hidden="true" />
          </button>
        </div>
        <div className="mt-12 px-2 text-[10px] font-semibold uppercase tracking-[.24em] text-slate-500">{t('shell.navigate')}</div>
        <nav className="mt-4 flex flex-col gap-1.5" aria-label={t('shell.navPrimary')}>
          {nav.map((item) => {
            const Icon = item.icon;
            const isActive = active.path === item.path;
            return <Link key={item.path} href={item.path} aria-current={isActive ? 'page' : undefined} onClick={handleNavClick} className={`group flex min-h-12 items-center gap-3 rounded-xl px-3.5 transition ${isActive ? 'bg-emerald-400/[.12] text-emerald-100 ring-1 ring-inset ring-emerald-300/25' : 'text-slate-400 hover:bg-white/[.055] hover:text-slate-100'}`}>
              <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${isActive ? 'bg-emerald-300/15 text-emerald-200' : 'bg-white/[.045] text-slate-500 group-hover:text-slate-300'}`}><Icon aria-hidden="true" size={17} strokeWidth={1.8} /></span>
              <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-medium">{t(`nav.${item.key}`)}</span><span className="mt-0.5 block truncate text-[10px] text-slate-500 group-hover:text-slate-400">{t(`nav.${item.key}.detail`)}</span></span>
              {isActive && <span className="size-1.5 shrink-0 rounded-full bg-emerald-300" />}
            </Link>;
          })}
        </nav>
        <div className="mt-auto pt-8">
          <div className="rounded-2xl border border-white/[.08] bg-white/[.035] p-4">
            <p className="flex items-center gap-2 text-xs font-semibold text-slate-200"><span className="size-2 rounded-full bg-emerald-300" />{t('shell.reference')}</p>
            <p className="mt-2 text-[11px] leading-5 text-slate-500">{t('shell.reference.detail')}</p>
          </div>
          <div className="mt-5 flex items-center justify-between px-1 text-[10px] uppercase tracking-[.14em] text-slate-600"><span>Teachly</span><span>Showcase</span></div>
        </div>
      </aside>

      {mobileNav && <button className="fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-sm lg:hidden" onClick={() => setMobileNav(false)} aria-label={t('shell.closeNav')} aria-hidden="true" />}

      <main className="min-w-0 lg:ml-0">
        <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--canvas)]/90 backdrop-blur-xl lg:sticky lg:top-0">
          <div className="mx-auto flex min-h-[76px] w-full max-w-[1480px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
            <div className="flex min-w-0 items-center gap-3">
              <button className="rounded-xl border border-[var(--border)] bg-white/[.035] p-2.5 text-slate-300 hover:bg-white/[.07] lg:hidden" onClick={() => setMobileNav(true)} aria-label={t('shell.openNav')}><Menu aria-hidden="true" /></button>
              <div className="min-w-0"><p className="truncate text-[11px] font-medium uppercase tracking-[.18em] text-slate-500">{t('shell.workspace')}</p><p className="mt-1 truncate text-sm font-semibold text-slate-100">{t(`nav.${active.key}`)}</p></div>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <div className="flex items-center rounded-lg border border-[var(--border)] bg-white/[.03] p-0.5" aria-label={t('shell.language')}>
                {(['ru', 'en'] as const).map((item) => <button key={item} aria-pressed={locale === item} onClick={() => setLocale(item)} className={`rounded-md px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] ${locale === item ? 'bg-white/[.1] text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}>{item}</button>)}
              </div>
              <button onClick={() => void reload()} disabled={refreshing} className="inline-flex size-9 items-center justify-center rounded-lg border border-[var(--border)] bg-white/[.03] text-slate-400 hover:bg-white/[.07] hover:text-slate-100 disabled:cursor-wait disabled:opacity-60" aria-label={t('shell.refresh')} title={t('shell.refresh')}><RefreshCw aria-hidden="true" size={15} className={refreshing ? 'animate-spin' : ''} /></button>
              <div className="hidden items-center gap-2 rounded-full border border-[var(--border)] bg-white/[.03] px-3 py-2 text-[10px] font-semibold uppercase tracking-[.13em] text-slate-400 sm:flex"><span className={`size-1.5 rounded-full ${apiStatus === 'healthy' ? 'bg-emerald-300' : apiStatus === 'checking' ? 'bg-amber-300' : 'bg-slate-500'}`} />{apiStatus === 'healthy' ? t('shell.api.healthy') : apiStatus === 'checking' ? t('shell.api.checking') : t('shell.api.unavailable')}</div>
            </div>
          </div>
        </header>
        <div className="mx-auto w-full max-w-[1480px] px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-16">{children}</div>
      </main>
    </div>
  );
}

function Brand({ t }: { t: (key: string) => string }) {
  return <div className="flex items-center gap-3 px-1"><div className="relative size-10" aria-hidden="true"><span className="absolute left-0 top-0 size-[18px] rounded-[5px] bg-emerald-300" /><span className="absolute right-0 top-0 size-[18px] rounded-[5px] bg-cyan-300" /><span className="absolute bottom-0 left-[11px] size-[18px] rounded-[5px] bg-emerald-500" /></div><div><div className="text-base font-semibold tracking-tight text-slate-100">Teachly</div><div className="mt-0.5 text-[10px] uppercase tracking-[.22em] text-emerald-300/70">{t('brand.eyebrow')}</div></div></div>;
}
