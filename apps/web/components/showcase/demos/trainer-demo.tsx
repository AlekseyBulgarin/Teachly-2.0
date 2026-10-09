"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, CircleCheck, CircleX, Code2, GraduationCap, RefreshCw, Signal, Sparkles, Target } from "lucide-react";
import { api, type TrainerSession, type TrainerSessionItem, type TrainerSubmitResponse } from "@/lib/api";
import { useEcosystem } from "@/lib/ecosystem-context";
import { demoTracks, localizeTask, type DemoTrack } from "@/lib/demo-learning";
import { ErrorState } from "@/components/ui";

type Phase = "idle" | "running" | "feedback" | "complete" | "done";
type FailedAction = "start" | "submit" | "next" | "complete" | null;
type SubmitRequest = { sessionId: string; itemId: string; optionId: string; idempotencyKey: string };

export function TrainerDemo() {
  const { locale, t } = useEcosystem();
  const [track, setTrack] = useState<DemoTrack>('python');
  const [phase, setPhase] = useState<Phase>("idle");
  const [session, setSession] = useState<TrainerSession | null>(null);
  const [answered, setAnswered] = useState<TrainerSessionItem | null>(null);
  const [feedback, setFeedback] = useState<TrainerSubmitResponse | null>(null);
  const [picked, setPicked] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [failedAction, setFailedAction] = useState<FailedAction>(null);
  const [results, setResults] = useState<Array<{ correct: boolean; title: string }>>([]);
  const mountedRef = useRef(true);
  const pendingRef = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);
  const startKeyRef = useRef<string | undefined>(undefined);
  const submitRequestRef = useRef<SubmitRequest | undefined>(undefined);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
    };
  }, []);

  const beginRequest = useCallback(() => {
    if (pendingRef.current) return null;
    pendingRef.current = true;
    const controller = new AbortController();
    controllerRef.current = controller;
    setBusy(true);
    setFailedAction(null);
    return controller;
  }, []);

  const finishRequest = useCallback((controller: AbortController) => {
    if (controllerRef.current === controller) controllerRef.current = null;
    pendingRef.current = false;
    if (mountedRef.current) setBusy(false);
  }, []);

  const start = useCallback(async () => {
    const controller = beginRequest();
    if (!controller) return;
    const idempotencyKey = startKeyRef.current ?? crypto.randomUUID();
    startKeyRef.current = idempotencyKey;
    try {
      const created = await api.trainerStart({ idempotencyKey, track }, controller.signal);
      const current = await api.trainerCurrent(created.id, controller.signal);
      if (controller.signal.aborted || !mountedRef.current) return;
      startKeyRef.current = undefined;
      submitRequestRef.current = undefined;
      setSession(current);
      setAnswered(null);
      setFeedback(null);
      setPicked(undefined);
      setResults([]);
      setPhase("running");
    } catch {
      if (!controller.signal.aborted && mountedRef.current) setFailedAction("start");
    } finally {
      finishRequest(controller);
    }
  }, [beginRequest, finishRequest, track]);

  const submit = useCallback(async () => {
    const existing = submitRequestRef.current;
    const request = existing ?? (session?.current && picked ? {
      sessionId: session.id,
      itemId: session.current.id,
      optionId: picked,
      idempotencyKey: crypto.randomUUID(),
    } : null);
    if (!request) return;
    const controller = beginRequest();
    if (!controller) return;
    submitRequestRef.current = request;
    const submittedItem = session?.current ?? answered;
    try {
      const response = await api.trainerSubmit(request.sessionId, {
        itemId: request.itemId,
        idempotencyKey: request.idempotencyKey,
        answer: { optionId: request.optionId },
      }, controller.signal);
      if (controller.signal.aborted || !mountedRef.current) return;
      submitRequestRef.current = undefined;
      setAnswered(submittedItem ?? null);
      setFeedback(response);
      setSession(response.session);
      if (submittedItem) {
        setResults((current) => [...current, {
          correct: response.submitted.result.isCorrect,
          title: localizeTask(submittedItem.task, locale).content.title ?? `${t("demo.trainer.item")} ${submittedItem.position}`,
        }]);
      }
      setPhase("feedback");
    } catch {
      if (!controller.signal.aborted && mountedRef.current) setFailedAction("submit");
    } finally {
      finishRequest(controller);
    }
  }, [answered, beginRequest, finishRequest, locale, picked, session, t]);

  const applyCurrent = useCallback((updated: TrainerSession) => {
    setSession(updated);
    setAnswered(null);
    setPicked(undefined);
    setFeedback(null);
    setPhase(updated.current ? "running" : "complete");
  }, []);

  const next = useCallback(async (recover = false) => {
    if (!session) return;
    const controller = beginRequest();
    if (!controller) return;
    try {
      const updated = recover
        ? await api.trainerCurrent(session.id, controller.signal)
        : await api.trainerNext(session.id, controller.signal);
      if (controller.signal.aborted || !mountedRef.current) return;
      applyCurrent(updated);
    } catch {
      if (!controller.signal.aborted && mountedRef.current) setFailedAction("next");
    } finally {
      finishRequest(controller);
    }
  }, [applyCurrent, beginRequest, finishRequest, session]);

  const complete = useCallback(async () => {
    if (!session) return;
    const controller = beginRequest();
    if (!controller) return;
    try {
      const updated = await api.trainerComplete(session.id, controller.signal);
      if (controller.signal.aborted || !mountedRef.current) return;
      setSession(updated);
      setPhase("done");
    } catch {
      if (!controller.signal.aborted && mountedRef.current) setFailedAction("complete");
    } finally {
      finishRequest(controller);
    }
  }, [beginRequest, finishRequest, session]);

  const retry = useCallback(() => {
    if (failedAction === "start") void start();
    if (failedAction === "submit") void submit();
    if (failedAction === "next") void next(true);
    if (failedAction === "complete") void complete();
  }, [complete, failedAction, next, start, submit]);

  const progress = session?.progress ?? { completed: 0, total: 0 };
  const percent = progress.total ? Math.round((progress.completed / progress.total) * 100) : 0;
  const visible = phase === "feedback" ? answered : session?.current ?? null;
  const localizedVisible = visible ? localizeTask(visible.task, locale) : null;
  const correctCount = results.filter((result) => result.correct).length;
  const selectedTrack = demoTracks.find((item) => item.id === track) ?? demoTracks[0];

  if (phase === "idle") {
    return (
      <div className="flex flex-col items-start gap-4" aria-busy={busy}>
        <p className="max-w-2xl text-sm leading-7 text-slate-400">{t("demo.trainer.idle")}</p>
        <fieldset className="w-full">
          <legend className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">
            {locale === 'ru' ? 'Выберите маршрут' : 'Choose a track'}
          </legend>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {demoTracks.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={track === item.id}
                onClick={() => setTrack(item.id)}
                className={`interactive rounded-2xl border p-4 text-left transition ${track === item.id ? 'border-emerald-300/35 bg-emerald-300/[.08]' : 'border-[var(--border)] bg-white/[.025] hover:border-[var(--border-strong)]'}`}
              >
                <span className="block text-sm font-semibold text-slate-100">{item.title[locale]}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-400">{item.detail[locale]}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <button
          type="button"
          onClick={() => void start()}
          disabled={busy}
          className="interactive inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-5 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-200 disabled:cursor-wait disabled:opacity-60"
        >
          <GraduationCap aria-hidden="true" size={16} />
          {busy ? t("demo.loading") : t("demo.trainer.start")}
        </button>
        {failedAction && <ErrorState message={t("demo.error")} retry={retry} retryLabel={t("shell.retry")} />}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" aria-busy={busy}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">
            {t("demo.trainer.progress")} {progress.completed}/{progress.total}
          </p>
          <div
            className="h-1.5 w-32 overflow-hidden rounded-full bg-white/10 sm:w-44"
            role="progressbar"
            aria-label={t("demo.trainer.progress")}
            aria-valuemin={0}
            aria-valuemax={progress.total}
            aria-valuenow={progress.completed}
          >
            <div className="h-full rounded-full bg-emerald-300 transition-all" style={{ width: `${percent}%` }} />
          </div>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[.055] px-2.5 py-1 font-mono text-[10px] text-slate-500">
          {session?.id.slice(0, 8)}
        </span>
      </div>

      {failedAction && <ErrorState message={t("demo.error")} retry={retry} retryLabel={t("shell.retry")} />}

      {phase === "done" ? (
        <div className="flex flex-col items-start gap-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/[.06] p-5">
          <p className="flex items-center gap-2 text-sm leading-6 text-emerald-100">
            <CircleCheck aria-hidden="true" size={17} className="shrink-0 text-emerald-300" />
            {t("demo.trainer.done")}
          </p>
          <div className="grid w-full gap-3 sm:grid-cols-3">
            <Summary label={locale === 'ru' ? 'Результат' : 'Result'} value={`${correctCount}/${results.length}`} />
            <Summary label={locale === 'ru' ? 'Маршрут' : 'Track'} value={selectedTrack.title[locale]} />
            <Summary label={locale === 'ru' ? 'Следующий шаг' : 'Next step'} value={correctCount === results.length ? (locale === 'ru' ? 'Перенос навыка' : 'Transfer check') : (locale === 'ru' ? 'Повторить ошибки' : 'Review mistakes')} />
          </div>
          <button
            type="button"
            onClick={() => void start()}
            disabled={busy}
            className="interactive inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-950 hover:bg-white disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw aria-hidden="true" size={14} />
            {t("demo.trainer.again")}
          </button>
        </div>
      ) : phase === "complete" ? (
        <div className="flex flex-col items-start gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-5">
          <p className="text-sm leading-6 text-slate-300">{progress.completed}/{progress.total}</p>
          <button
            type="button"
            onClick={() => void complete()}
            disabled={busy}
            className="interactive inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-5 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-200 disabled:cursor-wait disabled:opacity-60"
          >
            <CircleCheck aria-hidden="true" size={16} />
            {busy ? t("demo.loading") : t("demo.trainer.complete")}
          </button>
        </div>
      ) : visible && localizedVisible ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)]">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-5 sm:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">
              {t("demo.trainer.item")} {visible.position}/{progress.total}
            </p>
            {localizedVisible.content.title && <p className="mt-3 text-xs font-semibold uppercase tracking-[.12em] text-emerald-200">{localizedVisible.content.title}</p>}
            <p className="mt-2 break-words text-base leading-7 text-slate-100">{localizedVisible.content.statement}</p>
            {localizedVisible.code && (
              <pre className="mt-4 overflow-x-auto rounded-xl border border-white/[.08] bg-[#070b12] p-4 text-sm leading-6 text-cyan-100"><code>{localizedVisible.code}</code></pre>
            )}
            <div className="mt-5 flex flex-col gap-2">
              {(localizedVisible.content.options ?? []).map((option) => {
                const active = picked === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setPicked(option.id)}
                    aria-pressed={active}
                    disabled={busy || phase === "feedback" || failedAction === "submit"}
                    className={`interactive flex items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm leading-6 transition disabled:opacity-70 ${active ? "border-emerald-300/35 bg-emerald-300/10 text-slate-100" : "border-[var(--border)] bg-white/[.025] text-slate-300 hover:border-[var(--border-strong)]"}`}
                  >
                    <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${active ? "border-emerald-300/50 bg-emerald-300/20 text-emerald-100" : "border-white/20 text-slate-500"}`}>
                      {option.id.toUpperCase()}
                    </span>
                    <span className="break-words">{option.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 border-t border-[var(--border)] pt-4">
              {phase === "running" ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-5 text-slate-500">{picked ? "" : t("demo.trainer.pick")}</p>
                  <button
                    type="button"
                    onClick={() => void submit()}
                    disabled={busy || !picked || failedAction === "submit"}
                    className="interactive inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-300 px-5 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy ? t("demo.loading") : t("demo.trainer.submit")}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => void next()}
                  disabled={busy}
                  className="interactive inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-white disabled:cursor-wait disabled:opacity-60 sm:w-auto"
                >
                  {busy ? t("demo.loading") : t("demo.trainer.next")}
                </button>
              )}
            </div>
          </div>

          {phase === "feedback" && feedback ? (
            <div className="flex flex-col gap-4">
              <div className={`rounded-2xl border p-5 ${feedback.submitted.result.isCorrect ? "border-emerald-300/25 bg-emerald-300/[.07]" : "border-amber-300/25 bg-amber-300/[.07]"}`}>
                <p className="flex items-center gap-2 text-sm font-semibold">
                  {feedback.submitted.result.isCorrect ? (
                    <><CircleCheck aria-hidden="true" size={17} className="text-emerald-300" /><span className="text-emerald-100">{t("demo.trainer.correct")}</span></>
                  ) : (
                    <><CircleX aria-hidden="true" size={17} className="text-amber-300" /><span className="text-amber-100">{t("demo.trainer.incorrect")}</span></>
                  )}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-300">{localizedVisible.explanation}</p>
                <details className="mt-3 text-xs text-slate-500">
                  <summary className="cursor-pointer">{locale === 'ru' ? 'Технические детали' : 'Technical details'}</summary>
                  <p className="mt-2 font-mono">score: {feedback.submitted.result.score} · {feedback.submitted.result.evaluationRule}</p>
                </details>
              </div>

              {!!feedback.theory.length && (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-5">
                  <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">
                    <Sparkles aria-hidden="true" size={12} className="text-emerald-300" />{t("demo.trainer.theory")}
                  </p>
                  <div className="mt-3 flex flex-col gap-3">
                    {feedback.theory.map((material) => (
                      <div key={material.id} className="rounded-xl border border-[var(--border)] bg-white/[.025] p-4">
                        <p className="break-words text-sm font-semibold text-slate-200">{material.title}</p>
                        {material.description && <p className="mt-1 break-words text-xs leading-5 text-slate-400">{material.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {feedback.teacherSignal && (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-5">
                  <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">
                    <Signal aria-hidden="true" size={12} className="text-amber-300" />{t("demo.trainer.signal")}
                  </p>
                  <p className="mt-2 break-words text-sm font-semibold text-amber-100">{t(`demo.trainer.signal.${feedback.teacherSignal.type}`)}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    {t("demo.trainer.signal.evidence")}: {feedback.teacherSignal.evidenceCount}
                    {feedback.teacherSignal.recentOutcomes.length ? ` · ${feedback.teacherSignal.recentOutcomes.join(", ")}` : ""}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex min-h-64 flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-5 sm:p-6">
              <div>
                <span className="flex size-10 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-200"><Target aria-hidden="true" size={18} /></span>
                <p className="mt-5 text-base font-semibold text-slate-100">{locale === 'ru' ? 'После ответа появится разбор' : 'Feedback appears after your answer'}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">{locale === 'ru' ? 'Teachly покажет объяснение, подходящий материал и сигнал преподавателю — если история уже подтверждает пробел.' : 'Teachly will show an explanation, relevant material and a teacher signal when the history confirms a gap.'}</p>
              </div>
              <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <Hint icon={BookOpen} text={locale === 'ru' ? 'Связанная теория' : 'Linked theory'} />
                <Hint icon={Signal} text={locale === 'ru' ? 'Учебный сигнал' : 'Learning signal'} />
                <Hint icon={Code2} text={locale === 'ru' ? 'Понятный разбор' : 'Clear explanation'} />
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/[.08] bg-black/15 p-4"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-500">{label}</p><p className="mt-2 text-sm font-semibold text-slate-100">{value}</p></div>;
}

function Hint({ icon: Icon, text }: { icon: typeof BookOpen; text: string }) {
  return <div className="flex items-center gap-2 rounded-xl border border-white/[.07] bg-white/[.025] px-3 py-2.5 text-xs text-slate-400"><Icon aria-hidden="true" size={14} className="text-emerald-300" />{text}</div>;
}
