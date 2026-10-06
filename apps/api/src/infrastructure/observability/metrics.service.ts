import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

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
