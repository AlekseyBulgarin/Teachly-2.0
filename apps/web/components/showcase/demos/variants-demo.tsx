"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Layers3 } from "lucide-react";
import { api, type PublishedVariant } from "@/lib/api";
import { useEcosystem } from "@/lib/ecosystem-context";
import { EmptyState, ErrorState } from "@/components/ui";
import { useDemoData } from "@/components/showcase/demos/use-demo-data";
import { demoTracks, type DemoTrack } from "@/lib/demo-learning";

export function VariantsDemo() {
  const { locale, t } = useEcosystem();
  const [selectedId, setSelectedId] = useState<string>();
  const loader = useCallback((signal: AbortSignal) => api.publishedVariants(signal), []);
  const { data: allVariants = [], loading, failed, retry } = useDemoData<PublishedVariant[]>(loader);
  const variants = allVariants.filter((variant) => variant.metadata?.audience === 'showcase');

  useEffect(() => {
    setSelectedId((current) => variants.some((variant) => variant.id === current) ? current : variants[0]?.id);
  }, [variants]);

  if (loading) return <p className="text-sm text-slate-500">{t("demo.loading")}</p>;
  if (failed) return <ErrorState message={t("demo.error")} retry={retry} retryLabel={t("shell.retry")} />;
  if (!variants.length) return <EmptyState text={t("common.noData")} />;

  const selected = variants.find((variant) => variant.id === selectedId) ?? variants[0];
  if (!selected) return null;

  const copy = locale === "ru"
    ? {
        list: "Опубликованные сценарии",
        version: "Версия",
        tasks: "задания",
        required: "Обязательно",
        optional: "Дополнительно",
        section: "Раздел",
        proof: "Состав и порядок получены из живого API. Витрина ничего не рассчитывает самостоятельно.",
      }
    : {
        list: "Published scenarios",
        version: "Version",
        tasks: "tasks",
        required: "Required",
        optional: "Optional",
        section: "Section",
        proof: "Composition and order come from the live API. The Showcase does not calculate them locally.",
      };
  const selectedTrack = typeof selected.metadata?.track === 'string' ? selected.metadata.track as DemoTrack : null;
  const localizedTitle = selectedTrack ? demoTracks.find((track) => track.id === selectedTrack)?.title[locale] : selected.title;
  const localizedDescription = selectedTrack ? demoTracks.find((track) => track.id === selectedTrack)?.detail[locale] : selected.description;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]">
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">{copy.list}</p>
        {variants.map((variant) => {
          const active = variant.id === selected.id;
          return (
            <button
              key={variant.id}
              type="button"
              onClick={() => setSelectedId(variant.id)}
              aria-pressed={active}
              className={`interactive rounded-xl border px-4 py-3 text-left transition ${active ? "border-emerald-300/30 bg-emerald-300/10" : "border-[var(--border)] bg-white/[.025] hover:border-[var(--border-strong)]"}`}
            >
              <span className="block text-sm font-semibold text-slate-100">{typeof variant.metadata?.track === 'string' ? demoTracks.find((track) => track.id === variant.metadata?.track)?.title[locale] ?? variant.title : variant.title ?? `Variant ${variant.version}`}</span>
              <span className="mt-1 block text-xs text-slate-500">{copy.version} {variant.version} · {variant.items.length} {copy.tasks}</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-slate-50">{localizedTitle}</p>
            {localizedDescription && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{localizedDescription}</p>}
          </div>
          <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-emerald-200">{selected.status}</span>
        </div>
        <div className="mt-5 flex flex-col gap-2">
          {selected.items.map((item, index) => (
            <div key={item.id} className="flex items-center gap-3 rounded-xl border border-white/[.06] bg-white/[.025] px-4 py-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-300/10 text-xs font-bold text-emerald-200">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-200">{item.section ? `${copy.section}: ${item.section}` : `${copy.tasks} ${index + 1}`}</p>
                <p className="mt-0.5 text-xs text-slate-500">{item.required ? copy.required : copy.optional}</p>
              </div>
              {item.resolutionStatus === "resolved" ? <CheckCircle2 aria-label="Resolved" size={17} className="shrink-0 text-emerald-300" /> : <Layers3 aria-label="Unresolved" size={17} className="shrink-0 text-amber-300" />}
            </div>
          ))}
        </div>
        <p className="mt-5 border-t border-[var(--border)] pt-4 text-xs leading-5 text-slate-500">{copy.proof}</p>
      </div>
    </div>
  );
}
