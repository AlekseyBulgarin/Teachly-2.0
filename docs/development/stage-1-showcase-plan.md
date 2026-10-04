# Stage 1: Showcase completeness and reusable integration boundary

## Outcome

Turn the hardened Teachly Showcase into a coherent, production-backed product demonstration for owners and leaders of educational products. The Showcase must explain what Teachly is, why it is useful, prove the implemented capabilities with live flows, collect a qualified contact, and support a follow-up pilot integration.

The initial pilot offer is a validation engagement rather than a profit-optimised plan: its price may cover infrastructure and direct operating costs while Teachly proves the integration and product value. Exact public pricing is outside this stage and must not be invented in product copy.

Stage 1 also establishes reusable API contracts and the metrics boundary required by the later Teachly Observability stage. It does not attempt to build a Grafana replacement inside the Showcase milestone.

## Approved product decisions — 2026-10-04

- Primary audience: owner, director, or product lead of an educational business.
- Primary journey: understand Teachly -> see a working capability -> understand the integration model -> leave a contact for a pilot conversation.
- Secondary audience: the technical integrator evaluating API boundaries and operational safety.
- The Showcase remains a B2B product demonstration, not a second LMS or a customer administration console.
- `LIVE` means a production-backed flow exercised by an automated or browser smoke check.
- `COMING NEXT` means the domain/API foundation exists but the end-to-end Showcase flow is incomplete or an external credential is unavailable.
- `PLANNED` means the capability is represented honestly but is not implemented end to end.
- External consumers integrate server to server. API keys, tenant resolution, permissions, evaluation, and learning state remain server-owned.
- RU and EN remain equal product surfaces.
- Product/learning analytics are tenant-safe and may be shown to the educational customer. Infrastructure metrics are internal-only.
- The teacher surface includes learner progress, topic gaps, needs-practice signals, completion/performance trends, and evidence-backed next areas of attention.
- AI infrastructure may be completed without a provider key. Live provider-backed output remains `COMING NEXT` until a new key is configured and verified.
- A free/self-hostable Grafana-inspired system is a separate approved stage. Stage 1 defines compatible metrics and correlation contracts without deploying speculative monitoring infrastructure.

## Current capability truth — Stage 1 entry

| Capability | Backend foundation | Showcase today | Stage 1 target |
| --- | --- | --- | --- |
| Task bank | Implemented | Interactive `LIVE` demo | Keep live; align with typed contracts |
| Theory | Implemented | Interactive `LIVE` demo | Keep live; align with typed contracts |
| Trainer | Implemented | Interactive `LIVE` demo | Complete retry/reset/error UX and contract tests |
| Learner profile | Implemented | Interactive `LIVE` read model | Keep live; add evidence/source clarity |
| Progress | Implemented | Interactive `LIVE` read model | Keep live; add evidence/source clarity |
| Whiteboard | Implemented | Isolated persistent `LIVE` demo | Complete recovery/session UX and browser tests |
| Variants | Implemented API | `PLANNED` static page | Add a safe production-backed read-only demo |
| Educational AI | Remediation and trace APIs exist | Page says `LIVE`, response block says `COMING NEXT` | Complete the provider-neutral flow and honest no-key fallback; activate live generation only after key rotation |
| Knowledge governance | Implemented status API | Mostly narrative | Show sanitized live provenance/approval evidence |
| Integration | API-key and external-user foundations exist | Narrative only | Add a live, sanitized integration proof and reusable server-to-server example |
| Teacher intelligence | Learning evidence exists | Preview | Add deterministic learner/topic attention analytics and evidence; keep AI recommendations preview-only |
| Analytics | Learning facts exist | `PLANNED` static page | Add tenant-safe learning and leadership read models; advanced dashboard building remains later |

## Stage 1 preflight audit — 2026-10-04

The audit was intentionally limited to the files and boundaries needed for Stage 1.

### Reusable foundation

- `apps/api/src/main.ts` already produces a Nest OpenAPI document, and the relevant controllers use DTOs plus explicit Swagger response metadata.
- The existing assessment, AI, knowledge, integration, external-user, and learner-intelligence modules already own the APIs needed for the planned Showcase slices.
- API-key guards and granular scopes already protect those APIs. Stage 1 must reuse those guards rather than add a Showcase-only authorization model.
- Request IDs, structured error envelopes, audit records, and AI-request traces already provide the correlation foundation needed by the first observability slice.
- PostgreSQL-backed integration/e2e tests already cover variants, knowledge, remediation, API-key lifecycle, external users, learner intelligence, and tenant isolation.

### Gaps to close

1. **Contract authority is split.** `packages/contracts` contains only package metadata, while `apps/web/lib/api.ts` duplicates API response types by hand. Export a deterministic OpenAPI artifact and generate runtime-free TypeScript types into `@teachly/contracts`; add a clean-diff contract check.
2. **Capability truth is duplicated.** Navigation, overview, generic capability pages, and individual pages define statuses independently in `app-shell.tsx`, `overview.tsx`, `capabilities.tsx`, and module components. This has already produced contradictory status labels. A typed registry is the first runtime change.
3. **The shared Showcase context is stale.** `ecosystem-context.tsx` still exposes learners, attempts, integration, knowledge, AI traces, and remediation state, but its reload path currently verifies only health and published tasks. Pages depending on the old arrays can render empty data while claiming `LIVE`. Replace the legacy aggregate context incrementally with bounded feature hooks/read models.
4. **The proxy boundary is intentionally narrower than the backend.** `apps/web/app/api/teachly/[...path]/route.ts` currently allows only hardened Stage 0 routes. Variants, knowledge, integration proof, AI remediation, and analytics require explicit route-by-route allowlisting, response minimization, server-owned identifiers, timeout behaviour, and negative tests.
5. **Analytics is not yet a backend capability.** The current analytics page is a static preview and there is no tenant-safe analytics endpoint. Product analytics must be a server-owned read model built through module interfaces or a reviewed projection; the web client must not aggregate authoritative facts itself.
6. **Operational metrics are not instrumented yet.** Request correlation and error logging exist, but there is no bounded Prometheus/OpenTelemetry metric catalog or protected exposition/export boundary. User, workspace, request, prompt, and other unbounded identifiers must never become metric labels.
7. **Web verification is too narrow for the expanded surface.** The web package has a whiteboard-session unit test but no proxy contract tests or browser regression suite covering the Stage 1 module states. Each new live slice needs targeted route/sanitization tests plus Playwright visual and interaction QA.

## Work packages and acceptance criteria

### S1.1 Capability registry and product truth

- Introduce one typed capability registry for route, navigation group, localized name, product status, demo status, dependencies, and next step.
- Drive navigation, overview cards, page badges, and the production smoke route list from that registry where practical.
- Remove contradictory status labels and duplicated route/status definitions.
- Every module answers: what it is, business value, learner/teacher value, ecosystem relationship, and current availability.
- The main CTA asks the decision maker to discuss a pilot and captures a contact without inventing pricing or customer results.

### S1.2 Typed integration boundary

- Keep Nest DTOs and the generated OpenAPI document as the API contract source.
- Generate a deterministic checked-in OpenAPI schema and runtime-free TypeScript types for `@teachly/contracts` using `openapi-typescript` or an equivalently reviewed generator.
- Replace manually duplicated Showcase response types incrementally, starting with live demo endpoints.
- Preserve the same-origin Web proxy, exact route allowlist, response minimization, server-owned learner identity, request deadlines, and secret boundary.
- Document stable error envelopes, authentication, scopes, idempotency, rate limits, and API versioning for a server-to-server adopter.
- Add a small reference integration example; do not build a broad SDK or webhook platform in this stage.

### S1.3 Complete existing live module flows

- Keep tasks, theory, trainer, learner profile, progress, and whiteboard production-backed and resilient.
- Add the Variants read-only demonstration from the existing assessment API.
- Complete one bounded AI remediation interaction with a provider-neutral unavailable state. No live-provider claim is allowed before a fresh key is configured.
- Show sanitized knowledge-approval and integration evidence without tenant-sensitive identifiers.
- Give every live module explicit loading, empty, unavailable, retry, and success states.

### S1.4 Teacher and leadership analytics

- Define a versioned catalog for learning/product events: owner, meaning, unit, allowed dimensions, retention class, and sensitivity.
- Add tenant-safe analytics read models for activity, completion/outcome trend, needs-practice signals, curriculum/topic gaps, mapping coverage, and module adoption where authoritative facts exist.
- Add a teacher view that can answer: which learners need attention, which topics lag, what evidence supports the signal, how performance changes, and what learning work remains.
- Add a leadership view that summarises educational engagement and capability adoption without exposing infrastructure data or inventing business outcomes.
- Keep all signals deterministic and evidence-backed. AI recommendations remain non-authoritative and unavailable without a provider key.
- Keep PostgreSQL authoritative for learning facts and low-volume projections.

### S1.5 Operational observability contract

- Define bounded request count, status class, route template, latency histogram, database availability, rate-limit rejection, AI provider latency/error/token usage, and release identity metrics.
- Preserve correlation IDs across request logs, audit records, AI calls, and metric exemplars where supported.
- Expose metrics only through a protected operational boundary suitable for Prometheus scraping; never expose infrastructure metrics through the public Showcase proxy.
- Use standard metric names/base units and vendor-neutral OpenTelemetry resource attributes (`service.name`, `service.namespace`, `deployment.environment`, `service.version`).
- Produce the first curated dashboard and alert specification for the separate Teachly Observability stage.

### S1.6 B2B experience and release quality

- Present a clear path from business problem to module, live proof, integration model, and pilot contact action.
- Keep the premium dark B2B system, readable Cyrillic typography, restrained accents, generous spacing, and accessible mobile drawer.
- Preserve RU/EN parity and avoid engineering jargon on primary pages.
- Verify all live routes at desktop, tablet, and mobile widths, including keyboard navigation, focus, overflow, empty/error fallback, cookies, reload, and browser console.

## Delivery order

1. Convert the capability matrix into the typed registry and make all visible statuses truthful.
2. Establish the deterministic OpenAPI generation/check workflow and generated contract package.
3. Move existing live demo endpoints onto the verified contract boundary without changing behaviour.
4. Complete Variants, Knowledge, Integration, and provider-neutral AI flows in small vertical slices.
5. Add the teacher and leadership analytics read models through explicit module interfaces or reviewed projections.
6. Add the operational metric catalog and protected Prometheus-compatible instrumentation boundary.
7. Add the pilot contact journey and polish the B2B narrative.
8. Run complete automated/browser gates and prepare a separately approved release.
9. Continue with the separately documented Teachly Observability stage.

## Explicit exclusions

- no learner/teacher login product, billing, SSO, broad public SDK, webhooks, or embeddable platform in Stage 1;
- no autonomous agents or AI authority over grading, permissions, analytics facts, or learning state;
- no provider-backed AI claim until a fresh provider credential is configured and tested;
- no Grafana clone, arbitrary query language, dedicated time-series database, Redis, queues, or microservices inside Stage 1;
- no invented ROI, customer results, pricing, or analytics values;
- no production schema migration without a reviewed migration plan and explicit release authorization.

## Quality gates

- targeted unit/domain/API/PostgreSQL tests for each vertical slice;
- API lint, typecheck, build, unit, integration, and e2e suites;
- Web unit, typecheck, and production build;
- contract generation/check with a clean diff;
- dependency and secret scans;
- production-like browser QA and an explicit release smoke checklist.

## Execution status — 2026-10-04

- Stage 0 release commit `9687c97` is the worktree base.
- Dedicated worktree and branch `codex/stage-1-showcase` created from the completed Stage 0 state.
- Repository capability-gap audit completed and approved.
- Audience, CTA, teacher analytics, metric visibility, AI no-key behaviour, and separate observability stage approved.
- Official Nest OpenAPI, OpenAPI TypeScript, Prometheus, Grafana, and OpenTelemetry guidance reviewed for the relevant boundaries.
- S1.1 registry slice implemented: one typed capability registry now drives navigation, overview/generic status labels, next-step routes, and the truthful live-route set.
- The dedicated `/teacher` surface is enabled instead of redirecting to the learner profile; unfinished teacher analytics remain explicitly `COMING NEXT`.
- Browser regression coverage now exercises the primary Showcase routes at 1440, 1280, 768, and 390 pixel widths against a production build. Hydration-sensitive controls remain disabled until their handlers are ready.
- S1.2 contract foundation implemented: Nest owns one reusable OpenAPI document builder; deterministic checked-in JSON and runtime-free TypeScript types are generated into `@teachly/contracts`; `pnpm contracts:check` fails when either artifact is stale.
- The `/health` response is the first web contract migrated from a hand-written interface to the generated contract package. Remaining live response types will move incrementally as their Swagger DTO precision is verified.
- No database schema, production configuration, production data, commit, push, or deployment has been changed in Stage 1 yet.
