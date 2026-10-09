# Stage 5 completion audit — Teachly Monitor

> This audit describes the completed self-hostable V1. Production Prometheus storage, backup wiring and alert contacts remain external deployment gates; see [Current delivery status](./current-stage-status.md).

Audited on 2026-10-07 against the approved self-hostable observability scope.

| Area | Delivered evidence | Result |
| --- | --- | --- |
| Instrumentation | API RED metrics, PostgreSQL availability, release labels, bounded AI outcome/latency/token/abstention/cost metrics. | Complete V1 catalog. |
| Collection and storage | Pinned Prometheus 3.15.0 compose profile, 15-day/5-GB retention, persistent volume, health check and localhost-only UI. | Self-hostable profile. |
| Query boundary | Server-side adapter exposes 16 named queries only, five bounded ranges, timeout, series/point limits and label allowlist. | Arbitrary PromQL blocked. |
| Dashboard | Authenticated `/monitor` view with system, security/limits and AI groups, time range, refresh, stale/error/empty/not-configured states and responsive sparklines. | Complete read-only V1. |
| Access control | Basic credentials enforced at the Web proxy and API route; server-only metrics token protects the API; Prometheus location and credentials never reach the browser. | Fail closed. |
| Alerts | Recording rules and initial availability, 5xx, p95 latency and AI failure alerts; panel threshold states work without a custom notification scheduler. | Rules complete; contact routing deferred. |
| Privacy/cardinality | No learner/workspace/request/prompt/answer identifiers in labels; provider/model labels are normalized and bounded; query responses use an allowlist. | Passed review. |
| Verification | API typecheck/unit/integration, Web typecheck/build/unit, authenticated Playwright flow and generated OpenAPI contracts. | Passed. |

Local Docker execution was not available on the development host. CI validates Compose and runs `promtool check config`; production deployment still requires a private Prometheus service, persistent storage sizing and platform-specific backup wiring.
