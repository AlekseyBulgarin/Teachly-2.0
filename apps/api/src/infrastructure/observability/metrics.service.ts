import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';
import type { AiProviderUsage } from '../../modules/ai/ai.types';

export type HttpMetricLabels = {
  method: string;
  route: string;
  statusCode: string;
};

@Injectable()
export class MetricsService implements OnModuleDestroy {
  readonly registry = new Registry();
  private readonly requests: Counter<'method' | 'route' | 'status_code'>;
  private readonly duration: Histogram<'method' | 'route' | 'status_code'>;
  private readonly inFlight: Gauge<'method'>;
  private readonly serviceInfo: Gauge;
  private readonly aiRequests: Counter<'status' | 'provider' | 'model_family'>;
  private readonly aiDuration: Histogram<'status' | 'provider' | 'model_family'>;
  private readonly aiTokens: Counter<'provider' | 'model_family' | 'direction'>;
  private readonly aiCost: Counter<'provider' | 'model_family'>;
  private readonly aiAbstentions: Counter<'provider' | 'model_family'>;
  private readonly databaseAvailable: Gauge;

  constructor() {
    this.registry.setDefaultLabels({
      service_name: 'teachly-api',
      service_version: process.env.SERVICE_VERSION ?? 'development',
      deployment_environment: process.env.DEPLOYMENT_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
    });
    this.requests = new Counter({
      name: 'teachly_http_requests_total',
      help: 'Total completed HTTP requests.',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });
    this.duration = new Histogram({
      name: 'teachly_http_request_duration_seconds',
      help: 'HTTP request duration in seconds.',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      registers: [this.registry],
    });
    this.inFlight = new Gauge({
      name: 'teachly_http_requests_in_flight',
      help: 'HTTP requests currently being handled.',
      labelNames: ['method'],
      registers: [this.registry],
    });
    this.serviceInfo = new Gauge({
      name: 'teachly_service_info',
      help: 'Static service release information.',
      registers: [this.registry],
    });
    this.serviceInfo.set(1);
    this.aiRequests = new Counter({
      name: 'teachly_ai_requests_total',
      help: 'Total AI runtime requests by bounded outcome and configured provider family.',
      labelNames: ['status', 'provider', 'model_family'],
      registers: [this.registry],
    });
    this.aiDuration = new Histogram({
      name: 'teachly_ai_request_duration_seconds',
      help: 'AI runtime request duration in seconds.',
      labelNames: ['status', 'provider', 'model_family'],
      buckets: [0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60],
      registers: [this.registry],
    });
    this.aiTokens = new Counter({
      name: 'teachly_ai_tokens_total',
      help: 'Provider-reported AI token usage.',
      labelNames: ['provider', 'model_family', 'direction'],
      registers: [this.registry],
    });
    this.aiCost = new Counter({
      name: 'teachly_ai_estimated_cost_micros_total',
      help: 'Estimated AI cost in micros when supplied by the provider adapter.',
      labelNames: ['provider', 'model_family'],
      registers: [this.registry],
    });
    this.aiAbstentions = new Counter({
      name: 'teachly_ai_abstentions_total',
      help: 'Total validated AI responses that abstained.',
      labelNames: ['provider', 'model_family'],
      registers: [this.registry],
    });
    this.databaseAvailable = new Gauge({
      name: 'teachly_database_available',
      help: 'Whether the API can reach its PostgreSQL source of truth.',
      registers: [this.registry],
    });
    collectDefaultMetrics({ prefix: 'teachly_process_', register: this.registry });
  }

  startRequest(method: string): () => void {
    this.inFlight.inc({ method });
    return () => {
      this.inFlight.dec({ method });
    };
  }

  observeRequest(labels: HttpMetricLabels, durationSeconds: number): void {
    const prometheusLabels = {
      method: labels.method,
      route: labels.route,
      status_code: labels.statusCode,
    };
    this.requests.inc(prometheusLabels);
    this.duration.observe(prometheusLabels, durationSeconds);
  }

  observeAiRequest(input: {
    status: 'succeeded' | 'failed' | 'timeout' | 'invalid_output' | 'replayed';
    provider: string;
    model: string | null;
    durationSeconds: number;
    usage?: AiProviderUsage | null;
    abstained?: boolean;
  }): void {
    const providerLabels = {
      provider: boundedMetricLabel(input.provider),
      model_family: boundedMetricLabel(input.model ?? 'unknown'),
    };
    const requestLabels = { ...providerLabels, status: input.status };
    this.aiRequests.inc(requestLabels);
    this.aiDuration.observe(requestLabels, Math.max(0, input.durationSeconds));
    if (input.usage?.inputTokens) this.aiTokens.inc({ ...providerLabels, direction: 'input' }, input.usage.inputTokens);
    if (input.usage?.outputTokens) this.aiTokens.inc({ ...providerLabels, direction: 'output' }, input.usage.outputTokens);
    if (input.usage?.estimatedCostMicros) this.aiCost.inc(providerLabels, input.usage.estimatedCostMicros);
    if (input.abstained) this.aiAbstentions.inc(providerLabels);
  }

  setDatabaseAvailable(available: boolean): void {
    this.databaseAvailable.set(available ? 1 : 0);
  }

  async exposition(): Promise<string> {
    return this.registry.metrics();
  }

  get contentType(): string {
    return this.registry.contentType;
  }

  onModuleDestroy(): void {
    this.registry.clear();
  }
}

function boundedMetricLabel(value: string): string {
  const normalized = value.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').slice(0, 48);
  return normalized || 'unknown';
}
