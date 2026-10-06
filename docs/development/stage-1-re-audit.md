# Stage 1 showcase re-audit

Checked against the agreed “ideal showcase” scope on 2026-10-05.

| Area | Current evidence | Status |
| --- | --- | --- |
| AI remediation demo | Grounded OpenAI provider, authorization, evidence retrieval, structured output, idempotency, traces, and e2e coverage exist in the API. The Showcase UI is still explanatory and production has no provider key. | Provider-ready; live demo blocked by credential and UI wiring. |
| Variants demo | Draft, edit, publish, resolution, tenancy, scopes, and e2e tests exist. The Showcase uses the generic module story and still labels the demo “Coming next”. | Backend live; interactive Showcase demo missing. |
| Analytics demo | Deterministic learner profile/progress/skills/activity APIs and live progress/teacher views exist. `/analytics` is explicitly labelled Preview and contains no fabricated production metrics. | Honest preview; dedicated live analytics view missing. |
| Integration and API-key lifecycle | Create/list/rotate/revoke, one-time secret return, hashing, scopes, audit events, and tests exist. The public Showcase explains the process but does not expose administrative key actions. | Backend live; public page intentionally non-administrative. |
| SEO, locale, accessibility | Base metadata and responsive/semantic checks exist. Per-route metadata, sitemap/robots, persistent locale, and deeper keyboard/screen-reader audits remain. | Partial. |
| Playwright smoke/visual | Responsive smoke and interaction coverage exists at 1440, 1280, 768, and 390 widths. Failure screenshots/traces exist; committed visual-regression baselines do not. | Smoke complete; visual regression missing. |

Stage 1 is visually deployable and its labels are honest, but it is not yet the full “ideal showcase”. Stage 2 may proceed independently because the integration contract work does not require presenting unfinished demos as live.
