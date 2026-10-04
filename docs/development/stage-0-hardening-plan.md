# Stage 0: Showcase hardening and delivery baseline

## Outcome

Prepare the existing Teachly Showcase and API for continued product work without changing the approved modular-monolith architecture. The result must use the real demo backend through the same-origin web proxy, close the known public-demo isolation gaps, remove known critical dependency vulnerabilities, and leave a repeatable quality baseline.

This stage does not deploy, migrate production data, introduce new infrastructure, or expose credentials to the browser. Production changes remain a separate reviewed release step.

## Constraints

- Preserve all existing working-tree changes, including the API-key lifecycle work.
- Follow `reuse -> integrate -> extend -> build`.
- Keep PostgreSQL authoritative and all tenant, permission, scoring, and state rules on the API.
- Keep demo credentials server-only; never use `NEXT_PUBLIC_` for them.
- Do not add Redis, queues, microservices, or other speculative infrastructure.
- Use targeted tests first, then the complete repository quality gates.

## Work packages and acceptance criteria

### S0.1 Canonical workspace and secret boundary

- The VS Code checkout at `C:\Users\Администратор\Desktop\Teachly 2.0` is the canonical working copy for this stage.
- Local demo configuration targets the provided Railway API without committing any secret.
- The browser sees only `/api/teachly/*`; neither API keys nor authorization headers appear in browser-visible configuration.

### S0.2 Dependency security baseline

- Upgrade Next.js to the current security-fixed 16.x release supported by the project.
- Upgrade Drizzle ORM and its migration tooling to a compatible stable release that contains the published identifier-escaping fix.
- Re-run the production dependency audit against the canonical npm registry and record remaining transitive risk.
- Typecheck and build both applications after the upgrades.

### S0.3 API and proxy hardening

- Apply standard API security headers without breaking OpenAPI documentation.
- Add a bounded in-memory rate-limit baseline suitable for the current single-instance deployment; document that distributed limits require shared storage only when scaling justifies it.
- Add a server-side timeout to the Showcase proxy and return stable `503`/`504` error envelopes for unavailable or timed-out upstream requests.
- Bind each public-demo whiteboard to an integrity-protected HttpOnly cookie so knowing another board UUID is insufficient to read or modify it.
- Preserve the existing exact route allowlist and response minimization.

### S0.4 API-key lifecycle completion

- Preserve tenant/integration scoping and one-time secret return.
- Verify list, create, rotate, revoke, audit redaction, invalid payloads, and cross-tenant denial.
- Document `integrations:write` as an administrative scope because it can mint other allowed integration scopes.
- Expiring keys are deferred to a reviewed schema migration rather than hidden in application startup.

### S0.5 Quality gates

- API: lint, typecheck, build, unit, PostgreSQL integration, and PostgreSQL e2e suites.
- Web: typecheck and production build.
- Browser QA: required routes and interactions at 1440x900, 1280x800, 768x1024, and 390x844, including RU/EN, mobile drawer, whiteboard reload/isolation, real-backend/fallback states, console errors, and horizontal overflow.
- Final report lists changed files, commands run, assumptions, remaining risks, and any release-only steps.

## Delivery order

1. Record this plan and verify the dirty working tree.
2. Upgrade only the security-relevant dependencies and resolve compatibility issues.
3. Add API headers/rate limiting and tests.
4. Harden the same-origin proxy and whiteboard visitor binding.
5. Point the ignored local web environment at the real demo API and run protected smoke checks.
6. Run complete automated and browser quality gates.
7. Produce release notes; do not commit or deploy without an explicit request.

## Rollback and recovery

- Dependency and code changes remain reviewable as a focused Stage 0 branch diff.
- No database schema change is part of this stage, so rollback does not require a data migration.
- The local demo endpoint can be returned to the local API by changing ignored `apps/web/.env.local` only.
- Rate limiting is process-local and can be tuned or removed without changing persisted state.

## Execution status — 2026-10-04

Completed locally:

- security-fixed Next.js and Drizzle releases are installed and both applications build;
- standard API security headers and a process-local global throttle are active, with tighter AI and whiteboard-create limits and health-check exclusion;
- the Showcase proxy has a 15-second upstream deadline and stable timeout/unavailable responses;
- demo whiteboards require a signed HttpOnly browser binding for state reads and writes;
- API-key list/create/rotate/revoke behavior is covered by tenant, scope, audit-redaction, and one-time-secret e2e tests;
- the shell now verifies one protected read before reporting that demo data is connected;
- the production dependency audit has no critical, moderate, or low findings; one high transitive `braces` advisory remains because the registry reports no published patched version;
- API lint/typecheck/build, 20 unit tests, 44 PostgreSQL integration tests, 41 PostgreSQL e2e tests, Web typecheck/build, two Web unit tests, proxy security checks, and responsive browser QA pass.

Completed in production:

- Railway production is connected to the direct URL for the verified `Teachly Production` Neon project, `production` branch, and `teachly` database for explicit maintenance commands;
- a fresh production demo API key is synchronized between Railway and Vercel, while a separate Vercel-only session secret signs browser whiteboard bindings;
- the guarded, idempotent production demo seed completed and its `TEACHLY_DEMO_SEED_ENABLED` gate was returned to `false` immediately afterward;
- the seed upsert now restores the fixed demo key to active status and clears an earlier revocation, with a PostgreSQL regression test covering repeat seeding;
- the hardened API deployment completed successfully on Railway and the Showcase deployment is live at `https://teachly-tau.vercel.app`;
- external smoke checks pass for API health and security headers, direct API-key authentication, the Vercel health/tasks/learner proxy, signed whiteboard isolation, key Showcase routes, mobile navigation, responsive overflow, and browser console errors;
- the Showcase reports `Данные подключены` after its protected readiness check instead of Preview mode.

No production schema migration was required or performed in this stage.

## Confirmed follow-up direction

After the Stage 0 release baseline, Teachly will receive a unified metrics and analytics track. It will combine a simplified Prometheus/Grafana-inspired operational monitoring experience with tenant-safe product and learning analytics, while preserving PostgreSQL authority and the modular-monolith boundaries. The durable scope, guardrails, and incremental delivery principles are recorded in `docs/development/implementation-plan.md` under **Observability**.
