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
      const health = await api.health();
      setApiStatus(health?.status === 'ok' && health.database === 'ok' ? 'healthy' : 'unavailable');
    } catch {
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

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

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
    setActionError(translate(locale, 'ai.unavailable'));
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
