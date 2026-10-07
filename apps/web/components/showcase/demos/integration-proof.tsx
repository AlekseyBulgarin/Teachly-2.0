"use client";

import { useCallback } from "react";
import { KeyRound, RefreshCw, Server, ShieldCheck } from "lucide-react";
import { api, type Integration } from "@/lib/api";
import { useEcosystem } from "@/lib/ecosystem-context";
import { EmptyState, ErrorState, StatusBadge } from "@/components/ui";
import { useDemoData } from "@/components/showcase/demos/use-demo-data";

export function IntegrationProof() {
  const { locale, t } = useEcosystem();
  const loader = useCallback((_signal: AbortSignal) => api.integration(), []);
  const { data, loading, failed, retry } = useDemoData<Integration>(loader);

  if (loading) return <p className="text-sm text-slate-500">{t("demo.loading")}</p>;
  if (failed) return <ErrorState message={t("demo.error")} retry={retry} retryLabel={t("shell.retry")} />;
  if (!data) return <EmptyState text={t("common.noData")} />;

  const copy = locale === "ru"
    ? {
        connected: "Подключение работает", scope: "Разрешения ключа",
        safe: "Секрет хранится только на сервере витрины и никогда не отправляется в браузер.",
        issue: "Выпустить", issueDetail: "Создать ключ с минимальными разрешениями.",
        use: "Подключить", useDetail: "Передавать ключ только между серверами.",
        rotate: "Обновить", rotateDetail: "Заменить ключ без изменения API-контракта.",
        revoke: "Отозвать", revokeDetail: "Немедленно закрыть доступ старому ключу.",
      }
    : {
        connected: "Connection is live", scope: "Key scopes",
        safe: "The secret stays on the Showcase server and is never sent to the browser.",
        issue: "Issue", issueDetail: "Create a key with the minimum required scopes.",
        use: "Connect", useDetail: "Pass the key only between servers.",
        rotate: "Rotate", rotateDetail: "Replace the key without changing the API contract.",
        revoke: "Revoke", revokeDetail: "Immediately close access for the old key.",
      };
  const lifecycle = [
    { title: copy.issue, detail: copy.issueDetail, icon: KeyRound },
    { title: copy.use, detail: copy.useDetail, icon: Server },
    { title: copy.rotate, detail: copy.rotateDetail, icon: RefreshCw },
    { title: copy.revoke, detail: copy.revokeDetail, icon: ShieldCheck },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[.72fr_1.28fr]">
      <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[.055] p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-300/10 text-emerald-200"><Server aria-hidden="true" size={19} /></span>
          <StatusBadge status={data.status} locale={locale} />
        </div>
        <p className="mt-5 text-lg font-semibold text-slate-50">{data.name}</p>
        <p className="mt-2 text-sm text-emerald-100/75">{copy.connected}</p>
        <p className="mt-5 text-[10px] font-bold uppercase tracking-[.15em] text-slate-500">{copy.scope}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {data.scopes.map((scope) => <span key={scope} className="rounded-full border border-white/[.08] bg-white/[.04] px-2 py-1 text-[10px] text-slate-400">{scope.replaceAll("_", " ")}</span>)}
        </div>
        <p className="mt-5 border-t border-emerald-300/10 pt-4 text-xs leading-5 text-slate-400">{copy.safe}</p>
      </div>
      <ol className="grid gap-3 sm:grid-cols-2">
        {lifecycle.map(({ title, detail, icon: Icon }, index) => (
          <li key={title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
            <div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-white/[.055] text-emerald-200"><Icon aria-hidden="true" size={16} /></span><span className="text-[10px] font-bold uppercase tracking-[.15em] text-slate-500">0{index + 1}</span></div>
            <p className="mt-4 text-sm font-semibold text-slate-100">{title}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
