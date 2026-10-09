"use client";

import { useCallback, useRef, useState } from "react";
import { BrainCircuit, CircleAlert, Lightbulb, LoaderCircle, ShieldCheck, Sparkles } from "lucide-react";
import { api, type AiProviderStatus, type RemediationResponse } from "@/lib/api";
import { useEcosystem } from "@/lib/ecosystem-context";
import { ErrorState, SectionCard, StatusBadge } from "@/components/ui";
import { useDemoData } from "@/components/showcase/demos/use-demo-data";

export function AiRemediationDemo() {
  const { locale, t } = useEcosystem();
  const loader = useCallback((signal: AbortSignal) => api.aiStatus(signal), []);
  const { data: status, loading, failed, retry } = useDemoData<AiProviderStatus>(loader);
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<RemediationResponse>();
  const [submitting, setSubmitting] = useState(false);
  const [submitFailed, setSubmitFailed] = useState(false);
  const actionController = useRef<AbortController | null>(null);

  const copy = locale === "ru"
    ? {
        ready: "Провайдер настроен",
        connect: "Готово к активации провайдера",
        connectDetail: "AI-контур уже собран. Добавьте действующий ключ с доступным API-биллингом и выберите провайдера на сервере — интерфейс и API менять не нужно.",
        provider: "Провайдер",
        model: "Модель",
        mode: "Режим API",
        question: "Что спросит ученик",
        placeholder: "Объясни, в чём моя ошибка, и дай подсказку без готового ответа.",
        run: "Получить объяснение",
        running: "Teachly собирает контекст…",
        failed: "Не удалось получить объяснение. Учебный результат при этом не изменён.",
        summary: "Кратко",
        explanation: "Объяснение",
        hint: "Подсказка",
        gap: "На что обратить внимание",
        grounded: "Ответ проверен по разрешённому учебному контексту",
        confidence: "Уверенность",
      }
    : {
        ready: "Provider configured",
        connect: "Ready for provider activation",
        connectDetail: "The AI boundary is already in place. Add an active key with API billing and choose the provider on the server — no UI or API changes are required.",
        provider: "Provider",
        model: "Model",
        mode: "API mode",
        question: "Learner question",
        placeholder: "Explain my mistake and give me a hint without revealing the answer.",
        run: "Get an explanation",
        running: "Teachly is assembling context…",
        failed: "The explanation could not be generated. The learning result was not changed.",
        summary: "Summary",
        explanation: "Explanation",
        hint: "Hint",
        gap: "Area to review",
        grounded: "The response is checked against permitted learning context",
        confidence: "Confidence",
      };

  async function run() {
    if (!status?.configured || submitting) return;
    actionController.current?.abort();
    const controller = new AbortController();
    actionController.current = controller;
    setSubmitting(true);
    setSubmitFailed(false);
    setResult(undefined);
    try {
      const response = await api.remediation({
        learnerQuestion: question.trim() || copy.placeholder,
        idempotencyKey: `showcase-${crypto.randomUUID()}`,
        locale,
      }, controller.signal);
      setResult(response);
    } catch {
      if (!controller.signal.aborted) setSubmitFailed(true);
    } finally {
      if (!controller.signal.aborted) setSubmitting(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-500">{t("demo.loading")}</p>;
  if (failed || !status) return <ErrorState message={t("demo.error")} retry={retry} retryLabel={t("shell.retry")} />;

  return (
    <div className="grid gap-6 xl:grid-cols-[.85fr_1.15fr]">
      <SectionCard
        title={t("ai.context")}
        detail={status.configured ? copy.ready : copy.connect}
        icon={ShieldCheck}
        action={<StatusBadge status={status.configured ? "CONFIGURED" : "READY TO CONNECT"} locale={locale} />}
      >
        <div className="p-5 sm:p-7">
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
            <ProviderFact label={copy.provider} value={status.provider} />
            <ProviderFact label={copy.model} value={status.model ?? "—"} />
            <ProviderFact label={copy.mode} value={status.apiMode?.replace("_", " ") ?? "—"} />
          </div>
          {!status.configured && (
            <p className="mt-5 rounded-xl border border-amber-300/15 bg-amber-300/[.06] p-4 text-sm leading-6 text-amber-50/80">
              {copy.connectDetail}
            </p>
          )}
          <label className="mt-5 block text-xs font-semibold text-slate-300" htmlFor="ai-remediation-question">{copy.question}</label>
          <textarea
            id="ai-remediation-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value.slice(0, 1_000))}
            placeholder={copy.placeholder}
            rows={4}
            disabled={!status.configured || submitting}
            className="mt-2 w-full resize-none rounded-xl border border-[var(--border)] bg-black/15 px-4 py-3 text-sm leading-6 text-slate-200 outline-none placeholder:text-slate-600 focus:border-emerald-300/40 focus:ring-2 focus:ring-emerald-300/10 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => void run()}
            disabled={!status.configured || submitting}
            className="interactive mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {submitting ? <LoaderCircle aria-hidden="true" size={17} className="animate-spin" /> : <BrainCircuit aria-hidden="true" size={17} />}
            {submitting ? copy.running : copy.run}
          </button>
        </div>
      </SectionCard>

      <SectionCard
        title={t("ai.proposal")}
        detail={result ? copy.grounded : t("ai.previewDetail")}
        icon={Sparkles}
        action={result ? <StatusBadge status="LIVE" locale={locale} /> : undefined}
      >
        <div aria-live="polite" className="p-5 sm:p-7">
          {submitFailed && (
            <div role="status" className="flex items-start gap-3 rounded-xl border border-amber-300/15 bg-amber-300/[.06] p-4 text-sm leading-6 text-slate-300">
              <CircleAlert aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-amber-200" />
              {copy.failed}
            </div>
          )}
          {!result && !submitFailed && (
            <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-300/10 text-emerald-200"><Lightbulb aria-hidden="true" size={21} /></span>
              <p className="mt-4 max-w-md text-sm leading-7 text-slate-400">{status.configured ? t("ai.requestDetail") : copy.connectDetail}</p>
            </div>
          )}
          {result && (
            <div className="space-y-4">
              <AnswerBlock label={copy.summary} value={result.remediation.summary} />
              <AnswerBlock label={copy.explanation} value={result.remediation.explanation} />
              <AnswerBlock label={copy.hint} value={result.remediation.hint} accent />
              {result.remediation.likelyGap && <AnswerBlock label={copy.gap} value={result.remediation.likelyGap} />}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4 text-xs text-slate-500">
                <span className="flex items-center gap-2"><ShieldCheck aria-hidden="true" size={15} className="text-emerald-300" />{copy.grounded}</span>
                <span>{copy.confidence}: {Math.round(result.remediation.confidence * 100)}%</span>
              </div>
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

function ProviderFact({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-white/[.035] p-3"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-500">{label}</p><p className="mt-2 truncate text-xs font-medium text-slate-200">{value}</p></div>;
}

function AnswerBlock({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <div className={`rounded-xl border p-4 ${accent ? "border-emerald-300/20 bg-emerald-300/[.07]" : "border-white/[.06] bg-white/[.025]"}`}><p className={`text-[10px] font-bold uppercase tracking-[.14em] ${accent ? "text-emerald-200" : "text-slate-500"}`}>{label}</p><p className="mt-2 text-sm leading-6 text-slate-200">{value}</p></div>;
}
