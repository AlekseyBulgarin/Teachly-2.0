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
