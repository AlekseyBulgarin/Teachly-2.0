'use client';

import { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CircleDot,
  Database,
  ExternalLink,
  FileCheck2,
  Gauge,
  GitBranch,
  KeyRound,
  Layers3,
  Lightbulb,
  Loader2,
  Menu,
  Network,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  UsersRound,
  Workflow,
  X,
  Zap,
} from 'lucide-react';
import {
  api,
  ApiError,
  type AiTrace,
  type AttemptResult,
  type ExternalUser,
  type Integration,
  type KnowledgeStatus,
  type LearningState,
  type RemediationResponse,
  type Student,
  type Task,
} from '@/lib/api';

type Section = 'overview' | 'platform' | 'learning' | 'ai' | 'teacher' | 'knowledge' | 'analytics' | 'integrations';
type ModuleStatus = 'LIVE' | 'COMING NEXT' | 'PLANNED';
type EnrichedLearner = { student: Student; results: AttemptResult[]; task?: Task; state?: LearningState; loading: boolean; error?: string };

type NavItem = { id: Section; label: string; icon: LucideIcon; description: string };

const nav: NavItem[] = [
  { id: 'overview', label: 'Ecosystem Overview', icon: Gauge, description: 'The full intelligence loop' },
  { id: 'platform', label: 'Platform Core', icon: Layers3, description: 'Tenancy, identity and APIs' },
  { id: 'learning', label: 'Learning Intelligence', icon: Activity, description: 'Facts into learning state' },
  { id: 'ai', label: 'Educational AI', icon: BrainCircuit, description: 'Grounded assistance' },
  { id: 'teacher', label: 'Teacher Intelligence', icon: Lightbulb, description: 'Next-action intelligence' },
  { id: 'knowledge', label: 'Knowledge', icon: BookOpen, description: 'Governed context' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Business and learning signals' },
  { id: 'integrations', label: 'Integrations', icon: Network, description: 'The partner boundary' },
];

const ecosystemModules: Array<{
  id: string;
  label: string;
  kicker: string;
  description: string;
  inputs: string;
  outputs: string;
  value: string;
  status: ModuleStatus;
  icon: LucideIcon;
  tone: 'green' | 'blue' | 'amber' | 'slate';
}> = [
  {
    id: 'customer', label: 'Customer Platform', kicker: 'SOURCE', description: 'The LMS, product or learning experience that already owns the learner relationship.', inputs: 'Learners, courses, tasks', outputs: 'Authoritative learning context', value: 'Add intelligence without replacing the customer frontend.', status: 'LIVE', icon: Database, tone: 'slate',
  },
  {
    id: 'integration', label: 'Integration Layer', kicker: 'BOUNDARY', description: 'Tenant-scoped REST access that keeps partner identity and data ownership explicit.', inputs: 'API key, scopes, external user', outputs: 'Authenticated workspace context', value: 'Connect safely to an existing platform, auth and billing system.', status: 'LIVE', icon: Network, tone: 'blue',
  },
  {
    id: 'context', label: 'Learning Context', kicker: 'CONTEXT', description: 'Teachly joins the learner, task, attempt and result into a bounded context.', inputs: 'Learner, task, attempt, result', outputs: 'Context references', value: 'Every downstream insight can point back to the event that produced it.', status: 'LIVE', icon: Workflow, tone: 'green',
  },
  {
    id: 'learning', label: 'Learning Intelligence', kicker: 'EVIDENCE', description: 'Deterministic outcomes become learning events, skill evidence and derived state.', inputs: 'Attempts and results', outputs: 'Evidence and learning state', value: 'Turn product activity into explainable educational signals.', status: 'LIVE', icon: Activity, tone: 'green',
  },
  {
    id: 'knowledge', label: 'Knowledge Layer', kicker: 'GOVERNANCE', description: 'Approved, licensed and explicitly permitted material is available for retrieval.', inputs: 'Source, document, version', outputs: 'Provider-safe knowledge refs', value: 'Keep provenance and permission visible before AI sees context.', status: 'LIVE', icon: BookOpen, tone: 'amber',
  },
  {
    id: 'ai', label: 'Educational AI', kicker: 'ASSISTANCE', description: 'Grounded remediation returns a structured proposal without changing the authoritative result.', inputs: 'Evidence and approved knowledge', outputs: 'Explanation, hint, confidence', value: 'Assist the learning loop without grading or hiding the source of truth.', status: 'LIVE', icon: BrainCircuit, tone: 'green',
  },
  {
    id: 'teacher', label: 'Teacher Intelligence', kicker: 'NEXT ACTION', description: 'Evidence-backed learner gaps and recommendations for the people supporting learning.', inputs: 'Learning state and AI refs', outputs: 'Teacher insights', value: 'Give educators a clearer next action, not another opaque score.', status: 'COMING NEXT', icon: Lightbulb, tone: 'blue',
  },
  {
    id: 'analytics', label: 'Analytics', kicker: 'SIGNALS', description: 'Product and education teams can understand activity, usage and learning patterns.', inputs: 'Events, traces, cohorts', outputs: 'Business intelligence', value: 'Show the value of educational intelligence across the customer product.', status: 'PLANNED', icon: BarChart3, tone: 'slate',
  },
];

const audienceCards = [
  { label: 'STUDENT', title: 'Support that knows the moment', detail: 'Better explanations and contextual hints tied to the learner’s actual attempt.', icon: UserRound, tone: 'green' as const },
  { label: 'TEACHER', title: 'A clearer next action', detail: 'Evidence-backed gaps and recommended material instead of another opaque score.', icon: Lightbulb, tone: 'blue' as const },
  { label: 'BUSINESS', title: 'Intelligence as infrastructure', detail: 'Differentiated learning capability delivered through the product you already run.', icon: BarChart3, tone: 'amber' as const },
];

function formatDate(value?: string | null) {
  if (!value) return 'No activity';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

function shortId(value: string) { return `${value.slice(0, 8)}...${value.slice(-4)}`; }

function statusLabel(status?: string) { return (status ?? 'unknown').replaceAll('_', ' '); }

export default function Home() {
  const [section, setSection] = useState<Section>('overview');
  const [learners, setLearners] = useState<EnrichedLearner[]>([]);
  const [externalUsers, setExternalUsers] = useState<ExternalUser[]>([]);
  const [integration, setIntegration] = useState<Integration | null>(null);
  const [knowledge, setKnowledge] = useState<KnowledgeStatus[]>([]);
  const [traces, setTraces] = useState<AiTrace[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [selectedAttemptId, setSelectedAttemptId] = useState<string>();
  const [remediation, setRemediation] = useState<RemediationResponse | null>(null);
  const [remediationRetry, setRemediationRetry] = useState(0);
  const [selectedModuleId, setSelectedModuleId] = useState('integration');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>();
  const [mobileNav, setMobileNav] = useState(false);

  const load = async () => {
    setError(undefined);
    try {
      const [students, external, currentIntegration, knowledgeStatus, aiRequests] = await Promise.all([
        api.students(), api.externalUsers(), api.integration(), api.knowledge(), api.aiTraces(),
      ]);
      const base = students.map((student) => ({ student, results: [], loading: true }));
      setExternalUsers(external);
      setIntegration(currentIntegration);
      setKnowledge(knowledgeStatus);
      setTraces(aiRequests);
      setLearners(base);
      setSelectedId((current) => current ?? students[0]?.id);
      const enriched = await Promise.all(base.map(async (item) => {
        try {
          const results = await api.results(item.student.id);
          const incorrect = results.find((row) => row.result.outcome === 'incorrect');
          const task = incorrect ? await api.task(incorrect.attempt.taskVersionId) : undefined;
          const state = task ? await api.learningState(item.student.id, task.task.skillId) : undefined;
          return { ...item, results, task, state, loading: false };
        } catch (itemError) {
          return { ...item, loading: false, error: itemError instanceof Error ? itemError.message : 'Unable to load learner' };
        }
      }));
      setLearners(enriched);
      const firstAttempt = enriched.find((item) => item.results.some((row) => row.result.outcome === 'incorrect'))?.results.find((row) => row.result.outcome === 'incorrect');
      setSelectedAttemptId((current) => current ?? firstAttempt?.attempt.id);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to connect to Teachly API');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const selected = learners.find((item) => item.student.id === selectedId) ?? learners[0];
  const selectedAttempt = selected?.results.find((item) => item.attempt.id === selectedAttemptId) ?? selected?.results.find((item) => item.result.outcome === 'incorrect');
  const selectedExternal = externalUsers[0];
  const attempts = learners.flatMap((item) => item.results);
  const incorrectAttempts = learners.flatMap((item) => item.results.filter((result) => result.result.outcome === 'incorrect').map((result) => ({ ...result, learner: item.student })));
  const approvedKnowledge = knowledge.filter((item) => item.versionStatus === 'approved');

  const requestRemediation = async () => {
    if (!selectedAttempt || !selectedExternal) return;
    setError(undefined);
    setRemediation(null);
    try {
      const result = await api.remediation({
        externalUserId: selectedExternal.externalUserId,
        attemptId: selectedAttempt.attempt.id,
        learnerQuestion: 'Help explain what I should review without revealing the answer.',
        idempotencyKey: `demo-remediation-${selectedAttempt.attempt.id}${remediationRetry ? `-retry-${remediationRetry}` : ''}`,
      });
      setRemediation(result);
      setRemediationRetry(0);
      setSection('ai');
      const updated = await api.aiTraces();
      setTraces(updated);
    } catch (requestError) {
      setRemediationRetry((attempt) => attempt + 1);
      if (requestError instanceof ApiError) setError(`${requestError.status} · ${requestError.message}`);
      else setError('Grounded remediation is unavailable right now.');
    }
  };

  const navigate = (next: Section) => { setSection(next); setMobileNav(false); };
  const activeNav = nav.find((item) => item.id === section) ?? nav[0];

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-slate-100">
      <aside className={`${mobileNav ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 flex w-[286px] flex-col border-r border-[var(--border)] bg-[rgba(10,18,33,.98)] px-4 py-5 transition-transform lg:static lg:translate-x-0`}>
        <Brand />
        <div className="mt-10 px-3 text-[10px] font-semibold uppercase tracking-[.22em] text-slate-600">Teachly ecosystem</div>
        <nav className="mt-3 space-y-1" aria-label="Primary navigation">
          {nav.map((item) => <button key={item.id} onClick={() => navigate(item.id)} className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${section === item.id ? 'bg-emerald-400/[.11] text-emerald-200 ring-1 ring-emerald-300/20' : 'text-slate-400 hover:bg-white/[.04] hover:text-slate-100'}`}>
            <item.icon size={17} strokeWidth={1.8} />
            <span className="min-w-0 flex-1"><span className="block truncate text-[12px] font-medium">{item.label}</span><span className="mt-0.5 block truncate text-[10px] text-slate-600 group-hover:text-slate-500">{item.description}</span></span>
            {section === item.id && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300 shadow-[0_0_10px_#10b981]" />}
          </button>)}
        </nav>
        <div className="mt-auto space-y-3">
          <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[.055] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200"><span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_9px_#10b981]" /> Live reference client</div>
            <p className="mt-2 text-[11px] leading-5 text-slate-500">Real Teachly API data, governed context and a safe AI proposal flow.</p>
          </div>
          <div className="flex items-center justify-between px-3 text-[10px] text-slate-600"><span>TEACHLY / 0.1</span><span>DEBUG MODE</span></div>
        </div>
      </aside>
      {mobileNav && <button aria-label="Close navigation" onClick={() => setMobileNav(false)} className="fixed inset-0 z-30 bg-slate-950/75 lg:hidden" />}

      <main className="min-w-0 lg:ml-0">
        <header className="sticky top-0 z-20 flex min-h-[76px] items-center justify-between border-b border-[var(--border)] bg-[rgba(15,23,42,.84)] px-5 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3"><button aria-label="Open navigation" onClick={() => setMobileNav(true)} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 lg:hidden"><Menu size={19} /></button><div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-slate-600">Teachly Ecosystem / Demo workspace</p><h1 className="mt-1 text-base font-semibold tracking-tight text-slate-100">{activeNav.label}</h1></div></div>
          <div className="flex items-center gap-3"><button onClick={() => { setRefreshing(true); void load(); }} className="rounded-lg border border-[var(--border)] p-2 text-slate-400 transition hover:border-slate-600 hover:text-slate-100" aria-label="Refresh data"><RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /></button><div className="hidden items-center gap-2 rounded-full border border-[var(--border)] bg-white/[.03] px-3 py-1.5 text-[11px] text-slate-300 sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_#10b981]" /> API connected</div><div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-300 to-cyan-300 text-xs font-bold text-slate-950">T</div></div>
        </header>

        <div className="mx-auto max-w-[1480px] p-5 sm:p-8">
          {error && <div role="alert" className="mb-6 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/[.08] p-4 text-sm text-red-200"><CircleAlert size={17} className="mt-0.5 shrink-0" /><div className="flex-1">{error}</div><button onClick={() => setError(undefined)} aria-label="Dismiss error"><X size={16} /></button></div>}
          {loading ? <LoadingState /> : section === 'overview' ? <Overview learners={learners} attempts={attempts} incorrectAttempts={incorrectAttempts} traces={traces} approvedKnowledge={approvedKnowledge} integration={integration} selectedModuleId={selectedModuleId} onSelectModule={setSelectedModuleId} onNavigate={navigate} /> : section === 'platform' ? <PlatformCore integration={integration} externalUsers={externalUsers} traces={traces} /> : section === 'learning' ? <LearningIntelligence learners={learners} selected={selected} selectedAttempt={selectedAttempt} onSelectLearner={(id) => setSelectedId(id)} /> : section === 'ai' ? <EducationalAi learners={learners} selected={selected} selectedAttempt={selectedAttempt} remediation={remediation} onSelectAttempt={setSelectedAttemptId} onRemediate={requestRemediation} /> : section === 'teacher' ? <TeacherIntelligence learners={learners} selected={selected} /> : section === 'knowledge' ? <Knowledge knowledge={knowledge} /> : section === 'analytics' ? <Analytics learners={learners} attempts={attempts} traces={traces} approvedKnowledge={approvedKnowledge} /> : <Integrations integration={integration} externalUsers={externalUsers} traces={traces} />}
        </div>
      </main>
    </div>
  );
}

function Brand() {
  return <div className="flex items-center gap-3 px-3"><div className="relative h-9 w-9"><span className="absolute left-0 top-0 h-4 w-4 rounded-[5px] bg-emerald-300" /><span className="absolute right-0 top-0 h-4 w-4 rounded-[5px] bg-cyan-300" /><span className="absolute bottom-0 left-[10px] h-4 w-4 rounded-[5px] bg-emerald-500" /></div><div><div className="text-[15px] font-semibold tracking-tight text-slate-100">Teachly</div><div className="text-[10px] uppercase tracking-[.2em] text-emerald-300/70">Ecosystem</div></div></div>;
}

function LoadingState() { return <div className="flex min-h-[65vh] items-center justify-center"><div className="flex items-center gap-3 text-sm text-slate-400"><Loader2 size={18} className="animate-spin text-emerald-300" />Loading the intelligence layer...</div></div>; }

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-emerald-300">{eyebrow}</p><h2 className="mt-3 max-w-4xl text-3xl font-semibold tracking-[-.035em] text-slate-50 sm:text-[42px] sm:leading-[1.08]">{title}</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">{description}</p></div>{action}</div>;
}

function StatusBadge({ status }: { status: ModuleStatus | string }) {
  const tone = status === 'LIVE' || status === 'approved' || status === 'allowed' || status === 'active' ? 'green' : status === 'COMING NEXT' || status === 'review' || status === 'not_reviewed' ? 'amber' : 'slate';
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.16em] ${tone === 'green' ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200' : tone === 'amber' ? 'border-amber-300/20 bg-amber-300/10 text-amber-200' : 'border-slate-600/70 bg-slate-800/60 text-slate-400'}`}><span className={`h-1.5 w-1.5 rounded-full ${tone === 'green' ? 'bg-emerald-300' : tone === 'amber' ? 'bg-amber-300' : 'bg-slate-500'}`} />{status}</span>;
}

function SectionCard({ children, className = '', title, detail, icon: Icon, action }: { children: React.ReactNode; className?: string; title?: string; detail?: string; icon?: LucideIcon; action?: React.ReactNode }) {
  return <section className={`overflow-hidden rounded-[22px] border border-[var(--border)] bg-[linear-gradient(145deg,rgba(30,41,59,.82),rgba(15,23,42,.78))] shadow-[0_18px_60px_rgba(2,6,23,.18)] ${className}`}>{title && <div className="flex items-start justify-between border-b border-[var(--border)] px-5 py-4 sm:px-6"><div className="flex items-center gap-3">{Icon && <div className="rounded-xl bg-emerald-300/10 p-2 text-emerald-200"><Icon size={16} /></div>}<div><h3 className="text-sm font-semibold text-slate-100">{title}</h3>{detail && <p className="mt-1 text-[11px] text-slate-500">{detail}</p>}</div></div>{action}</div>}{children}</section>;
}

function MetricCard({ label, value, detail, icon: Icon, tone = 'green' }: { label: string; value: string | number; detail: string; icon: LucideIcon; tone?: 'green' | 'blue' | 'amber' }) {
  const colors = tone === 'green' ? 'bg-emerald-300/10 text-emerald-200' : tone === 'blue' ? 'bg-blue-300/10 text-blue-200' : 'bg-amber-300/10 text-amber-200';
  return <div className="rounded-[20px] border border-[var(--border)] bg-slate-900/35 p-5 transition hover:-translate-y-0.5 hover:border-slate-600"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-slate-500">{label}</p><p className="mt-3 text-3xl font-semibold tracking-tight text-slate-50">{value}</p><p className="mt-2 text-[11px] leading-5 text-slate-500">{detail}</p></div><div className={`rounded-xl p-2.5 ${colors}`}><Icon size={18} /></div></div></div>;
}

function Overview({ learners, attempts, incorrectAttempts, traces, approvedKnowledge, integration, selectedModuleId, onSelectModule, onNavigate }: { learners: EnrichedLearner[]; attempts: AttemptResult[]; incorrectAttempts: Array<AttemptResult & { learner: Student }>; traces: AiTrace[]; approvedKnowledge: KnowledgeStatus[]; integration: Integration | null; selectedModuleId: string; onSelectModule: (id: string) => void; onNavigate: (section: Section) => void }) {
  const selectedModule = ecosystemModules.find((module) => module.id === selectedModuleId) ?? ecosystemModules[1];
  return <div className="space-y-7"><PageHeader eyebrow="Teachly Ecosystem" title="Educational Intelligence infrastructure for modern learning platforms." description="Teachly connects the learning activity your product already owns to explainable evidence, governed knowledge and structured educational AI. This is the live reference client and the system map behind it." action={<button onClick={() => onNavigate('ai')} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_30px_rgba(16,185,129,.18)] transition hover:bg-emerald-200">Explore live AI flow <ArrowUpRight size={16} /></button>} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Learners" value={learners.length} detail="Real learner relationships" icon={UsersRound} /><MetricCard label="Attempts reviewed" value={attempts.length} detail={`${incorrectAttempts.length} incorrect result${incorrectAttempts.length === 1 ? '' : 's'}`} icon={Target} tone="blue" /><MetricCard label="AI requests" value={traces.length} detail="Trace records in this workspace" icon={BrainCircuit} tone="amber" /><MetricCard label="Approved knowledge" value={approvedKnowledge.length} detail="Versions eligible for external AI" icon={FileCheck2} /></div>
    <div className="grid gap-6 xl:grid-cols-[1.55fr_.8fr]"><SectionCard title="The Teachly intelligence loop" detail="Click a module to inspect its inputs, outputs and business value." icon={GitBranch}><div className="p-5 sm:p-7"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-medium text-slate-200">From customer data to a useful next step</p><p className="mt-1 text-xs text-slate-500">Live surfaces are grounded in the seeded API; roadmap surfaces are marked clearly.</p></div><div className="flex gap-2"><StatusBadge status="LIVE" /><StatusBadge status="COMING NEXT" /><StatusBadge status="PLANNED" /></div></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{ecosystemModules.map((module, index) => <div key={module.id} className="relative"><EcosystemModuleCard module={module} active={selectedModuleId === module.id} onClick={() => onSelectModule(module.id)} />{index < ecosystemModules.length - 1 && <ArrowRight size={16} className="absolute -bottom-2.5 left-1/2 z-10 hidden -translate-x-1/2 rotate-90 text-slate-700 sm:block xl:-right-2.5 xl:left-auto xl:top-1/2 xl:translate-x-0 xl:-translate-y-1/2 xl:rotate-0" />}</div>)}</div><div className="mt-5 rounded-2xl border border-emerald-300/15 bg-emerald-300/[.045] p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><StatusBadge status={selectedModule.status} /><span className="text-[10px] font-semibold uppercase tracking-[.16em] text-slate-600">Selected module</span></div><h4 className="mt-3 text-xl font-semibold text-slate-100">{selectedModule.label}</h4><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{selectedModule.description}</p></div><selectedModule.icon size={28} className="text-emerald-200/70" /></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><DetailPair label="Inputs" value={selectedModule.inputs} /><DetailPair label="Outputs" value={selectedModule.outputs} /><DetailPair label="Business value" value={selectedModule.value} /></div></div></div></SectionCard><SectionCard title="Why the ecosystem matters" detail="One infrastructure layer, three audiences." icon={Sparkles}><div className="space-y-3 p-5 sm:p-6">{audienceCards.map((card) => <div key={card.label} className="rounded-2xl border border-[var(--border)] bg-slate-950/20 p-4"><div className="flex items-center gap-3"><div className={`rounded-xl p-2 ${card.tone === 'green' ? 'bg-emerald-300/10 text-emerald-200' : card.tone === 'blue' ? 'bg-blue-300/10 text-blue-200' : 'bg-amber-300/10 text-amber-200'}`}><card.icon size={16} /></div><div><p className="text-[9px] font-bold uppercase tracking-[.17em] text-slate-500">{card.label}</p><p className="mt-1 text-sm font-semibold text-slate-200">{card.title}</p></div></div><p className="mt-3 text-xs leading-5 text-slate-500">{card.detail}</p></div>)}<div className="border-t border-[var(--border)] pt-4"><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-slate-600">Current connection</p><p className="mt-2 text-sm text-slate-300">{integration?.name ?? 'No integration loaded'}</p><p className="mt-1 text-xs text-slate-500">{integration?.status ?? 'Waiting for API status'}</p></div></div></SectionCard></div>
    <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]"><SectionCard title="Real data snapshot" detail="Only values returned by the Teachly API are shown here." icon={Database}><div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6"><SnapshotRow label="Active integration" value={integration?.name ?? 'Unavailable'} status={integration?.status ?? 'unknown'} /><SnapshotRow label="Mapped external users" value={`${learners.length ? 'Tenant-scoped' : 'No'} · ${integration ? 'connected' : 'unavailable'}`} status={integration ? 'LIVE' : 'unknown'} /><SnapshotRow label="Incorrect attempts" value={`${incorrectAttempts.length} available to explain`} status={incorrectAttempts.length ? 'LIVE' : 'empty'} /><SnapshotRow label="Grounded AI traces" value={`${traces.length} persisted request${traces.length === 1 ? '' : 's'}`} status={traces.length ? 'LIVE' : 'empty'} /></div></SectionCard><SectionCard title="What Teachly receives" detail="A bounded contract, not a replacement platform." icon={ArrowRight}><div className="space-y-3 p-5 sm:p-6"><FlowMini label="Customer platform" detail="Learner and course context" /><FlowMini label="Attempt + result" detail="The authoritative learning fact" /><FlowMini label="Approved knowledge" detail="Licensed material with permission" /><div className="flex items-center gap-2 pt-2 text-xs font-medium text-emerald-200">Structured response back to your product <ArrowRight size={14} /></div></div></SectionCard></div>
  </div>;
}

function EcosystemModuleCard({ module, active, onClick }: { module: typeof ecosystemModules[number]; active: boolean; onClick: () => void }) {
  const tone = module.tone === 'green' ? 'text-emerald-200 bg-emerald-300/10' : module.tone === 'blue' ? 'text-blue-200 bg-blue-300/10' : module.tone === 'amber' ? 'text-amber-200 bg-amber-300/10' : 'text-slate-300 bg-slate-700/40';
  return <button onClick={onClick} className={`w-full rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${active ? 'border-emerald-300/35 bg-emerald-300/[.08] shadow-[0_0_28px_rgba(16,185,129,.08)]' : 'border-[var(--border)] bg-slate-950/20 hover:border-slate-600'}`}><div className="flex items-start justify-between gap-2"><div className={`rounded-lg p-2 ${tone}`}><module.icon size={16} /></div><StatusBadge status={module.status} /></div><p className="mt-4 text-sm font-semibold text-slate-100">{module.label}</p><p className="mt-1 text-[10px] uppercase tracking-[.15em] text-slate-600">{module.kicker}</p></button>;
}

function PlatformCore({ integration, externalUsers, traces }: { integration: Integration | null; externalUsers: ExternalUser[]; traces: AiTrace[] }) {
  return <div className="space-y-7"><PageHeader eyebrow="Platform Core" title="Plug intelligence into the platform you already run." description="Teachly keeps organization, workspace, integration and external learner identity explicit. Your product remains the system of record for frontend, auth, billing and authoritative outcomes." /><div className="grid gap-4 md:grid-cols-3"><CapabilityCard status="LIVE" icon={ShieldCheck} title="Tenant isolation" detail="Every partner request resolves to an organization, workspace and integration context." /><CapabilityCard status="LIVE" icon={KeyRound} title="Scoped API access" detail="Credentials grant only the operations the customer integration has requested." /><CapabilityCard status="LIVE" icon={GitBranch} title="Traceable writes" detail="Authoritative learning events and AI requests retain their originating references." /></div><div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]"><SectionCard title="Tenant boundary" detail="Current integration metadata from the live API" icon={Network}><div className="space-y-4 p-5 sm:p-6">{integration ? <><InfoRow label="Integration" value={integration.name} /><InfoRow label="Status" value={integration.status} valueTone="green" /><InfoRow label="Organization" value={shortId(integration.organizationId)} mono /><InfoRow label="Workspace" value={shortId(integration.workspaceId)} mono /><InfoRow label="Scopes" value={integration.scopes.join(' · ')} /></> : <EmptyState text="No integration metadata is available." />}</div></SectionCard><SectionCard title="Operational surface" detail="Real records, no raw secrets" icon={Database}><div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6"><MetricCard label="External users" value={externalUsers.length} detail="Mapped through the integration" icon={UsersRound} /><MetricCard label="AI requests" value={traces.length} detail="Persisted trace records" icon={BrainCircuit} tone="amber" /></div><div className="border-t border-[var(--border)] p-5 text-xs leading-6 text-slate-500 sm:p-6">API keys are used at the server boundary and are never rendered in this client. Customer identity stays with the integrated platform.</div></SectionCard></div><SectionCard title="Core relationship" detail="The entities that make the partner boundary useful" icon={Layers3}><div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6"><RelationshipCard icon={UsersRound} title="Organization" detail="Business ownership" /><RelationshipCard icon={Layers3} title="Workspace" detail="Product context" /><RelationshipCard icon={Network} title="Integration" detail="Connection identity" /><RelationshipCard icon={UserRound} title="External user" detail="Learner mapping" /></div></SectionCard></div>;
}

function LearningIntelligence({ learners, selected, selectedAttempt, onSelectLearner }: { learners: EnrichedLearner[]; selected?: EnrichedLearner; selectedAttempt?: AttemptResult; onSelectLearner: (id: string) => void }) {
  const state = selected?.state;
  return <div className="space-y-7"><PageHeader eyebrow="Learning Intelligence" title="Turn learning activity into explainable state." description="Teachly preserves the path from an authoritative attempt and result to learning events, skill evidence and a derived learning state. Facts stay separate from interpretation." /><SectionCard title="The intelligence pipeline" detail="FACT → DERIVED STATE" icon={Workflow}><div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-5 sm:p-6">{[['Attempt', 'Learner action', Activity], ['Result', 'Authoritative outcome', CheckCircle2], ['Learning event', 'Traceable fact', GitBranch], ['Skill evidence', 'Evidence reference', Target], ['Learning state', 'Derived teacher view', Gauge]].map(([label, detail, Icon], index) => <div key={label as string} className="relative rounded-2xl border border-[var(--border)] bg-slate-950/20 p-4"><div className="flex items-center justify-between"><div className="rounded-lg bg-emerald-300/10 p-2 text-emerald-200"><Icon size={16} /></div><span className="text-[10px] font-semibold text-slate-700">0{index + 1}</span></div><p className="mt-5 text-sm font-semibold text-slate-200">{label as string}</p><p className="mt-1 text-xs text-slate-500">{detail as string}</p>{index < 4 && <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 text-slate-700 lg:block" size={16} />}</div>)}</div></SectionCard><div className="grid gap-6 xl:grid-cols-[280px_1fr]"><SectionCard title="Learner evidence" detail={`${learners.length} real relationship${learners.length === 1 ? '' : 's'}`} icon={UsersRound}><div className="p-2">{learners.map((item) => <button key={item.student.id} onClick={() => onSelectLearner(item.student.id)} className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${selected?.student.id === item.student.id ? 'bg-emerald-300/[.09]' : 'hover:bg-white/[.035]'}`}><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-slate-200">{item.student.displayName.slice(0, 1)}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-200">{item.student.displayName}</p><p className="mt-1 text-[11px] text-slate-500">{item.results.length} attempt{item.results.length === 1 ? '' : 's'}</p></div>{item.state && <CircleDot size={13} className="text-amber-300" />}</button>)}</div></SectionCard><div className="grid gap-6 lg:grid-cols-[1fr_.86fr]"><SectionCard title="Authoritative facts" detail="These records come from the learning API." icon={CheckCircle2}><div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">{selectedAttempt ? <><Fact label="Learner" value={selected?.student.displayName ?? 'Selected learner'} /><Fact label="Outcome" value={selectedAttempt.result.outcome} /><Fact label="Score" value={String(selectedAttempt.result.score)} /><Fact label="Evaluation" value={selectedAttempt.result.evaluationRule} /><Fact label="Attempt" value={shortId(selectedAttempt.attempt.id)} mono /><Fact label="Evaluated" value={formatDate(selectedAttempt.result.evaluatedAt)} /></> : <EmptyState text="Select a learner with activity to inspect facts." />}</div></SectionCard><SectionCard title="Derived state" detail="Computed from evidence, never from AI." icon={Gauge}><div className="p-5 sm:p-6">{state ? <><div className="flex items-center justify-between gap-3"><p className="text-2xl font-semibold capitalize text-slate-100">{statusLabel(state.status)}</p><StatusBadge status={state.status === 'showing_progress' ? 'LIVE' : 'COMING NEXT'} /></div><p className="mt-3 text-sm leading-6 text-slate-400">{state.explanation.reason}</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><MiniStat label="Evidence count" value={state.evidenceCount} /><MiniStat label="Recent outcomes" value={state.recentOutcomes.join(' · ') || 'None'} /></div><div className="mt-5 border-t border-[var(--border)] pt-4"><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-slate-600">Evidence references</p><div className="mt-3 flex flex-wrap gap-2">{state.explanation.evidenceReferences.map((ref) => <span key={ref} className="rounded-md border border-slate-700 bg-slate-950/30 px-2 py-1 font-mono text-[10px] text-slate-400">{ref}</span>)}</div></div></> : <EmptyState text="Learning state appears when the selected learner has a skill context." />}</div></SectionCard></div></div></div>;
}

function EducationalAi({ learners, selected, selectedAttempt, remediation, onSelectAttempt, onRemediate }: { learners: EnrichedLearner[]; selected?: EnrichedLearner; selectedAttempt?: AttemptResult; remediation: RemediationResponse | null; onSelectAttempt: (id: string) => void; onRemediate: () => void }) {
  const incorrect = learners.flatMap((item) => item.results.filter((result) => result.result.outcome === 'incorrect').map((result) => ({ ...result, learner: item.student })));
  return <div className="space-y-7"><PageHeader eyebrow="Educational AI / Live" title="Grounded assistance, bounded by evidence." description="The live capability is grounded remediation: a structured AI proposal based on the learner’s actual result and approved knowledge. It does not grade, mutate learning state or reveal answer keys." action={<div className="flex items-center gap-2"><StatusBadge status="LIVE" /><span className="text-xs text-slate-500">Fake provider fallback active locally</span></div>} /><div className="grid gap-6 xl:grid-cols-[.72fr_1.28fr]"><SectionCard title="Select a result" detail="FACT · incorrect deterministic results" icon={Target}><div className="divide-y divide-[var(--border)]">{incorrect.length ? incorrect.map((item) => <button key={item.attempt.id} onClick={() => onSelectAttempt(item.attempt.id)} className={`flex w-full items-center gap-3 px-5 py-4 text-left transition ${selectedAttempt?.attempt.id === item.attempt.id ? 'bg-emerald-300/[.08]' : 'hover:bg-white/[.03]'}`}><div className="h-2 w-2 rounded-full bg-amber-300" /><div className="min-w-0 flex-1"><p className="truncate text-sm text-slate-200">{item.learner.displayName}</p><p className="mt-1 text-xs text-slate-500">{shortId(item.attempt.id)} · {formatDate(item.result.evaluatedAt)}</p></div><ChevronRight size={15} className="text-slate-600" /></button>) : <EmptyState text="No incorrect results are available." />}</div><div className="border-t border-[var(--border)] p-5 text-xs leading-5 text-slate-500">The request is sent through the server proxy. Credentials and raw prompts stay server-side.</div></SectionCard><div className="space-y-6">{selectedAttempt ? <SectionCard title="Grounding context" detail="What Teachly is allowed to pass to the provider" icon={ShieldCheck}><div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6"><Fact label="Learner" value={selected?.student.displayName ?? 'Selected learner'} /><Fact label="Result" value={`${selectedAttempt.result.outcome} · score ${selectedAttempt.result.score}`} /><Fact label="Task" value={selected?.task?.course.name ?? 'Task context loaded'} /><Fact label="Skill" value={selected?.task?.skill.name ?? 'Skill context loaded'} /><Fact label="Attempt" value={shortId(selectedAttempt.attempt.id)} mono /><Fact label="Evidence" value={selected?.state?.explanation.evidenceReferences.length ? `${selected.state.explanation.evidenceReferences.length} refs` : 'Bounded context'} /></div><div className="border-t border-[var(--border)] px-5 py-4 text-xs text-slate-500 sm:px-6">The task statement is available to the assistant; answer keys and grading internals are not rendered.</div></SectionCard> : <SectionCard title="Grounding context" detail="Select an incorrect result to inspect the live capability" icon={ShieldCheck}><EmptyState text="Choose an attempt to see its bounded context." /></SectionCard>}{selectedAttempt && <div className="grid gap-6 lg:grid-cols-[1fr_.7fr]"><SectionCard title="Teachly AI proposal" detail="AI HYPOTHESIS · assistive output" icon={Sparkles}>{remediation ? <div className="p-5 sm:p-6"><div className="flex flex-wrap items-center gap-2"><StatusBadge status="LIVE" /><span className="text-xs text-slate-500">{Math.round(remediation.remediation.confidence * 100)}% confidence</span></div><h3 className="mt-4 text-xl font-semibold text-slate-100">{remediation.remediation.summary}</h3><div className="mt-5 space-y-5"><ProposalBlock label="Explanation" value={remediation.remediation.explanation} /><ProposalBlock label="Hint" value={remediation.remediation.hint} /><div className="grid gap-4 sm:grid-cols-2"><ProposalBlock label="Likely gap" value={remediation.remediation.likelyGap ?? 'No gap proposed'} /><div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-slate-600">Proposal boundary</p><p className="mt-2 text-sm leading-6 text-slate-400">Assistive only. The authoritative result and learning state remain unchanged.</p></div></div><RefGroup title="Evidence refs" refs={remediation.evidenceRefs} /><RefGroup title="Knowledge refs" refs={remediation.knowledgeRefs} /></div></div> : <div className="p-5 sm:p-6"><p className="max-w-lg text-sm leading-6 text-slate-400">Request a grounded proposal for this incorrect result. Teachly will use the approved knowledge boundary and return structured, reviewable output.</p><button onClick={onRemediate} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200">Request grounded remediation <Zap size={15} /></button></div>}</SectionCard><SectionCard title="What is next" detail="Capability roadmap" icon={ArrowRight}><div className="space-y-3 p-5 sm:p-6"><RoadmapRow status="LIVE" title="Grounded remediation" detail="Context-aware explanations and evidence-backed hints." /><RoadmapRow status="COMING NEXT" title="Misconception hypotheses" detail="Pattern-based teacher context, clearly marked as hypotheses." /><RoadmapRow status="COMING NEXT" title="Teacher insights" detail="A next-action view built on learning state." /><RoadmapRow status="PLANNED" title="Specialized Teachly models" detail="Purpose-built intelligence for learning workflows." /></div></SectionCard></div>}</div></div></div>;
}

function TeacherIntelligence({ learners, selected }: { learners: EnrichedLearner[]; selected?: EnrichedLearner }) {
  return <div className="space-y-7"><PageHeader eyebrow="Teacher Intelligence" title="Make the next teaching action easier to see." description="Teacher Intelligence is the next layer above learning state: a clear, evidence-backed explanation of where support is needed and what material may help. The roadmap is shown honestly; no future insights are presented as live data." action={<StatusBadge status="COMING NEXT" />} /><div className="grid gap-4 md:grid-cols-3"><RoadmapFeature status="COMING NEXT" icon={Target} title="Learner gaps" detail="Group evidence into the skills that need attention." /><RoadmapFeature status="COMING NEXT" icon={Lightbulb} title="Recommended material" detail="Connect a gap to approved, provider-safe knowledge." /><RoadmapFeature status="PLANNED" icon={UsersRound} title="Cohort patterns" detail="Surface recurring patterns across a class or workspace." /></div><div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]"><SectionCard title="What a teacher will receive" detail="Product capability view" icon={Sparkles}><div className="space-y-3 p-5 sm:p-6"><AudienceLine index="01" title="Clear gap" detail="What skill or concept needs another explanation?" /><AudienceLine index="02" title="Evidence" detail="Which attempts and results support the observation?" /><AudienceLine index="03" title="Next action" detail="What should the teacher or learner do next?" /><AudienceLine index="04" title="Material" detail="Which approved source can support that action?" /></div></SectionCard><SectionCard title="Grounded starting point" detail="Real context available today" icon={Activity}><div className="p-5 sm:p-6"><div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[.05] p-5"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-emerald-200">LIVE INPUT</p><p className="mt-3 text-lg font-semibold text-slate-100">{selected?.student.displayName ?? 'A Teachly learner'}</p><p className="mt-2 text-sm leading-6 text-slate-400">{selected?.state?.explanation.reason ?? 'Learning state and evidence can become the foundation for teacher intelligence.'}</p></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><MiniStat label="Learners in workspace" value={learners.length} /><MiniStat label="Selected evidence" value={selected?.state?.evidenceCount ?? 0} /></div></div></SectionCard></div><SectionCard title="Business outcome" detail="Why this matters to a learning platform" icon={BarChart3}><div className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6"><OutcomeCard title="Higher support quality" detail="Help is anchored to what actually happened." /><OutcomeCard title="Less teacher guesswork" detail="Evidence makes the next action easier to trust." /><OutcomeCard title="More product differentiation" detail="Educational intelligence becomes a reusable platform capability." /></div></SectionCard></div>;
}

function Knowledge({ knowledge }: { knowledge: KnowledgeStatus[] }) {
  return <div className="space-y-7"><PageHeader eyebrow="Knowledge / Governed context" title="Approved knowledge is a product boundary, not a prompt dump." description="Teachly tracks provenance from source to document, version, review and external-AI permission. Only the material that passes that boundary can ground an educational AI response." /><SectionCard title="Source → document → version → permission" detail="READ-ONLY · tenant-scoped knowledge status" icon={BookOpen}><div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-5 sm:p-6">{[['Source', 'Provenance', Database], ['Document', 'Content identity', BookOpen], ['Version', 'Immutable review unit', FileCheck2], ['Review', 'Approval state', ShieldCheck], ['Retrieval', 'Provider-safe refs', BrainCircuit]].map(([title, detail, Icon]) => <div key={title as string} className="rounded-2xl border border-[var(--border)] bg-slate-950/20 p-4"><Icon size={16} className="text-emerald-200" /><p className="mt-4 text-sm font-semibold text-slate-200">{title as string}</p><p className="mt-1 text-xs text-slate-500">{detail as string}</p></div>)}</div></SectionCard><SectionCard title="Approved knowledge inventory" detail={`${knowledge.length} version${knowledge.length === 1 ? '' : 's'} returned by the API`} icon={FileCheck2}>{knowledge.length ? <div className="divide-y divide-[var(--border)]">{knowledge.map((item) => <div key={item.versionId} className="grid gap-4 px-5 py-5 md:grid-cols-[1.35fr_.7fr_.75fr] md:items-center sm:px-6"><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-slate-200">{item.documentTitle}</p><StatusBadge status={item.versionStatus} /></div><p className="mt-1 text-xs text-slate-500">{item.sourceName} · version {item.version} · {item.sourceType}</p><p className="mt-2 font-mono text-[10px] text-slate-600">{shortId(item.versionId)}</p></div><div className="flex gap-2"><StatusPill label="License" value={item.licenseStatus} good={item.licenseStatus === 'allowed'} /><StatusPill label="External AI" value={item.externalAiPermission} good={item.externalAiPermission === 'allowed'} /></div><div className="text-xs text-slate-500">Approved<br /><span className="text-slate-300">{formatDate(item.approvedAt)}</span></div></div>)}</div> : <EmptyState text="No knowledge status is available from the API." />}</SectionCard><div className="grid gap-4 md:grid-cols-3"><CapabilityCard status="LIVE" icon={ShieldCheck} title="Provenance" detail="Source and document lineage remain visible to downstream consumers." /><CapabilityCard status="LIVE" icon={FileCheck2} title="Immutable versions" detail="Approved material is a stable review unit for retrieval." /><CapabilityCard status="LIVE" icon={BrainCircuit} title="Provider-safe context" detail="External AI permission is explicit, not implied by ingestion." /></div></div>;
}

function Analytics({ learners, attempts, traces, approvedKnowledge }: { learners: EnrichedLearner[]; attempts: AttemptResult[]; traces: AiTrace[]; approvedKnowledge: KnowledgeStatus[] }) {
  const incorrect = attempts.filter((item) => item.result.outcome === 'incorrect').length;
  const correct = attempts.filter((item) => item.result.outcome === 'correct').length;
  return <div className="space-y-7"><PageHeader eyebrow="Analytics" title="See the educational and business signals behind the product." description="Teachly can make learning activity, skill performance and AI usage legible to product and education teams. Live values come from the reference workspace; future analytics are labeled as roadmap." /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Learning activity" value={attempts.length} detail="Attempts returned by the API" icon={Activity} /><MetricCard label="Incorrect signals" value={incorrect} detail="Potential support moments" icon={Target} tone="amber" /><MetricCard label="AI usage" value={traces.length} detail="Grounded request traces" icon={BrainCircuit} tone="blue" /><MetricCard label="Knowledge coverage" value={approvedKnowledge.length} detail="Approved AI-eligible versions" icon={FileCheck2} /></div><div className="grid gap-6 lg:grid-cols-[1fr_.9fr]"><SectionCard title="Live workspace signals" detail="FACTS from the reference client" icon={BarChart3}><div className="space-y-4 p-5 sm:p-6"><SignalRow label="Learners connected" value={`${learners.length}`} detail="External learner relationships" tone="green" /><SignalRow label="Correct outcomes" value={`${correct}`} detail="Authoritative result records" tone="blue" /><SignalRow label="Incorrect outcomes" value={`${incorrect}`} detail="Available for grounded support" tone="amber" /><SignalRow label="AI traces" value={`${traces.length}`} detail="Structured requests persisted" tone="green" /></div></SectionCard><SectionCard title="Capability roadmap" detail="Do not confuse product direction with live reporting" icon={Workflow}><div className="space-y-3 p-5 sm:p-6"><RoadmapRow status="COMING NEXT" title="Weak-area trends" detail="Skill-level activity across learners." /><RoadmapRow status="COMING NEXT" title="AI effectiveness" detail="Usage and outcome signals for product teams." /><RoadmapRow status="PLANNED" title="Cohort patterns" detail="Cross-learner educational intelligence." /><RoadmapRow status="PLANNED" title="Recommendation analytics" detail="Which next actions create measurable lift." /></div></SectionCard></div><SectionCard title="Business readout" detail="The value of an intelligence layer" icon={Sparkles}><div className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6"><OutcomeCard title="Differentiate the core product" detail="Learning intelligence becomes part of the customer experience, not a separate report." /><OutcomeCard title="Make AI accountable" detail="Every proposal can point to evidence and approved knowledge." /><OutcomeCard title="Operate across tenants" detail="Product and education teams share a governed view of value." /></div></SectionCard></div>;
}

function Integrations({ integration, externalUsers, traces }: { integration: Integration | null; externalUsers: ExternalUser[]; traces: AiTrace[] }) {
  return <div className="space-y-7"><PageHeader eyebrow="Integrations / B2B boundary" title="Bring Teachly into the product your customers already use." description="The integration layer receives tenant-scoped learning context and returns structured intelligence. It does not replace the customer’s auth, frontend, CRM or billing systems." /><SectionCard title="Data flow" detail="Customer platform → Teachly REST API → structured response" icon={Network}><div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-5 sm:p-6">{[['Customer platform', 'Learner + course data', Database], ['Teachly API', 'Scoped integration', Network], ['External user', `${externalUsers.length} mapped`, UserRound], ['Learning context', 'Attempt + result', Activity], ['Structured response', `${traces.length} trace${traces.length === 1 ? '' : 's'}`, BrainCircuit]].map(([label, detail, Icon], index) => <div key={label as string} className="relative rounded-2xl border border-[var(--border)] bg-slate-950/20 p-4"><div className="flex items-center justify-between"><Icon size={17} className="text-emerald-200" /><span className="text-[10px] font-semibold text-slate-700">0{index + 1}</span></div><p className="mt-5 text-sm font-semibold text-slate-200">{label as string}</p><p className="mt-1 text-xs text-slate-500">{detail as string}</p>{index < 4 && <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 text-slate-700 lg:block" size={16} />}</div>)}</div></SectionCard><div className="grid gap-6 lg:grid-cols-[1fr_.9fr]"><SectionCard title="Active connection" detail="Real integration metadata" icon={ShieldCheck}><div className="space-y-4 p-5 sm:p-6">{integration ? <><InfoRow label="Name" value={integration.name} /><InfoRow label="Status" value={integration.status} valueTone="green" /><InfoRow label="Workspace" value={shortId(integration.workspaceId)} mono /><div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-slate-600">Scopes</p><div className="mt-3 flex flex-wrap gap-2">{integration.scopes.map((scope) => <span key={scope} className="rounded-lg border border-emerald-300/15 bg-emerald-300/[.06] px-2.5 py-1.5 font-mono text-[10px] text-emerald-200">{scope}</span>)}</div></div></> : <EmptyState text="No integration is available." />}</div></SectionCard><SectionCard title="Future connection options" detail="Explicitly not live in this reference client" icon={GitBranch}><div className="space-y-3 p-5 sm:p-6"><RoadmapRow status="COMING NEXT" title="SDK and webhooks" detail="Simpler event delivery for partner teams." /><RoadmapRow status="PLANNED" title="SSO and LTI" detail="Identity and launch options for education platforms." /><RoadmapRow status="PLANNED" title="SCORM and xAPI" detail="Additional interoperability surfaces." /></div></SectionCard></div><div className="grid gap-4 md:grid-cols-3"><CapabilityCard status="LIVE" icon={KeyRound} title="No raw key display" detail="Secrets stay at the server-side proxy boundary." /><CapabilityCard status="LIVE" icon={UsersRound} title="External learner mapping" detail="A customer identifier can resolve to a Teachly learner." /><CapabilityCard status="LIVE" icon={FileCheck2} title="Structured responses" detail="Partners receive stable output and references, not provider internals." /></div></div>;
}

function DetailPair({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-[var(--border)] bg-slate-950/20 p-3"><p className="text-[9px] font-bold uppercase tracking-[.15em] text-slate-600">{label}</p><p className="mt-2 text-xs leading-5 text-slate-300">{value}</p></div>; }
function SnapshotRow({ label, value, status }: { label: string; value: string; status: string }) { return <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-slate-950/20 px-4 py-3"><div><p className="text-xs font-medium text-slate-300">{label}</p><p className="mt-1 text-[11px] text-slate-500">{value}</p></div><StatusBadge status={status === 'active' || status === 'LIVE' ? 'LIVE' : status} /></div>; }
function FlowMini({ label, detail }: { label: string; detail: string }) { return <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-slate-950/20 px-3 py-3"><span className="h-2 w-2 rounded-full bg-emerald-300" /><div><p className="text-xs font-medium text-slate-300">{label}</p><p className="mt-1 text-[11px] text-slate-600">{detail}</p></div></div>; }
function InfoRow({ label, value, mono = false, valueTone }: { label: string; value: string; mono?: boolean; valueTone?: 'green' }) { return <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] pb-3 last:border-b-0 last:pb-0"><span className="text-xs text-slate-500">{label}</span><span className={`text-right text-xs ${valueTone === 'green' ? 'text-emerald-200' : 'text-slate-300'} ${mono ? 'font-mono' : ''}`}>{value}</span></div>; }
function CapabilityCard({ status, icon: Icon, title, detail }: { status: ModuleStatus; icon: LucideIcon; title: string; detail: string }) { return <div className="rounded-[20px] border border-[var(--border)] bg-slate-900/35 p-5"><div className="flex items-start justify-between gap-3"><div className="rounded-xl bg-emerald-300/10 p-2.5 text-emerald-200"><Icon size={18} /></div><StatusBadge status={status} /></div><h3 className="mt-5 text-sm font-semibold text-slate-100">{title}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p></div>; }
function RelationshipCard({ icon: Icon, title, detail }: { icon: LucideIcon; title: string; detail: string }) { return <div className="rounded-2xl border border-[var(--border)] bg-slate-950/20 p-4"><Icon size={17} className="text-emerald-200" /><p className="mt-4 text-sm font-semibold text-slate-200">{title}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>; }
function Fact({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) { return <div className="rounded-xl border border-[var(--border)] bg-slate-950/20 p-3"><p className="text-[9px] font-bold uppercase tracking-[.15em] text-slate-600">{label}</p><p className={`mt-2 break-words text-sm font-medium text-slate-200 ${mono ? 'font-mono text-xs' : ''}`}>{value}</p></div>; }
function MiniStat({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl bg-slate-950/25 p-3"><p className="text-[9px] font-bold uppercase tracking-[.14em] text-slate-600">{label}</p><p className="mt-2 text-sm text-slate-300">{value}</p></div>; }
function ProposalBlock({ label, value }: { label: string; value: string }) { return <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-600">{label}</p><p className="mt-2 text-sm leading-6 text-slate-300">{value}</p></div>; }
function RefGroup({ title, refs }: { title: string; refs: string[] }) { return <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-600">{title}</p>{refs.length ? <div className="mt-2 flex flex-wrap gap-2">{refs.map((ref) => <span key={ref} className="rounded-md border border-slate-700 bg-slate-950/30 px-2 py-1 font-mono text-[10px] text-slate-400">{ref}</span>)}</div> : <p className="mt-2 text-xs text-slate-600">None</p>}</div>; }
function StatusPill({ label, value, good }: { label: string; value: string; good: boolean }) { return <div className="rounded-lg border border-[var(--border)] bg-slate-950/20 px-2.5 py-2"><p className="text-[9px] font-bold uppercase tracking-[.12em] text-slate-600">{label}</p><p className={`mt-1 text-[11px] ${good ? 'text-emerald-200' : 'text-amber-200'}`}>{statusLabel(value)}</p></div>; }
function RoadmapRow({ status, title, detail }: { status: ModuleStatus; title: string; detail: string }) { return <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-slate-950/20 p-3"><div className="mt-0.5"><StatusBadge status={status} /></div><div><p className="text-xs font-semibold text-slate-200">{title}</p><p className="mt-1 text-[11px] leading-5 text-slate-500">{detail}</p></div></div>; }
function RoadmapFeature({ status, icon: Icon, title, detail }: { status: ModuleStatus; icon: LucideIcon; title: string; detail: string }) { return <div className="rounded-[20px] border border-[var(--border)] bg-slate-900/35 p-5"><div className="flex items-start justify-between gap-3"><div className="rounded-xl bg-blue-300/10 p-2.5 text-blue-200"><Icon size={18} /></div><StatusBadge status={status} /></div><h3 className="mt-5 text-sm font-semibold text-slate-100">{title}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p></div>; }
function AudienceLine({ index, title, detail }: { index: string; title: string; detail: string }) { return <div className="flex gap-4 rounded-xl border border-[var(--border)] bg-slate-950/20 p-4"><span className="font-mono text-[10px] text-emerald-300">{index}</span><div><p className="text-sm font-semibold text-slate-200">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p></div></div>; }
function OutcomeCard({ title, detail }: { title: string; detail: string }) { return <div className="rounded-2xl border border-[var(--border)] bg-slate-950/20 p-4"><p className="text-sm font-semibold text-slate-200">{title}</p><p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p></div>; }
function SignalRow({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: 'green' | 'blue' | 'amber' }) { return <div className="flex items-center gap-4"><div className={`h-2 w-2 rounded-full ${tone === 'green' ? 'bg-emerald-300' : tone === 'blue' ? 'bg-blue-300' : 'bg-amber-300'}`} /><div className="min-w-0 flex-1"><p className="text-sm font-medium text-slate-200">{label}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div><p className="text-2xl font-semibold text-slate-100">{value}</p></div>; }
function EmptyState({ text }: { text: string }) { return <div className="flex min-h-[140px] items-center justify-center px-6 text-center text-sm text-slate-500">{text}</div>; }
