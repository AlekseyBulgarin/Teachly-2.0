"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ListChecks } from "lucide-react";
import { api, type PublishedTask } from "@/lib/api";
import { useEcosystem } from "@/lib/ecosystem-context";
import { EmptyState, ErrorState } from "@/components/ui";
import { useDemoData } from "@/components/showcase/demos/use-demo-data";

export function TasksDemo() {
  const { t } = useEcosystem();
  const [selectedId, setSelectedId] = useState<string>();
  const [picked, setPicked] = useState<string>();
  const loader = useCallback((signal: AbortSignal) => api.publishedTasks(signal), []);
  const { data: tasks = [], loading, failed, retry } = useDemoData<PublishedTask[]>(loader);

  useEffect(() => {
    setSelectedId((current) => tasks.some((task) => task.id === current) ? current : tasks[0]?.id);
    setPicked(undefined);
  }, [tasks]);

  const selected = tasks.find((row) => row.id === selectedId) ?? tasks[0];

  if (loading) return <p className="text-sm text-slate-500">{t("demo.loading")}</p>;
  if (failed) return <ErrorState message={t("demo.error")} retry={retry} retryLabel={t("shell.retry")} />;
  if (!tasks.length) return <EmptyState text={t("common.noData")} />;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">
          {t("demo.tasks.title")}
        </p>
        {tasks.map((row) => {
          const active = row.id === selected?.id;
          return (
            <button
              key={row.id}
              type="button"
              onClick={() => {
                setSelectedId(row.id);
                setPicked(undefined);
              }}
              aria-pressed={active}
              className={`interactive rounded-xl border px-4 py-3 text-left text-sm leading-6 transition ${
                active
                  ? "border-emerald-300/30 bg-emerald-300/10 text-slate-100"
                  : "border-[var(--border)] bg-white/[.025] text-slate-400 hover:border-[var(--border-strong)] hover:text-slate-200"
              }`}
            >
              <span className="line-clamp-2 break-words">{row.content.statement}</span>
            </button>
          );
        })}
        <p className="text-xs leading-5 text-slate-500">{t("demo.tasks.detail")}</p>
      </div>

      {selected && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-5 sm:p-6">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-emerald-200">{selected.status}</span>
            <span className="rounded-full border border-white/10 bg-white/[.055] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.1em] text-slate-400">v{selected.version}</span>
          </div>
          {selected.content.title && (
            <p className="mt-4 text-[10px] font-bold uppercase tracking-[.16em] text-emerald-200">
              {selected.content.title}
            </p>
          )}
          <p className="mt-3 break-words text-base leading-7 text-slate-100">
            {selected.content.statement}
          </p>
          <p className="mt-5 text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">
            {t("demo.tasks.options")}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {(selected.content.options ?? []).map((option) => {
              const active = picked === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setPicked(option.id)}
                  aria-pressed={active}
                  className={`interactive flex items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm leading-6 transition ${
                    active
                      ? "border-emerald-300/35 bg-emerald-300/10 text-slate-100"
                      : "border-[var(--border)] bg-white/[.025] text-slate-300 hover:border-[var(--border-strong)]"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                      active ? "border-emerald-300/50 bg-emerald-300/20 text-emerald-100" : "border-white/20 text-slate-500"
                    }`}
                  >
                    {option.id.toUpperCase()}
                  </span>
                  <span className="break-words">{option.label}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-5 flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-xs leading-5 text-slate-500">
              <ListChecks aria-hidden="true" size={14} className="mt-0.5 shrink-0 text-slate-500" />
              {picked ? t("demo.tasks.picked") : t("demo.tasks.readonly")}
            </p>
            <Link
              href="/trainer"
              className="interactive inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-950 hover:bg-white"
            >
              {t("demo.tasks.toTrainer")}
              <ArrowRight aria-hidden="true" size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
