# Current delivery status

Canonical status as of 2026-10-09. Historical audit files remain evidence of what was true when they were written; this document records the current code, last verified production state and the gates that still require external input.

## Stage summary

| Stage | Current code | Last verified production / operational state | Remaining gate |
| --- | --- | --- | --- |
| 0 — hardening | Complete: guarded demo seed, environment validation, secure proxy boundary and production smoke workflow. | API health and Showcase routes are available; security-header smoke passes. | None for the baseline. |
| 1 — ideal Showcase | Complete in `codex/showcase-completion`: real Variants, Analytics, Learning, Knowledge and AI views; integration proof; locale persistence; unique metadata; functional and 64-page/viewport visual coverage. | The previous production release serves the earlier Showcase baseline. | Merge and production verification of this release candidate. |
| 2 — universal integration | Complete baseline: generated OpenAPI contracts/client, `/v1` compatibility policy, pagination/idempotency/error/quota/scope rules, quickstart and typed example consumer. | The production API exposes OpenAPI and the protected pilot endpoints. | Webhooks, public SDK and embed remain deferred until a real pilot proves their contracts. |
| 3 — production readiness | Complete baseline: API/Web/contracts/migration/security CI, preview database workflow, structured logs/metrics/uptime checks, CSP/headers, dependency audit, restore/rollback rehearsal and Lighthouse gates. | Main CI, CodeQL and uptime workflows were green at the start of this release. | Production capacity evidence must be collected for a named pilot; it is not inferred from synthetic smoke. |
| 4 — AI and product polish | Complete provider boundary and grounded remediation path. Configured, unconfigured and successful response UI states are tested. | Live through the OpenAI-compatible boundary using OpenRouter and `nvidia/nemotron-3-super-120b-a12b:free`. A public remediation smoke succeeded with server-validated evidence and knowledge references. | Treat the free-tier model as a demo dependency with bounded availability; select a paid production model and budget before a customer pilot. |
| 5 — Teachly Monitor | Complete self-hostable V1: bounded RED/AI metrics, named queries, authenticated dashboard, Prometheus config and alert rules. | Code and CI validation exist; a private persistent Prometheus service has not been proven in production. | Approve storage/backup budget and alert contact routing before deploying the monitoring backend. |
| 6 — reference pilot | Complete typed reference consumer with scope preflight, idempotent Trainer/Learner Intelligence flow and mock contract coverage. | No real customer integration is claimed. | Select a pilot customer and validate actual SSO/webhook/embed requirements before expanding the public surface. |
| 7 — operational readiness | Complete operational artifacts: pilot SLO objectives, incident flow, rollout/no-go criteria, capacity smoke and acceptance checklist. | Evidence templates and checks exist. | Name customer and operational owners; approve legal/privacy/content terms; collect production launch evidence. |

## Capability truth

- The public Showcase has 16 canonical routes. All are smoke-tested at 1440×900, 1280×800, 768×1024 and 390×844.
- Concept Loom is an interactive `DEMO`, not a production backend module. Its state is local to the page and it does not call AI.
- AI is a supporting subsystem. It generates grounded assistance but does not own grading, learning state or permissions.
- Teacher and leadership views expose deterministic learning facts. Future recommendations remain visibly labelled as future scope.
- Lead collection remains in explicit email/Telegram channels until consent, retention, access and deletion ownership for stored lead PII are approved.

## Explicitly deferred

- microservices, Kafka, Kubernetes, event sourcing, vector databases and speculative ML infrastructure;
- a public webhook surface, separately versioned SDK and embeddable packages before a real integration proves the need;
- production Prometheus and Alertmanager routing without named owners and a storage/backup decision;
- billing, contractual SLA claims and customer-result metrics without corresponding product and commercial decisions.

## Release evidence required

The release that changes this status from candidate to production must provide:

1. a green pull request and main-branch CI result;
2. Vercel production deployment of the merged commit;
3. 200 responses for every canonical Showcase route, `/robots.txt` and `/sitemap.xml`;
4. unique production title/description/canonical evidence for every Showcase route;
5. API health, Learning, Knowledge and one real AI remediation smoke;
6. confirmation that no server credential is present in browser output or `NEXT_PUBLIC_*` variables.
