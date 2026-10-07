# Local Teachly observability profile

This opt-in profile runs Prometheus 3.15.0 on `127.0.0.1:9090`, scrapes a locally running Teachly API on port 3001, evaluates the reviewed Teachly recording/alert rules, and retains at most 15 days or 5 GB of samples.

```powershell
docker compose -f infra/observability/compose.yaml up -d
$env:PROMETHEUS_URL='http://127.0.0.1:9090'
$env:TEACHLY_MONITOR_USER='operator'
$env:TEACHLY_MONITOR_PASSWORD='<strong unique password>'
$env:METRICS_TOKEN='<same server-only token used by the API>'
corepack pnpm dev
```

Open `http://localhost:3000/monitor` and enter the Basic credentials. The Prometheus UI is bound to localhost for diagnostics only; never expose it directly to the public internet.

The local scrape intentionally omits a bearer token because the development API accepts `/metrics` without one when `METRICS_TOKEN` is unset. For any shared or production environment, require `METRICS_TOKEN`, keep Prometheus on a private network, use a secret file or platform secret for scrape authorization, and set the Web server's `METRICS_TOKEN` to the same value.

Prometheus owns collection and time-series storage. Teachly Monitor exposes only named, bounded queries and never forwards arbitrary PromQL from the browser.
