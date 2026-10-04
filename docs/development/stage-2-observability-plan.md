# Stage 2: Teachly Observability

## Outcome

Build a free-software, self-hostable, Teachly-branded observability system inspired by the essential Grafana and Prometheus workflows. It must help the internal team understand service health, request rate, errors, latency, releases, database availability, rate limiting, and future AI usage without exposing infrastructure data to Showcase visitors or educational tenants.

This stage is intentionally separate from the Stage 1 Showcase. Stage 1 produces the instrumentation and contracts; Stage 2 adds collection, storage, query, dashboards, and alerting.

"Free" means no required commercial SaaS licence. Running the system still requires compute, storage, backups, and operational ownership. Production infrastructure cost cannot be guaranteed to be zero.

## Architecture decision

Do not reimplement a time-series database or PromQL. Reuse the open-source Prometheus data model, scrape protocol, storage engine, recording rules, and HTTP query API. Build an opinionated Teachly monitoring experience on top of those standards.

```text
Teachly API / Web
  -> protected Prometheus metrics endpoint and optional OTLP traces
  -> Prometheus OSS scraper + local TSDB
  -> recording and alert rules
  -> server-side Teachly Monitor query adapter
  -> internal-only dashboards
  -> optional Alertmanager notifications
```

Product and learning analytics remain separate:

```text
authoritative learning facts -> PostgreSQL tenant-safe read models -> Teacher/Leadership UI
operational telemetry        -> Prometheus-compatible metrics    -> Teachly Monitor UI
```

## Core principles learned from Prometheus and Grafana

- Pull numeric time series over HTTP; identify series by stable metric names plus bounded labels.
- Use counters for totals, gauges for current state, and histograms for latency/distributions.
- Keep label cardinality low. Never use learner IDs, workspace IDs, emails, request IDs, prompts, URLs with identifiers, or arbitrary error messages as metric labels.
- Use route templates and status classes rather than raw paths/status messages.
- Use base units in metric names, such as `_seconds`, `_bytes`, and `_total`.
- Treat the data source as independent from visualisation. The dashboard consumes a query API; it does not own telemetry storage.
- Curate dashboards around questions and user roles. A panel has a query, visualisation, thresholds, and explanation.
- Use shared variables for time range, environment, service, and release so one dashboard adapts without duplication.
- Separate alert evaluation from notification routing. Group related notifications and support mute/silence windows later.
- Preserve `service.name`, `service.namespace`, `deployment.environment`, and `service.version` to keep future OpenTelemetry/Grafana compatibility.

## Version 1 scope

### Collection and storage

- Prometheus-compatible `/internal/metrics` endpoint protected from public traffic.
- Prometheus OSS with explicit scrape configuration, retention limit, persistent volume, health check, and backup/recovery notes.
- No remote write, Loki, Tempo, Mimir, Pyroscope, Kubernetes, or distributed Prometheus in V1.
- Optional OTLP export remains a later adapter and must not be required for core monitoring.

### Curated dashboards

1. **System overview** — availability, request rate, error ratio, p50/p95/p99 latency, active release.
2. **API operations** — performance and failures by bounded route template and method.
3. **Database** — connectivity, pool saturation where available, query error count, coarse operation latency without SQL text or tenant identifiers.
4. **Security and limits** — authentication failures, forbidden responses, rate-limit rejections, suspicious error spikes.
5. **AI readiness** — request status, provider/model family from an allowlist, latency, input/output token totals, abstentions, and estimated cost only when reliable provider usage exists.
6. **Deployments** — service version and before/after error/latency comparison.

### Dashboard interaction

- fixed time ranges and a custom bounded range;
- environment, service, and release filters;
- stat, time-series, table, and status panels;
- loading, stale, partial-data, empty, and query-error states;
- shareable internal URLs containing safe filter variables;
- responsive read-only view first; dashboard editing is configuration-as-code in V1.

### Query boundary

- A server-side adapter calls Prometheus `/api/v1/query` and `/api/v1/query_range`.
- Browsers never receive the Prometheus URL or credentials.
- V1 exposes only named, reviewed queries. It does not provide arbitrary PromQL execution.
- Query parameters are allowlisted, bounded, and subject to timeout/series limits.
- Responses are normalised into typed panel data contracts.

### Alerts

- Start with reviewed rules for API unavailable, sustained error ratio, sustained p95 latency, database unavailable, and AI provider failure ratio.
- V1 may show firing/pending/resolved status before notification delivery is enabled.
- Notification delivery, grouping, silences, and contact points use Alertmanager when approved; do not build a custom scheduler or notification router first.

### Security

- Internal-only authentication and role checks are mandatory before production exposure.
- Prometheus and Alertmanager are not exposed directly to the public internet.
- Secrets remain server-side; no telemetry endpoint or datasource URL uses `NEXT_PUBLIC_*`.
- Metrics contain no personal data, prompts, answers, API keys, raw SQL, or tenant identifiers.
- Operational data has an explicit retention and deletion policy.

## Delivery packages

### O1. Metric catalog and instrumentation

- Finalise metric names, types, units, labels, owners, and sensitivity.
- Implement API RED metrics, database health, rate-limit, release, and AI-ready metrics.
- Add cardinality and endpoint security tests.

### O2. Local Prometheus profile

- Add an opt-in local/self-hosted deployment profile with pinned versions and persistent storage.
- Add scrape, recording-rule, and first alert-rule configuration.
- Document retention, disk sizing, backup, and recovery.

### O3. Teachly Monitor query adapter

- Add typed named queries and a protected server-side Prometheus client.
- Enforce timeouts, range/step limits, response-size bounds, and graceful partial failure.

### O4. Internal dashboard UI

- Build the six curated dashboards with shared filters and standard panel states.
- Keep the visual language aligned with Teachly while prioritising operational readability over marketing presentation.

### O5. Alert status and notification integration

- Surface alert state and evidence.
- Integrate Alertmanager contact points only after notification ownership is defined.

### O6. Production readiness

- Load/cardinality tests, failure injection, retention/disk checks, access-control review, backup/restore exercise, and deployment runbook.

## Deferred capabilities

- arbitrary user-authored PromQL;
- drag-and-drop dashboard builder;
- multiple arbitrary data sources and plugin marketplace;
- logs, distributed tracing, profiling, frontend session replay, service maps, and exemplars;
- anomaly detection or ML baselines;
- multi-cluster/high-availability Prometheus;
- customer-facing infrastructure dashboards.

These are considered only after the V1 system is used and a concrete need is measured.

## Stage boundary with AI

Stage 1 may implement provider-neutral AI request state, audit/tracing records, idempotency, approved-knowledge gates, timeouts, and no-key fallback. AI telemetry counters and histograms initialise without a provider key. Token, cost, provider, and model observations remain empty/zero until a real provider is configured; no fabricated samples are allowed.

## Research references

- Prometheus overview and architecture: <https://prometheus.io/docs/introduction/overview/>
- Prometheus instrumentation practices: <https://prometheus.io/docs/practices/instrumentation/>
- Prometheus metric and label naming: <https://prometheus.io/docs/practices/naming/>
- Prometheus HTTP query API: <https://prometheus.io/docs/prometheus/latest/querying/api/>
- Grafana dashboard construction: <https://grafana.com/docs/grafana/latest/visualizations/dashboards/build-dashboards/create-dashboard/>
- Grafana variables: <https://grafana.com/docs/grafana/latest/visualizations/dashboards/variables/>
- Grafana alerting fundamentals: <https://grafana.com/docs/grafana/latest/alerting/fundamentals/notifications/>
- OpenTelemetry semantic conventions: <https://opentelemetry.io/docs/specs/semconv/>

## Approval status — 2026-10-04

- Separate observability stage approved by the product owner.
- Self-hostable/free-software direction approved.
- Stage 1 instrumentation compatibility approved.
- Infrastructure deployment, retention, and authentication design remain subject to a focused pre-implementation review.
