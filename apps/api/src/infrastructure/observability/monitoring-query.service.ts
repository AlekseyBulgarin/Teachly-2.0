import { Injectable } from '@nestjs/common';
import type { MonitoringOverviewDto, MonitoringPanelDto, MonitoringSeriesDto } from './monitoring.dto';

export const MONITORING_RANGES = ['15m', '1h', '6h', '24h', '7d'] as const;
export type MonitoringRange = typeof MONITORING_RANGES[number];

type PanelDefinition = {
  id: string;
  title: string;
  description: string;
  kind: 'stat' | 'timeseries';
  unit: MonitoringPanelDto['unit'];
  query: string;
  warning?: number;
  critical?: number;
  lowerIsWorse?: boolean;
};

const RANGE_CONFIG: Record<MonitoringRange, { seconds: number; step: number }> = {
  '15m': { seconds: 900, step: 15 },
  '1h': { seconds: 3_600, step: 30 },
  '6h': { seconds: 21_600, step: 60 },
  '24h': { seconds: 86_400, step: 300 },
  '7d': { seconds: 604_800, step: 1_800 },
};

export const MONITORING_PANELS: readonly PanelDefinition[] = [
  { id: 'availability', title: 'API availability', description: 'Prometheus scrape availability for the Teachly API.', kind: 'stat', unit: 'ratio', query: 'avg(up{job="teachly-api"})', warning: 0.995, critical: 0.98, lowerIsWorse: true },
  { id: 'request-rate', title: 'Request rate', description: 'Completed API requests per second.', kind: 'timeseries', unit: 'requests_per_second', query: 'sum(rate(teachly_http_requests_total[5m]))' },
  { id: 'error-ratio', title: '5xx error ratio', description: 'Share of completed requests returning a server error.', kind: 'timeseries', unit: 'ratio', query: 'sum(rate(teachly_http_requests_total{status_code=~"5.."}[5m])) / clamp_min(sum(rate(teachly_http_requests_total[5m])), 0.001)', warning: 0.02, critical: 0.05 },
  { id: 'p95-latency', title: 'API p95 latency', description: '95th percentile of request duration.', kind: 'timeseries', unit: 'seconds', query: 'histogram_quantile(0.95, sum(rate(teachly_http_request_duration_seconds_bucket[5m])) by (le))', warning: 0.5, critical: 1 },
  { id: 'in-flight', title: 'Requests in flight', description: 'Requests currently handled by the API process.', kind: 'stat', unit: 'count', query: 'sum(teachly_http_requests_in_flight)' },
  { id: 'memory', title: 'Resident memory', description: 'Resident memory used by the API process.', kind: 'timeseries', unit: 'bytes', query: 'sum(teachly_process_resident_memory_bytes)' },
  { id: 'database', title: 'Database availability', description: 'Latest PostgreSQL connectivity result observed during metrics scraping.', kind: 'stat', unit: 'ratio', query: 'min(teachly_database_available)', warning: 1, critical: 0.5, lowerIsWorse: true },
  { id: 'release', title: 'Active release', description: 'Service version and deployment environment labels for the active API release.', kind: 'stat', unit: 'count', query: 'max by (service_version, deployment_environment) (teachly_service_info)' },
  { id: 'auth-failures', title: 'Auth rejection rate', description: 'Unauthorized and forbidden responses per second.', kind: 'timeseries', unit: 'requests_per_second', query: 'sum(rate(teachly_http_requests_total{status_code=~"401|403"}[5m]))', warning: 1, critical: 5 },
  { id: 'rate-limits', title: 'Rate-limit rejection rate', description: 'HTTP 429 responses per second.', kind: 'timeseries', unit: 'requests_per_second', query: 'sum(rate(teachly_http_requests_total{status_code="429"}[5m]))', warning: 0.25, critical: 1 },
  { id: 'ai-rate', title: 'AI request rate', description: 'AI runtime requests per second, including safe failures.', kind: 'timeseries', unit: 'requests_per_second', query: 'sum(rate(teachly_ai_requests_total[5m]))' },
  { id: 'ai-failure-ratio', title: 'AI failure ratio', description: 'Failed, timed out, or invalid AI responses.', kind: 'timeseries', unit: 'ratio', query: 'sum(rate(teachly_ai_requests_total{status=~"failed|timeout|invalid_output"}[5m])) / clamp_min(sum(rate(teachly_ai_requests_total[5m])), 0.001)', warning: 0.05, critical: 0.15 },
  { id: 'ai-p95-latency', title: 'AI p95 latency', description: '95th percentile of provider-backed AI request duration.', kind: 'timeseries', unit: 'seconds', query: 'histogram_quantile(0.95, sum(rate(teachly_ai_request_duration_seconds_bucket[5m])) by (le))', warning: 5, critical: 10 },
  { id: 'ai-token-rate', title: 'AI token rate', description: 'Provider-reported input and output tokens per second.', kind: 'timeseries', unit: 'tokens_per_second', query: 'sum(rate(teachly_ai_tokens_total[5m])) by (direction)' },
  { id: 'ai-cost-rate', title: 'AI estimated cost rate', description: 'Estimated provider cost in micros per second when available.', kind: 'timeseries', unit: 'micros_per_second', query: 'sum(rate(teachly_ai_estimated_cost_micros_total[5m]))' },
  { id: 'ai-abstention-rate', title: 'AI abstention rate', description: 'Validated grounded responses that deliberately abstained per second.', kind: 'timeseries', unit: 'requests_per_second', query: 'sum(rate(teachly_ai_abstentions_total[5m]))' },
];

@Injectable()
export class MonitoringQueryService {
  async overview(range: MonitoringRange): Promise<MonitoringOverviewDto> {
    const configuredUrl = process.env.PROMETHEUS_URL?.trim();
    if (!configuredUrl) return this.notConfigured(range);
    const end = Math.floor(Date.now() / 1000);
    const { seconds, step } = RANGE_CONFIG[range];
    const start = end - seconds;
    const panels = await Promise.all(MONITORING_PANELS.map((definition) => this.queryPanel(configuredUrl, definition, start, end, step)));
    const newestPoint = Math.max(0, ...panels.flatMap((panel) => panel.series.flatMap((series) => series.points.map((point) => point.timestamp))));
    return {
      source: 'prometheus', range, generatedAt: new Date().toISOString(),
      stale: newestPoint > 0 && end - newestPoint > Math.max(step * 3, 90), panels,
    };
  }

  private notConfigured(range: MonitoringRange): MonitoringOverviewDto {
    return {
      source: 'not_configured', range, generatedAt: new Date().toISOString(), stale: false,
      panels: MONITORING_PANELS.map((definition) => ({
        ...this.panelBase(definition), status: 'not_configured', alert: 'unknown',
        message: 'PROMETHEUS_URL is not configured', series: [],
      })),
    };
  }

  private async queryPanel(baseUrl: string, definition: PanelDefinition, start: number, end: number, step: number): Promise<MonitoringPanelDto> {
    try {
      const url = new URL('/api/v1/query_range', ensureTrailingSlash(baseUrl));
      url.searchParams.set('query', definition.query);
      url.searchParams.set('start', String(start));
      url.searchParams.set('end', String(end));
      url.searchParams.set('step', String(step));
      const headers = new Headers({ accept: 'application/json' });
      const token = process.env.PROMETHEUS_BEARER_TOKEN?.trim();
      if (token) headers.set('authorization', `Bearer ${token}`);
      const response = await fetch(url, { headers, signal: AbortSignal.timeout(this.timeoutMs()) });
      if (!response.ok) throw new Error(`Prometheus returned ${response.status}`);
      const payload = await response.json() as unknown;
      const series = parseMatrix(payload);
      const value = latestValue(series);
      return {
        ...this.panelBase(definition), status: series.length ? 'ok' : 'empty',
        alert: this.alertState(definition, value), message: series.length ? null : 'No samples in this range', series,
      };
    } catch {
      return {
        ...this.panelBase(definition), status: 'error', alert: 'unknown',
        message: 'The reviewed Prometheus query could not be completed', series: [],
      };
    }
  }

  private panelBase(definition: PanelDefinition) {
    return { id: definition.id, title: definition.title, description: definition.description, kind: definition.kind, unit: definition.unit };
  }

  private alertState(definition: PanelDefinition, value: number | null): MonitoringPanelDto['alert'] {
    if (value === null || definition.warning === undefined || definition.critical === undefined) return 'unknown';
    if (definition.lowerIsWorse) {
      if (value < definition.critical) return 'critical';
      if (value < definition.warning) return 'warning';
      return 'healthy';
    }
    if (value >= definition.critical) return 'critical';
    if (value >= definition.warning) return 'warning';
    return 'healthy';
  }

  private timeoutMs(): number {
    const value = Number(process.env.PROMETHEUS_TIMEOUT_MS ?? 5_000);
    return Number.isFinite(value) && value > 0 ? Math.min(value, 15_000) : 5_000;
  }
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`;
}

function latestValue(series: MonitoringSeriesDto[]): number | null {
  const values = series.flatMap((entry) => entry.points.slice(-1).map((point) => point.value));
  return values.length ? values.reduce((total, value) => total + value, 0) : null;
}

function parseMatrix(payload: unknown): MonitoringSeriesDto[] {
  if (!payload || typeof payload !== 'object') return [];
  const root = payload as { status?: unknown; data?: unknown };
  if (root.status !== 'success' || !root.data || typeof root.data !== 'object') return [];
  const result = (root.data as { result?: unknown }).result;
  if (!Array.isArray(result)) return [];
  return result.slice(0, 24).flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const candidate = entry as { metric?: unknown; values?: unknown };
    if (!Array.isArray(candidate.values)) return [];
    const labels = sanitizeLabels(candidate.metric);
    const points = candidate.values.slice(-2_500).flatMap((tuple) => {
      if (!Array.isArray(tuple) || tuple.length < 2) return [];
      const timestamp = Number(tuple[0]);
      const value = Number(tuple[1]);
      return Number.isFinite(timestamp) && Number.isFinite(value) ? [{ timestamp, value }] : [];
    });
    return points.length ? [{ labels, points }] : [];
  });
}

function sanitizeLabels(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const allowed = new Set(['method', 'route', 'status_code', 'direction', 'provider', 'model_family', 'service_version', 'deployment_environment']);
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key, item]) => allowed.has(key) && typeof item === 'string')
    .map(([key, item]) => [key, (item as string).slice(0, 96)]));
}
