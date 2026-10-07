"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, Bot, CheckCircle2, Clock3, Database, RefreshCw, Server } from 'lucide-react';

type Point = { timestamp: number; value: number };
type Series = { labels: Record<string, string>; points: Point[] };
type Panel = {
  id: string; title: string; description: string; kind: 'stat' | 'timeseries'; unit: string;
  status: 'ok' | 'empty' | 'error' | 'not_configured'; alert: 'healthy' | 'warning' | 'critical' | 'unknown';
  message: string | null; series: Series[];
};
type Overview = { source: 'prometheus' | 'not_configured'; range: string; generatedAt: string; stale: boolean; panels: Panel[] };

const ranges = ['15m', '1h', '6h', '24h', '7d'] as const;

export function MonitorDashboard() {
  const [range, setRange] = useState<(typeof ranges)[number]>('1h');
  const [overview, setOverview] = useState<Overview>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(undefined);
    try {
      const response = await fetch(`/api/monitor/overview?range=${range}`, { cache: 'no-store', signal });
      if (!response.ok) throw new Error('Teachly Monitor is unavailable');
      setOverview(await response.json() as Overview);
    } catch (reason) {
      if (!(reason instanceof DOMException && reason.name === 'AbortError')) setError('Не удалось получить операционные метрики.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    const timer = window.setInterval(() => void load(controller.signal), 30_000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [load]);

  const panels = overview?.panels ?? [];
  const groups = useMemo(() => [
    { title: 'Система', icon: Server, panels: panels.filter((panel) => ['availability', 'request-rate', 'error-ratio', 'p95-latency', 'in-flight', 'memory', 'database', 'release'].includes(panel.id)) },
    { title: 'Безопасность и лимиты', icon: AlertTriangle, panels: panels.filter((panel) => ['auth-failures', 'rate-limits'].includes(panel.id)) },
    { title: 'AI-контур', icon: Bot, panels: panels.filter((panel) => panel.id.startsWith('ai-')) },
  ], [panels]);

  return (
    <main className="min-h-screen bg-[#050a11] px-4 py-6 text-slate-100 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1560px]">
        <header className="flex flex-col gap-5 border-b border-white/[.08] pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.24em] text-emerald-300">Teachly operations</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Teachly Monitor</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Операционная картина API и AI-контура. Учебная аналитика и персональные данные сюда не попадают.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-white/[.08] bg-white/[.03] p-1" aria-label="Диапазон метрик">
              {ranges.map((item) => <button key={item} type="button" onClick={() => setRange(item)} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${range === item ? 'bg-emerald-300 text-slate-950' : 'text-slate-400 hover:text-slate-100'}`}>{item}</button>)}
            </div>
            <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex size-10 items-center justify-center rounded-xl border border-white/[.08] bg-white/[.03] text-slate-300 hover:border-emerald-300/30 disabled:opacity-50" aria-label="Обновить">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </header>

        <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-2"><Database size={14} />{overview?.source === 'prometheus' ? 'Prometheus подключён' : 'Источник не подключён'}</span>
          {overview && <span className="inline-flex items-center gap-2"><Clock3 size={14} />{new Date(overview.generatedAt).toLocaleString('ru-RU')}</span>}
          {overview?.stale && <span className="inline-flex items-center gap-2 text-amber-300"><AlertTriangle size={14} />Данные устарели</span>}
        </div>

        {error && <div role="alert" className="mt-6 rounded-2xl border border-rose-300/20 bg-rose-300/[.06] p-5 text-sm text-rose-100">{error}</div>}
        {!error && loading && !overview && <div className="mt-6 rounded-2xl border border-white/[.08] p-8 text-sm text-slate-500">Загрузка метрик…</div>}

        <div className="mt-8 space-y-10">
          {groups.map(({ title, icon: Icon, panels: groupPanels }) => (
            <section key={title}>
              <div className="mb-4 flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-emerald-300/10 text-emerald-200"><Icon size={17} /></span><h2 className="text-lg font-semibold">{title}</h2></div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {groupPanels.map((panel) => <MonitorPanel key={panel.id} panel={panel} />)}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

function MonitorPanel({ panel }: { panel: Panel }) {
  const points = panel.series.flatMap((series) => series.points);
  const latest = points.length ? points[points.length - 1]!.value : null;
  const color = panel.alert === 'critical' ? 'text-rose-300' : panel.alert === 'warning' ? 'text-amber-300' : panel.alert === 'healthy' ? 'text-emerald-300' : 'text-slate-500';
  return (
    <article className="min-h-64 rounded-2xl border border-white/[.08] bg-[linear-gradient(145deg,rgba(255,255,255,.035),transparent_60%)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div><h3 className="font-semibold text-slate-100">{panel.title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{panel.description}</p></div>
        {panel.alert === 'healthy' ? <CheckCircle2 size={17} className={color} /> : <Activity size={17} className={color} />}
      </div>
      <p className={`mt-6 text-3xl font-semibold tracking-[-.04em] ${color}`}>{formatValue(latest, panel.unit)}</p>
      {panel.series.some((series) => Object.keys(series.labels).length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {panel.series.slice(0, 4).map((series, index) => <span key={`${panel.id}-${index}`} className="rounded-full border border-white/[.08] bg-white/[.035] px-2 py-1 text-[10px] text-slate-500">{formatLabels(series.labels)}</span>)}
        </div>
      )}
      <div className="mt-5 h-24">{points.length > 1 ? <Sparkline points={points} alert={panel.alert} /> : <p className="pt-8 text-center text-xs text-slate-600">{panel.message ?? 'Недостаточно точек для графика'}</p>}</div>
      <div className="mt-4 flex items-center justify-between border-t border-white/[.06] pt-3 text-[10px] uppercase tracking-[.12em] text-slate-600"><span>{panel.status.replace('_', ' ')}</span><span>{points.length} samples</span></div>
    </article>
  );
}

function Sparkline({ points, alert }: { points: Point[]; alert: Panel['alert'] }) {
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, Number.EPSILON);
  const path = points.map((point, index) => `${index ? 'L' : 'M'} ${(index / (points.length - 1)) * 100} ${90 - ((point.value - min) / span) * 80}`).join(' ');
  const stroke = alert === 'critical' ? '#fda4af' : alert === 'warning' ? '#fcd34d' : '#6ee7b7';
  return <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full" role="img" aria-label="График метрики"><path d={path} fill="none" stroke={stroke} strokeWidth="2" vectorEffect="non-scaling-stroke" /></svg>;
}

function formatValue(value: number | null, unit: string): string {
  if (value === null) return '—';
  if (unit === 'ratio') return `${(value * 100).toFixed(value < 0.1 ? 2 : 1)}%`;
  if (unit === 'seconds') return value < 1 ? `${Math.round(value * 1000)} ms` : `${value.toFixed(2)} s`;
  if (unit === 'bytes') return `${(value / 1024 / 1024).toFixed(1)} MB`;
  if (unit === 'requests_per_second') return `${value.toFixed(2)} req/s`;
  if (unit === 'tokens_per_second') return `${value.toFixed(1)} tok/s`;
  if (unit === 'micros_per_second') return `${value.toFixed(1)} µ/s`;
  return value.toFixed(value < 10 ? 2 : 0);
}

function formatLabels(labels: Record<string, string>): string {
  return Object.values(labels).join(' · ') || 'series';
}
