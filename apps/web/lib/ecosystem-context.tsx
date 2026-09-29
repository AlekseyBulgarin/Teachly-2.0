'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api, type AiTrace, type AttemptResult, type ExternalUser, type Integration, type KnowledgeStatus, type LearningState, type RemediationResponse, type Student, type Task } from '@/lib/api';
import { translate, type Locale } from '@/lib/i18n';

export type EnrichedLearner = { student: Student; results: AttemptResult[]; task?: Task; state?: LearningState; loading: boolean; error?: string };
export type ApiStatus = 'checking' | 'healthy' | 'unavailable';

type EcosystemContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  apiStatus: ApiStatus;
  loading: boolean;
  refreshing: boolean;
  error?: string;
  actionError?: string;
  reload: () => Promise<void>;
  learners: EnrichedLearner[];
  attempts: AttemptResult[];
  incorrectAttempts: Array<AttemptResult & { learner: Student }>;
  selected?: EnrichedLearner;
  selectedAttempt?: AttemptResult;
  externalUsers: ExternalUser[];
  integration: Integration | null;
  knowledge: KnowledgeStatus[];
  approvedKnowledge: KnowledgeStatus[];
  traces: AiTrace[];
  remediation: RemediationResponse | null;
  selectLearner: (id: string) => void;
  selectAttempt: (id: string) => void;
  requestRemediation: () => Promise<void>;
};

const EcosystemContext = createContext<EcosystemContextValue | null>(null);

export function EcosystemProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('ru');
  const [learners, setLearners] = useState<EnrichedLearner[]>([]);
  const [externalUsers, setExternalUsers] = useState<ExternalUser[]>([]);
  const [integration, setIntegration] = useState<Integration | null>(null);
  const [knowledge, setKnowledge] = useState<KnowledgeStatus[]>([]);
  const [traces, setTraces] = useState<AiTrace[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [selectedAttemptId, setSelectedAttemptId] = useState<string>();
  const [remediation, setRemediation] = useState<RemediationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiStatus, setApiStatus] = useState<ApiStatus>('checking');
  const [error, setError] = useState<string>();
  const [actionError, setActionError] = useState<string>();

  const reload = async () => {
    setError(undefined);
    setApiStatus('checking');
    setRefreshing(true);
    try {
      const [healthResult, studentsResult, externalResult, integrationResult, knowledgeResult, tracesResult] = await Promise.allSettled([
        api.health(), api.students(), api.externalUsers(), api.integration(), api.knowledge(), api.aiTraces(),
      ]);
      const health = healthResult.status === 'fulfilled' ? healthResult.value : undefined;
      const students = studentsResult.status === 'fulfilled' ? studentsResult.value : [];
      setApiStatus(health?.status === 'ok' && health.database === 'ok' ? 'healthy' : 'unavailable');
      setExternalUsers(externalResult.status === 'fulfilled' ? externalResult.value : []);
      setIntegration(integrationResult.status === 'fulfilled' ? integrationResult.value : null);
      setKnowledge(knowledgeResult.status === 'fulfilled' ? knowledgeResult.value : []);
      setTraces(tracesResult.status === 'fulfilled' ? tracesResult.value : []);
      
      // Only set soft error if ALL critical calls fail - don't show raw errors
      const allFailed = healthResult.status === 'rejected' && studentsResult.status === 'rejected' && integrationResult.status === 'rejected';
      if (allFailed) setError(translate(locale, 'softError'));
      
      const base = students.map((student) => ({ student, results: [], loading: true }));
      setLearners(base);
      setSelectedId((current) => current ?? students[0]?.id);
      const enriched = await Promise.all(base.map(async (item) => {
        try {
          const results = await api.results(item.student.id);
          const incorrect = results.find((row) => row.result.outcome === 'incorrect');
          const task = incorrect ? await api.task(incorrect.attempt.taskVersionId) : undefined;
          const state = task ? await api.learningState(item.student.id, task.task.skillId) : undefined;
          return { ...item, results, task, state, loading: false };
        } catch {
          // Don't propagate individual learner errors - keep page usable
          return { ...item, loading: false };
        }
      }));
      setLearners(enriched);
      const firstAttempt = enriched.flatMap((item) => item.results).find((item) => item.result.outcome === 'incorrect');
      setSelectedAttemptId((current) => current ?? firstAttempt?.attempt.id);
    } catch {
      // Top-level catch should not happen with Promise.allSettled, but handle gracefully
      setApiStatus('unavailable');
      setError(translate(locale, 'softError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const bootRequested = useRef(false);
  useEffect(() => {
    if (bootRequested.current) return;
    bootRequested.current = true;
    void reload();
  }, []);

  const selected = learners.find((item) => item.student.id === selectedId) ?? learners[0];
  const attempts = useMemo(() => learners.flatMap((item) => item.results), [learners]);
  const incorrectAttempts = useMemo(() => learners.flatMap((item) => item.results.filter((result) => result.result.outcome === 'incorrect').map((result) => ({ ...result, learner: item.student }))), [learners]);
  const selectedAttempt = selected?.results.find((item) => item.attempt.id === selectedAttemptId) ?? incorrectAttempts[0];
  const approvedKnowledge = knowledge.filter((item) => item.versionStatus === 'approved');

  const selectLearner = (id: string) => {
    setSelectedId(id);
    const next = learners.find((item) => item.student.id === id)?.results.find((item) => item.result.outcome === 'incorrect');
    if (next) setSelectedAttemptId(next.attempt.id);
  };

  const requestRemediation = async () => {
    const externalUser = externalUsers[0];
    if (!selectedAttempt || !externalUser) {
      setActionError(translate(locale, 'softError'));
      return;
    }
    setActionError(undefined);
    setRemediation(null);
    try {
      const result = await api.remediation({
        externalUserId: externalUser.externalUserId,
        attemptId: selectedAttempt.attempt.id,
        learnerQuestion: 'Help explain what I should review without revealing the answer.',
        idempotencyKey: `showcase-remediation-${selectedAttempt.attempt.id}`,
      });
      setRemediation(result);
      setTraces(await api.aiTraces());
    } catch {
      // Don't expose technical error messages - show soft fallback
      setActionError(translate(locale, 'ai.unavailable'));
    }
  };

  const value = useMemo<EcosystemContextValue>(() => ({
    locale,
    setLocale,
    t: (key) => translate(locale, key),
    apiStatus,
    loading,
    refreshing,
    error,
    actionError,
    reload,
    learners,
    attempts,
    incorrectAttempts,
    selected,
    selectedAttempt,
    externalUsers,
    integration,
    knowledge,
    approvedKnowledge,
    traces,
    remediation,
    selectLearner,
    selectAttempt: setSelectedAttemptId,
    requestRemediation,
  }), [locale, apiStatus, loading, refreshing, error, actionError, learners, attempts, incorrectAttempts, selected, selectedAttempt, externalUsers, integration, knowledge, approvedKnowledge, traces, remediation]);

  return <EcosystemContext.Provider value={value}>{children}</EcosystemContext.Provider>;
}

export function useEcosystem() {
  const context = useContext(EcosystemContext);
  if (!context) throw new Error('useEcosystem must be used inside EcosystemProvider');
  return context;
}
