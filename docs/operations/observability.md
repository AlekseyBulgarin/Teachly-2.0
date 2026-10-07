# Observability baseline

Teachly exposes a provider-neutral baseline that can be scraped by Prometheus and visualized in Grafana without making either product part of the domain architecture.

## Signals

- API logs are JSON in production and include the event name, request ID, HTTP method, normalized route template, status and duration. Request bodies, authorization headers, API keys and learner identifiers are never logged by the HTTP middleware.
- `GET /health/live` proves that the process accepts HTTP traffic.
- `GET /health/ready` proves that the process and PostgreSQL are available.
- `GET /metrics` returns Prometheus text exposition and requires `Authorization: Bearer $METRICS_TOKEN` in production.
- The uptime workflow checks the public showcase and API readiness every ten minutes.

The HTTP metrics use bounded labels only:

- `teachly_http_requests_total{method,route,status_code}`
- `teachly_http_request_duration_seconds{method,route,status_code}`
- `teachly_http_requests_in_flight{method}`
- `teachly_process_*` runtime metrics

`route` is the framework route template, not the raw URL, so IDs and query values cannot create unbounded Prometheus cardinality.

## Suggested dashboards and alerts

Start with RED panels: request rate, error ratio and duration percentiles. Useful PromQL examples:

```promql
sum(rate(teachly_http_requests_total[5m])) by (route)
```

```promql
sum(rate(teachly_http_requests_total{status_code=~"5.."}[5m]))
/
sum(rate(teachly_http_requests_total[5m]))
```

```promql
histogram_quantile(0.95, sum(rate(teachly_http_request_duration_seconds_bucket[5m])) by (le, route))
```

Initial alerts should cover readiness failure, error ratio above 5% for ten minutes and p95 latency above one second for ten minutes. Tune thresholds after a representative pilot load.

## Grafana Cloud / OpenTelemetry path

The current baseline intentionally avoids a required paid backend. A later deployment can scrape `/metrics` with an authenticated Prometheus collector and ship JSON logs to Grafana Cloud. Distributed traces and frontend RUM remain deferred until there is a real multi-service integration flow, a privacy/consent decision and Grafana credentials.

## Teachly Monitor

The internal `/monitor` route is the free, Teachly-branded read-only operating view. It is protected by HTTP Basic credentials (`TEACHLY_MONITOR_USER`, `TEACHLY_MONITOR_PASSWORD`) at the Web boundary and calls the API with the server-only `METRICS_TOKEN`. The browser never receives the Prometheus URL, Prometheus credentials, or the metrics token.

The API exposes `GET /internal/monitoring/overview?range=...` for five bounded ranges (`15m`, `1h`, `6h`, `24h`, `7d`). The adapter owns a fixed catalog of reviewed PromQL expressions, a 15-second timeout ceiling, 24-series-per-panel limit, 2,500-points-per-series limit, label allowlist, and sanitized partial-failure states. Arbitrary browser-supplied PromQL is not supported.

The first dashboards cover availability, request rate, 5xx ratio, p95 latency, requests in flight, process memory, AI request/failure rate, AI p95 latency, provider-reported tokens, abstentions, and estimated cost when the provider reports it. Metrics never label learner, workspace, API key, prompt, answer, request ID, raw error or SQL text.

The opt-in local profile is in `infra/observability`. Production should run Prometheus on a private network with persistent storage and authenticated scraping. Back up Prometheus configuration and rules; raw local TSDB blocks are operational data and should use a storage-level snapshot/backup process rather than ad-hoc file copying while Prometheus is running.
