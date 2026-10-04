'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, ArrowRight, BarChart3, BookOpen, BrainCircuit, FileCheck2, GraduationCap, Layers3, LayoutDashboard, Lightbulb, ListChecks, Menu, MessageCircle, Network, PanelsTopLeft, RefreshCw, UserRound, X, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { EcosystemProvider, useEcosystem } from '@/lib/ecosystem-context';
import { capabilityNavigationGroups, capabilityRegistry, type CapabilityKey } from '@/lib/capabilities';
import type { Locale } from '@/lib/i18n';

type NavItem = { path: string; key: string; icon: LucideIcon; label: Record<Locale, string>; detail: Record<Locale, string> };
type NavGroup = { label: Record<Locale, string>; items: NavItem[] };

const capabilityIcons: Record<CapabilityKey, LucideIcon> = {
  ecosystem: LayoutDashboard,
  platform: Layers3,
  tasks: ListChecks,
  variants: PanelsTopLeft,
  theory: BookOpen,
  trainer: GraduationCap,
  whiteboard: PanelsTopLeft,
  learning: Activity,
  ai: BrainCircuit,
  'student-profile': UserRound,
  progress: Activity,
  teacher: Lightbulb,
  analytics: BarChart3,
  knowledge: FileCheck2,
  integrations: Network,
};

const contactItem: NavItem = {
  path: '/ecosystem#contact',
  key: 'contact',
  icon: MessageCircle,
  label: { ru: 'Связаться', en: 'Contact' },
  detail: { ru: 'Обсудить пилот', en: 'Discuss a pilot' },
};

const navGroups: NavGroup[] = capabilityNavigationGroups.map((group) => ({
  label: group.label,
  items: [
    ...group.items.map((key) => {
      const capability = capabilityRegistry[key];
      return {
        path: capability.path,
        key,
        icon: capabilityIcons[key],
        label: capability.label,
        detail: capability.detail,
      };
    }),
    ...(group.key === 'connection' ? [contactItem] : []),
  ],
}));

const nav = navGroups.flatMap((group) => group.items);

export function AppShell({ children }: { children: ReactNode }) {
  return <EcosystemProvider><ShellFrame>{children}</ShellFrame></EcosystemProvider>;
}

function ShellFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t, locale, setLocale, apiStatus, refreshing, reload } = useEcosystem();
  const [hydrated, setHydrated] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const openNavRef = useRef<HTMLButtonElement>(null);
  const closeNavRef = useRef<HTMLButtonElement>(null);
  const active = nav.find((item) => item.path !== '/ecosystem#contact' && pathname.startsWith(item.path)) ?? nav[0];

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.showcase-page');
    if (!root) return;
    const sections = Array.from(root.querySelectorAll<HTMLElement>('.section-reveal'));
    if (!sections.length) return;

    root.classList.add('motion-ready');
    sections.forEach((section, index) => {
      section.style.setProperty('--reveal-delay', `${(index % 3) * 70}ms`);
    });

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      sections.forEach((section) => section.classList.add('is-visible'));
      return () => root.classList.remove('motion-ready');
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.08 },
    );
    sections.forEach((section) => observer.observe(section));

    return () => {
      observer.disconnect();
      root.classList.remove('motion-ready');
      sections.forEach((section) => {
        section.classList.remove('is-visible');
        section.style.removeProperty('--reveal-delay');
      });
    };
  }, [pathname]);

  // Mobile drawer: lock body scroll, handle Escape key, close on overlay click
  useEffect(() => {
    if (!mobileNav) return;
    sidebarRef.current?.scrollTo({ top: 0 });
    closeNavRef.current?.focus();
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileNav(false); };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', onKeyDown);
      openNavRef.current?.focus();
    };
  }, [mobileNav]);

  // Close drawer on navigation (mobile)
  const handleNavClick = () => { if (mobileNav) setMobileNav(false); };

  if (pathname === '/ecosystem') {
    return (
      <MarketingFrame
        locale={locale}
        setLocale={setLocale}
        hydrated={hydrated}
        t={t}
      >
        {children}
      </MarketingFrame>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-slate-100 lg:grid lg:grid-cols-[284px_minmax(0,1fr)]">
      <aside ref={sidebarRef} role={mobileNav ? 'dialog' : undefined} aria-modal={mobileNav ? true : undefined} aria-label={mobileNav ? t('shell.navPrimary') : undefined} className={`fixed inset-y-0 left-0 z-50 flex w-[min(88vw,324px)] flex-col overflow-y-auto border-r border-[var(--border)] bg-[var(--sidebar)] px-5 py-6 transition-transform duration-200 sm:px-6 sm:py-7 lg:sticky lg:top-0 lg:h-screen lg:w-[284px] lg:translate-x-0 ${mobileNav ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between">
          <Brand t={t} onNavigate={handleNavClick} />
          <button ref={closeNavRef} type="button" className="rounded-lg p-2 text-slate-400 hover:bg-white/[.06] hover:text-slate-100 lg:hidden" onClick={() => setMobileNav(false)} aria-label={t('shell.closeNav')}>
            <X aria-hidden="true" />
          </button>
        </div>
        <nav className="mt-9 flex flex-col gap-5 lg:mt-12 lg:gap-7" aria-label={t('shell.navPrimary')}>
          {navGroups.map((group) => <div key={group.label.en}><p className="px-2 text-[10px] font-bold uppercase tracking-[.2em] text-slate-600">{group.label[locale]}</p><div className="mt-3 flex flex-col gap-1.5">{group.items.map((item) => {
            const Icon = item.icon;
            const isActive = active.path === item.path;
            return <Link key={item.path} href={item.path} aria-current={isActive ? 'page' : undefined} onClick={handleNavClick} className={`interactive group flex min-h-11 items-center gap-3 rounded-xl px-3 transition lg:min-h-[52px] ${isActive ? 'bg-emerald-400/[.12] text-emerald-100 ring-1 ring-inset ring-emerald-300/25' : 'text-slate-400 hover:bg-white/[.055] hover:text-slate-100'}`}>
              <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${isActive ? 'bg-emerald-300/15 text-emerald-200' : 'bg-white/[.045] text-slate-500 group-hover:text-slate-300'}`}><Icon aria-hidden="true" size={18} strokeWidth={1.8} /></span>
              <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-semibold">{item.label[locale]}</span><span className="mt-0.5 hidden truncate text-[10px] text-slate-500 group-hover:text-slate-400 lg:block">{item.detail[locale]}</span></span>
              {isActive && <span className="size-1.5 shrink-0 rounded-full bg-emerald-300" />}
            </Link>;
          })}</div></div>)}
        </nav>
        <div className="mt-auto pt-8">
          <div className="flex items-center justify-between px-1 text-[10px] uppercase tracking-[.14em] text-slate-600"><span>Teachly</span><span>Showcase</span></div>
        </div>
      </aside>

      {mobileNav && <button className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden" onClick={() => setMobileNav(false)} aria-label={t('shell.closeNav')} />}

      <main className="min-w-0 lg:ml-0">
        <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--canvas)]/90 backdrop-blur-xl lg:sticky lg:top-0">
          <div className="mx-auto flex min-h-[76px] w-full max-w-[1480px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
            <div className="flex min-w-0 items-center gap-3">
              <button ref={openNavRef} type="button" disabled={!hydrated} className="rounded-xl border border-[var(--border)] bg-white/[.035] p-2.5 text-slate-300 hover:bg-white/[.07] disabled:cursor-wait disabled:opacity-60 lg:hidden" onClick={() => setMobileNav(true)} aria-label={t('shell.openNav')}><Menu aria-hidden="true" /></button>
              <div className="min-w-0"><p className="truncate text-[11px] font-medium uppercase tracking-[.18em] text-slate-500">{t('shell.workspace')}</p><p className="mt-1 truncate text-sm font-semibold text-slate-100">{active.label[locale]}</p></div>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <div className="flex items-center rounded-lg border border-[var(--border)] bg-white/[.03] p-0.5" aria-label={t('shell.language')}>
                {(['ru', 'en'] as const).map((item) => <button key={item} disabled={!hydrated} aria-pressed={locale === item} onClick={() => setLocale(item)} className={`rounded-md px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] disabled:cursor-wait disabled:opacity-60 ${locale === item ? 'bg-white/[.1] text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}>{item}</button>)}
              </div>
              <button onClick={() => void reload()} disabled={refreshing} className="inline-flex size-9 items-center justify-center rounded-lg border border-[var(--border)] bg-white/[.03] text-slate-400 hover:bg-white/[.07] hover:text-slate-100 disabled:cursor-wait disabled:opacity-60" aria-label={t('shell.refresh')} title={t('shell.refresh')}><RefreshCw aria-hidden="true" size={15} className={refreshing ? 'animate-spin' : ''} /></button>
              <div className="hidden items-center gap-2 rounded-full border border-[var(--border)] bg-white/[.03] px-3 py-2 text-[10px] font-semibold uppercase tracking-[.13em] text-slate-400 sm:flex"><span className={`size-1.5 rounded-full ${apiStatus === 'healthy' ? 'bg-emerald-300' : apiStatus === 'checking' ? 'bg-amber-300' : 'bg-slate-500'}`} />{apiStatus === 'healthy' ? t('shell.api.healthy') : apiStatus === 'checking' ? t('shell.api.checking') : t('shell.api.unavailable')}</div>
            </div>
          </div>
        </header>
        <div key={pathname} className="showcase-page mx-auto w-full max-w-[1480px] px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14 xl:px-12 xl:py-16">{children}</div>
      </main>
    </div>
  );
}

const marketingNavigation = {
  ru: {
    how: 'Как работает',
    modules: 'Возможности',
    integration: 'Интеграция',
    demo: 'Живое демо',
    contact: 'Обсудить пилот',
    footer: 'Образовательные модули и интеллект для вашего продукта.',
  },
  en: {
    how: 'How it works',
    modules: 'Capabilities',
    integration: 'Integration',
    demo: 'Live demo',
    contact: 'Discuss a pilot',
    footer: 'Learning modules and intelligence for your product.',
  },
} as const;

function MarketingFrame({
  children,
  locale,
  setLocale,
  hydrated,
  t,
}: {
  children: ReactNode;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  hydrated: boolean;
  t: (key: string) => string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const c = marketingNavigation[locale];

  useEffect(() => {
    if (!menuOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', close);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', close);
    };
  }, [menuOpen]);

  const navigation = (
    <>
      <a href="#how" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/[.055] hover:text-white">{c.how}</a>
      <a href="#modules" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/[.055] hover:text-white">{c.modules}</a>
      <Link href="/integrations" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/[.055] hover:text-white">{c.integration}</Link>
      <Link href="/trainer" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/[.055] hover:text-white">{c.demo}</Link>
    </>
  );

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[var(--canvas)] text-slate-100">
      <div className="marketing-ambient pointer-events-none fixed inset-0 z-0" aria-hidden="true"><span className="ambient-orb ambient-orb-a" /><span className="ambient-orb ambient-orb-b" /></div>
      <header className="header-glass sticky top-0 z-40 border-b border-white/[.07] bg-[#070b12]/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[78px] w-full max-w-[1400px] items-center justify-between gap-5 px-5 sm:px-8 lg:px-12">
          <Brand t={t} onNavigate={() => setMenuOpen(false)} />
          <nav className="hidden items-center gap-1 lg:flex" aria-label={t('shell.navPrimary')}>
            {navigation}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center rounded-lg border border-[var(--border)] bg-white/[.03] p-0.5 sm:flex" aria-label={t('shell.language')}>
              {(['ru', 'en'] as const).map((item) => <button key={item} disabled={!hydrated} aria-pressed={locale === item} onClick={() => setLocale(item)} className={`rounded-md px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] disabled:cursor-wait disabled:opacity-60 ${locale === item ? 'bg-white/[.1] text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}>{item}</button>)}
            </div>
            <a href="#contact" className="interactive hidden items-center gap-2 rounded-xl bg-emerald-300 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_14px_36px_-20px_rgba(69,230,168,.8)] hover:-translate-y-0.5 hover:bg-emerald-200 sm:inline-flex">
              {c.contact}
              <ArrowRight aria-hidden="true" size={15} />
            </a>
            <button type="button" disabled={!hydrated} onClick={() => setMenuOpen(true)} className="rounded-xl border border-[var(--border)] bg-white/[.035] p-2.5 text-slate-300 disabled:cursor-wait disabled:opacity-60 lg:hidden" aria-label={t('shell.openNav')}>
              <Menu aria-hidden="true" size={21} />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm" onClick={() => setMenuOpen(false)} aria-label={t('shell.closeNav')} />
          <div role="dialog" aria-modal="true" aria-label={t('shell.navPrimary')} className="absolute inset-x-4 top-4 rounded-[28px] border border-[var(--border-strong)] bg-[var(--sidebar)] p-5 shadow-2xl sm:left-auto sm:w-[380px]">
            <div className="flex items-center justify-between">
              <Brand t={t} onNavigate={() => setMenuOpen(false)} />
              <button type="button" onClick={() => setMenuOpen(false)} className="rounded-xl border border-[var(--border)] p-2.5 text-slate-300" aria-label={t('shell.closeNav')}><X aria-hidden="true" size={20} /></button>
            </div>
            <nav className="mt-7 flex flex-col gap-1" aria-label={t('shell.navPrimary')}>
              {navigation}
            </nav>
            <div className="mt-6 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-5">
              <div className="flex items-center rounded-lg border border-[var(--border)] bg-white/[.03] p-0.5" aria-label={t('shell.language')}>
                {(['ru', 'en'] as const).map((item) => <button key={item} aria-pressed={locale === item} onClick={() => setLocale(item)} className={`rounded-md px-3 py-2 text-[10px] font-bold uppercase tracking-[.12em] ${locale === item ? 'bg-white/[.1] text-slate-100' : 'text-slate-500'}`}>{item}</button>)}
              </div>
              <a href="#contact" onClick={() => setMenuOpen(false)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-4 py-3 text-sm font-semibold text-slate-950">{c.contact}<ArrowRight aria-hidden="true" size={15} /></a>
            </div>
          </div>
        </div>
      )}

      <main className="relative z-10">
        <div className="showcase-page mx-auto w-full max-w-[1400px] px-5 pb-16 pt-8 sm:px-8 sm:pt-12 lg:px-12 lg:pb-24">{children}</div>
      </main>
      <footer className="border-t border-[var(--border)]">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <span>© 2026 Teachly</span>
          <span>{c.footer}</span>
        </div>
      </footer>
    </div>
  );
}

function Brand({ t, onNavigate }: { t: (key: string) => string; onNavigate: () => void }) {
  return <Link href="/ecosystem" onClick={onNavigate} className="group flex items-center gap-3 rounded-xl px-1 py-1 transition hover:opacity-95 focus-visible:outline-none"><div className="relative size-11" aria-hidden="true"><span className="brand-tile brand-tile-a absolute left-0 top-0 size-5 rounded-[6px] bg-emerald-300" /><span className="brand-tile brand-tile-b absolute right-0 top-0 size-5 rounded-[6px] bg-cyan-300" /><span className="brand-tile brand-tile-c absolute bottom-0 left-[12px] size-5 rounded-[6px] bg-emerald-500" /></div><div><div className="text-lg font-semibold tracking-tight text-slate-100">Teachly</div><div className="mt-0.5 text-[10px] uppercase tracking-[.22em] text-emerald-300/70">{t('brand.eyebrow')}</div></div></Link>;
}
