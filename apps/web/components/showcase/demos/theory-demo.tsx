"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { api, type PublishedTask, type TheoryBlock, type TheoryMaterial } from "@/lib/api";
import { useEcosystem } from "@/lib/ecosystem-context";
import { EmptyState, ErrorState } from "@/components/ui";
import { useDemoData } from "@/components/showcase/demos/use-demo-data";

function Block({ block, unsupported }: { block: TheoryBlock; unsupported: string }) {
  if (block.type === "heading" && typeof block.text === "string") return <p className="mt-5 text-base font-semibold text-emerald-100 first:mt-0">{block.text}</p>;
  if (block.type === "paragraph" && typeof block.text === "string") return <p className="mt-3 break-words text-sm leading-7 text-slate-300 first:mt-0">{block.text}</p>;
  if (block.type === "list")
    return (
      <ul className="mt-3 flex flex-col gap-2 first:mt-0">
        {(block.items ?? []).map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm leading-6 text-slate-300">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-300/70" />
            <span className="break-words">{item}</span>
          </li>
        ))}
      </ul>
    );
  if (block.type === "formula" && typeof block.latex === "string")
    return (
      <p className="mt-3 overflow-x-auto rounded-xl border border-[var(--border)] bg-[#070b12] px-4 py-3 font-mono text-xs leading-6 text-emerald-100 first:mt-0">
        {block.latex}
      </p>
    );
  if (block.type === "callout" && typeof block.text === "string")
    return (
      <p className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/[.07] px-4 py-3 text-sm leading-6 text-amber-100 first:mt-0">
        {block.text}
      </p>
    );
  if (block.type === "example" && typeof block.text === "string")
    return (
      <p className="mt-3 rounded-xl border border-emerald-300/20 bg-emerald-300/[.06] px-4 py-3 text-sm leading-6 text-emerald-100 first:mt-0">
        {block.text}
      </p>
    );
  if (block.type === "image" || block.type === "file") {
    return <p className="mt-3 rounded-xl border border-[var(--border)] bg-white/[.025] px-4 py-3 text-xs leading-5 text-slate-500 first:mt-0">{unsupported}</p>;
  }
  return <p className="mt-3 text-xs leading-5 text-slate-500 first:mt-0">{unsupported}</p>;
}

export function TheoryDemo() {
  const { t } = useEcosystem();
  const [activeId, setActiveId] = useState<string>();
  const loader = useCallback(async (signal: AbortSignal) => {
    const [materialsResult, tasksResult] = await Promise.allSettled([api.theoryMaterials(signal), api.publishedTasks(signal)]);
    if (materialsResult.status === "rejected") throw materialsResult.reason;
    return {
      materials: materialsResult.value.filter((item) => item.status === "published" && item.version?.status === "published"),
      tasks: tasksResult.status === "fulfilled" ? tasksResult.value : [],
    };
  }, []);
  const { data, loading, failed, retry } = useDemoData<{ materials: TheoryMaterial[]; tasks: PublishedTask[] }>(loader);
  const materials = data?.materials ?? [];
  const tasks = data?.tasks ?? [];

  useEffect(() => {
    setActiveId((current) => materials.some((material) => material.id === current) ? current : materials[0]?.id);
  }, [materials]);

  const active = materials.find((item) => item.id === activeId) ?? materials[0];
  const linkedTasks = useMemo(
    () => (active ? tasks.filter((row) => active.taskIds.includes(row.taskId)) : []),
    [active, tasks],
  );

  if (loading) return <p className="text-sm text-slate-500">{t("demo.loading")}</p>;
  if (failed) return <ErrorState message={t("demo.error")} retry={retry} retryLabel={t("shell.retry")} />;
  if (!active) return <EmptyState text={t("common.noData")} />;

  const chips = [
    active.curriculum.subjectId ? t("demo.theory.subjectLinked") : null,
    active.curriculum.courseId ? t("demo.theory.courseLinked") : null,
    active.curriculum.topicId ? t("demo.theory.topicLinked") : null,
    active.curriculum.skillId ? t("demo.theory.skillLinked") : null,
  ].filter((name): name is string => Boolean(name));

  return (
    <div className="flex flex-col gap-4">
      {materials.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {materials.map((item) => {
            const isActive = item.id === active.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveId(item.id)}
                aria-pressed={isActive}
                className={`interactive rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                  isActive
                    ? "border-emerald-300/35 bg-emerald-300/10 text-emerald-100"
                    : "border-[var(--border)] bg-white/[.025] text-slate-400 hover:text-slate-200"
                }`}
              >
                {item.title}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,.75fr)]">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-emerald-200">
              <BookOpen aria-hidden="true" size={11} />
              {t("demo.theory.title")}
            </span>
            {active.category && (
              <span className="rounded-full border border-white/10 bg-white/[.055] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.1em] text-slate-400">
                {active.category}
              </span>
            )}
            <span className="rounded-full border border-white/10 bg-white/[.055] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.1em] text-slate-500">
              {t("demo.theory.version")} {active.version.version}
            </span>
          </div>
          <h3 className="mt-4 break-words text-lg font-semibold text-slate-50">{active.title}</h3>
          {active.description && <p className="mt-2 break-words text-sm leading-6 text-slate-400">{active.description}</p>}
          <div className="mt-5 border-t border-[var(--border)] pt-4">
            {active.version.content.blocks.map((block, index) => (
              <Block key={`${block.type}-${index}`} block={block} unsupported={t("demo.theory.unsupportedBlock")} />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-5">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">{t("demo.theory.curriculum")}</p>
            {chips.length || active.category ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {chips.map((name) => (
                  <span
                    key={name}
                    className="rounded-full border border-white/10 bg-white/[.055] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.1em] text-slate-400"
                  >
                    {name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs leading-5 text-slate-500">{t("common.noData")}</p>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-5">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">{t("demo.theory.linked")}</p>
            {linkedTasks.length ? (
              <div className="mt-3 flex flex-col gap-3">
                {linkedTasks.map((row) => (
                  <div key={row.id} className="rounded-xl border border-[var(--border)] bg-white/[.025] p-4">
                    <p className="break-words text-sm leading-6 text-slate-300">{row.content.statement}</p>
                    <Link
                      href="/tasks"
                      className="interactive mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-200 hover:text-emerald-100"
                    >
                      {t("demo.tasks.title")}
                      <ArrowRight aria-hidden="true" size={13} />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs leading-5 text-slate-500">{t("common.noData")}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
