# Backend and module integration audit — 2026-10-10

## Scope

This audit covers the NestJS modular monolith, PostgreSQL transactions and migrations, tenant isolation, machine authentication and scopes, idempotency, generated OpenAPI contracts, AI authority boundaries, observability and the integration path across External Users, Assessment, Theory, Trainer, Learning, Learner Intelligence, Knowledge and Whiteboard.

The review follows the repository rules in `AGENTS.md`, the accepted ADRs and the official Drizzle transaction and migration workflows:

- https://orm.drizzle.team/docs/transactions
- https://orm.drizzle.team/docs/migrations
- https://neon.com/docs/introduction/branching

## Executed plan

1. Establish a clean baseline from current `main` and run static, contract, security, operational and PostgreSQL suites.
2. Trace module imports, controllers, guards, scopes, transaction boundaries and table access.
3. Fix confirmed correctness and integration defects with targeted regression tests.
4. Generate and review SQL through Drizzle; apply it to an expiring Neon test branch and inspect the schema diff.
5. Repeat all quality gates before release.

## Findings and corrections

| Severity | Finding | Correction |
| --- | --- | --- |
| P0 | Nested `DatabaseService.transaction()` calls opened an independent root transaction, so inner module work could survive an outer rollback. | Nested application transactions now join the active async transaction context. A PostgreSQL regression test proves outer rollback removes inner writes. |
| P1 | Trainer treated a reused idempotency key with a different request as a successful replay. Concurrent creates could race on the unique index. | Trainer persists a stable request fingerprint, rejects conflicting replays with `IDEMPOTENCY_CONFLICT`, and uses conflict-safe creation. |
| P1 | Concurrent External User upserts could race after creating duplicate learner profiles. The module also wrote the Users table directly. | The mapping row is reserved and locked first; learner creation goes through `UsersService` inside the shared transaction. Concurrent API tests prove one mapping and one learner. |
| P1 | Trainer read Assessment `results` and Whiteboard read Theory versions directly. Integration authentication read tenant tables directly. | Reads now use explicit `AttemptsService`, `TheoryService`, and `TenancyService` application interfaces. |
| P1 | Trainer transition endpoints documented `200` but returned Nest's default `201` for POST. | `/next` and `/complete` explicitly return `200`, matching the published OpenAPI contract. |
| P1 | Generated contract checks failed on Windows when only CRLF/LF differed. | OpenAPI and TypeScript contract checks compare normalized line endings while preserving real drift detection. |

## Module integration evidence

| Area | Verified behavior |
| --- | --- |
| Tenancy / Integrations | organization-workspace-integration ownership, active-state checks, hashed API keys, scopes, rotation/revocation and cross-tenant denial |
| External Users | tenant-scoped mapping, idempotent and concurrent upsert, no duplicate learner profile |
| Assessment / Variants | publication immutability, version lineage, external observations, deterministic evaluation and idempotency |
| Theory | draft/publish lifecycle, immutable published versions and workspace-scoped reads |
| Trainer | task selection, result evaluation, Theory handoff, Learning evidence, deterministic teacher signal and idempotent sessions |
| Learning / Learner Intelligence | append-oriented facts, deterministic evidence/state, bounded date ranges, cursor validation and tenant-scoped reporting |
| Knowledge / AI | approved licensed context only, provider boundary, validated output, usage trace and no AI writes to grading or learning authority |
| Whiteboard | tenant isolation, optimistic revisions, payload bounds and published resource validation through owning modules |
| Contracts / Consumer | generated OpenAPI and typed client remain synchronized; reference consumer preflight and workflow pass |
| Operations | structured error/request IDs, metrics, security headers, rate limits, dependency audit and readiness artifacts pass |

## Migration review

Migration `0022_funny_firebrand.sql` adds one nullable `trainer_sessions.request_fingerprint` column. It is additive and compatible with the currently deployed API; legacy rows remain readable and newly created sessions receive a fingerprint.

The migration was applied to the expiring Neon branch `preview/backend-integration-audit` in the dedicated `teachly-test` project. The parent-to-preview schema diff contains only the expected column.

## Remaining non-blocking constraints

- Some established `/v1` collection endpoints return bounded arrays rather than cursor envelopes. Changing those response shapes inside `/v1` would violate the compatibility policy; migrate them through additive endpoints or the next major API version based on pilot evidence.
- The rate limiter is intentionally instance-local. A shared limiter is required before horizontal API scaling.
- Production human authentication remains separate from the machine integration API; development authentication stays disabled in production.
- Production Prometheus retention and alert routing still require named operational owners and an approved storage budget.

These constraints do not invalidate the current single-instance B2B pilot path, but they are release gates for broader multi-instance or human-admin product scope.
