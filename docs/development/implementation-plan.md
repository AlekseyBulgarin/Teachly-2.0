# Teachly Implementation Plan

## Status and Scope

This is a planning document for the first coding phase. It does not create application code, migrations, dependencies, infrastructure, or deployment configuration.

- **Source of truth:** Phase 0 and Phase 0.5 product, architecture, database, API, security, and ADR documents.
- **Confirmed:** teacher-first product, shared B2C/B2B platform, relationship-scoped guardian access, generic assessment/content model, controlled content ingestion, deterministic learning state, modular monolith, REST/OpenAPI, and PostgreSQL authority.
- **Proposed default:** a small pnpm TypeScript monorepo with `apps/web`, `apps/api`, and only the shared packages that have an immediate consumer.
- **Unresolved before coding:** authentication provider and first licensed content/task rollout.

## 1. Repository Assessment

The repository currently contains only the approved Markdown documentation under `docs/`. Git is initialized on `main` with no commits. There is no application source, package manager configuration, database schema, migration directory, test suite, CI configuration, or production configuration.

No historical implementation exists in the workspace. The implementation must start from the documented baseline rather than preserve an earlier architecture.

## 2. Repository Blueprint

### Recommended Initial Structure

```text
/
├── apps/
│   ├── web/                         # Next.js App Router application
│   └── api/                         # NestJS modular monolith
├── packages/
│   ├── api-client/                  # Generated or wrapped client used by web
│   ├── contracts/                   # OpenAPI-derived types and stable DTO views
│   ├── validation/                  # Shared non-domain boundary schemas only
│   └── config/                      # Shared TypeScript/lint/test presets if needed
├── database/
│   ├── README.md                    # Database workflow and local commands
│   ├── migrations/                  # Created during implementation phase
│   ├── seeds/                       # Minimal deterministic development data
│   └── fixtures/                    # Reusable test/content fixtures
├── docs/
├── scripts/                         # Small repository automation only
├── tests/
│   └── e2e/                         # Cross-app tests when the first loop exists
├── .github/
│   └── workflows/                   # CI added during setup phase
├── package.json
├── pnpm-workspace.yaml
├── turbo.json                       # Optional; add only if task orchestration helps
├── tsconfig.base.json
├── README.md
└── .env.example
```

### What Exists Now

Only `docs/` exists and should remain unchanged except for approved planning/documentation updates.

### What Should Exist During Repository Setup

- `apps/web` and `apps/api`;
- root package/workspace/type configuration;
- the minimum shared contracts/client package needed to connect web and API;
- database workflow directories, but no production schema decisions hidden in setup;
- test and CI scaffolding;
- `.env.example` containing names and descriptions, never secrets.

### What Should Be Deferred

- `packages/ui`: defer until more than one application actually needs shared UI. The web app can use the agreed UI stack locally first.
- `packages/types`: avoid an unowned bag of domain types. Put API contract types in `contracts`; keep domain types inside the owning backend module.
- `packages/config`: create only for genuinely shared presets, not as an abstraction layer for one app.
- `scripts` beyond setup/test/content fixture utilities.
- public SDKs, integration adapters, mobile apps, and separate workers/services.

The structure supports the modular monolith without turning every conceptual domain into a package or service.

## 3. Monorepo Decision

### Recommendation

Use a pnpm monorepo. A single repository is the best initial fit for a small team and AI-assisted development because frontend, backend, API contracts, documentation, tests, and migrations can be reviewed together.

### Reasoning

- Shared TypeScript API contracts and generated clients stay synchronized.
- OpenAPI changes can update frontend consumers in the same pull request.
- Cross-cutting authorization and task-version invariants are easier to review.
- One issue, branch, and CI change can cover a vertical slice.
- Deployment can still build and deploy web and API independently later.
- Future B2B API work can evolve beside the internal consumer without duplicating the domain.

Separate repositories would provide stronger release independence, but there are no current team or deployment constraints that justify the coordination cost.

Do not add Turborepo merely because the repository is a monorepo. Add it when repeated task orchestration or caching is measurable; the initial workspace can use pnpm scripts.

## 4. Frontend Boundary

### Application Shape

Use Next.js App Router with TypeScript. The frontend is a client of the REST API and never owns scoring, progress, authorization, or assessment state.

```text
apps/web/
├── app/
│   ├── (public)/                    # landing and public entry points
│   ├── (auth)/                      # sign-in, registration, recovery
│   ├── (teacher)/teacher/           # primary MVP workspace
│   ├── (student)/student/           # solving and assigned work
│   ├── (parent)/parent/             # future relationship-scoped UI
│   ├── (organization)/organization/ # future organization administration
│   └── (admin)/admin/               # future platform administration
├── components/                      # local shared presentation components
├── features/                        # feature UI and query composition
├── lib/                             # API client, auth/session helpers, UI utilities
└── styles/
```

Route groups organize access and layout without implying separate applications. Parent, organization, and admin route groups may remain placeholders until their product scope is approved.

### Authentication Boundaries

The server establishes the authenticated session. Route protection can use server-side checks for initial page access, while API authorization remains authoritative for every operation. Do not rely on hidden routes or client-side role checks.

### Server and Client Components

- Prefer Server Components for initial reads, static layouts, and access-aware page composition.
- Use Client Components only for interaction, local state, browser APIs, task solving, and forms.
- Keep mutation and authorization behavior in the API; client-side checks are only UX guidance.
- Do not put long-lived secrets or provider credentials in browser code.

### Data and Forms

TanStack Query owns client-side server-state fetching, cache invalidation, retries, and mutation status where interactive screens require it. Server Components may use a typed server API client for initial reads. React Hook Form and Zod handle form state and immediate user feedback; the API repeats all validation.

### API Client

Use an OpenAPI-generated TypeScript client or generated typed request layer as the primary contract. Keep a thin wrapper for auth headers, correlation IDs, error normalization, and request defaults. Do not hand-maintain duplicate frontend interfaces for API resources.

Every route and mutation needs intentional loading, empty, validation, permission, conflict, dependency-failure, and retry states. Accessibility and mobile layout are part of feature acceptance, not a later refactor.

## 5. Backend Boundary

NestJS hosts one modular monolith in `apps/api`. Each module owns its application use cases, domain invariants, persistence adapter, and tests. The following are code boundaries, not deployment boundaries.

| Module | Directory | Initial responsibility | Public application interface | Dependencies | Forbidden dependencies |
|---|---|---|---|---|---|
| Identity/Auth | `modules/identity` | Identity, credentials, sessions, recovery | register, authenticate, revoke session, current principal | database, security services | learning/content decisions |
| Users | `modules/users` | Profiles and preferences | read/update profile | Identity | organization authorization logic |
| Organizations/Memberships | `modules/organizations` | Organizations, memberships, invitations, scopes | resolve membership, invite, change membership | Identity, Users, Audit | guardian relationship ownership |
| Content | `modules/content` | Taxonomy, tasks, versions, materials, publication | read published content, draft/publish commands | ingestion contracts, Audit | external-source parsing |
| Content Ingestion | `modules/content-ingestion` | Raw imports, normalization, validation, provenance | start/retry/review import, publish proposal | Content taxonomy, jobs, storage | student attempt state |
| Task Engine | `modules/task-engine` | Answer schemas, validators, deterministic evaluators | start/submit/evaluate task attempt | Content | AI provider, analytics authority |
| Training | `modules/training` | Practice activities and sessions | create training, resolve tasks, start session | Content, Learning read interface | direct assessment persistence |
| Learning | `modules/learning` | Evidence, progress, mastery, recommendations | record evaluation, read progress, create deterministic recommendation | Task Engine/Assessment result contracts | AI authority, raw content writes |
| Assessment | `modules/assessment` | Assessments, variants, attempts, scoring orchestration | create assessment, start/submit/finish attempt | Content, Task Engine | direct progress mutation outside contract |
| Teaching/Homework | `modules/teaching` | Teacher relationships, groups, assignments, feedback | manage students/groups, assign activity, review results | Organizations, Users, Training, Assessment, Learning reads | bypassing target module commands |
| Analytics | `modules/analytics` | Events and derived read models | record event, query authorized reports | domain facts, jobs | writes to authoritative domains |
| Notifications | `modules/notifications` | Preferences and delivery state | create/read notification, delivery status | Teaching/Assessment events, jobs | granting permissions |
| AI | `modules/ai` | Context, orchestration, usage, response policy | request bounded assistance | authorized read interfaces, provider adapter | scoring, mastery, authorization, billing writes |
| Audit | `modules/audit` | Append-oriented security/business audit | record and query authorized audit records | database only | owning other domain state |

The initial coding phase need not implement every module fully. It should establish only the interfaces required by the selected vertical slice, while reserving the documented locations for later modules.

## 6. Dependency Rules

### Layering

Use a pragmatic layered shape inside each module:

```text
HTTP / presentation
        ↓
Application use cases and DTO mapping
        ↓
Domain rules and ports
        ↓
Infrastructure adapters and persistence
```

This is not a full enterprise DDD mandate. Small value objects and pure functions are preferred over ceremony. The purpose is to keep HTTP, ORM, provider, and domain rules from becoming inseparable.

### Module Rules

- A module may call another module's public application interface, never its repository or tables.
- Cross-module reads use explicit query interfaces or stable read projections.
- Cross-module writes are commands owned by the module whose state changes.
- Transactions are opened by the application use case that coordinates one authoritative state change.
- Domain invariants are enforced in domain/application logic and backed by database constraints where appropriate.
- Analytics events are emitted after or with a successful authoritative transaction; analytics failure must not invalidate it.
- AI receives authorized context snapshots and returns assistance artifacts, not domain mutations.
- Shared packages contain transport contracts or technical presets, not cross-domain business ownership.

### Dependency Direction

```text
Identity/Users -> Organizations -> Teaching
Content Ingestion -> Content -> Task Engine
Content -> Training
Task Engine -> Assessment
Task Engine + Assessment results -> Learning
Teaching -> Training/Assessment
All relevant domains -> Analytics/Audit facts
AI -> read-only authorized context
```

Avoid circular dependencies by extracting a narrow interface, using a query projection, or moving orchestration to an application service. Do not solve cycles with a generic shared service or direct database access.

## 7. Database Development Strategy

### Candidate

Drizzle remains the preferred ORM candidate because it keeps PostgreSQL and SQL behavior visible, supports TypeScript, and avoids hiding important migration/query decisions. Before repository setup, evaluate Drizzle against Prisma and a lower-level query approach for migration control, PostgreSQL feature coverage, transactions, generated types, test ergonomics, and team familiarity. No ORM is final until this short evaluation is recorded.

### Ownership and Migrations

- Keep migration files under `database/migrations` or the selected ORM's documented location, with one clear convention.
- Migration names include an ordered identifier and concise intent, such as `0001_create_identity_foundation`.
- A migration is reviewed with its owning module, invariants, indexes, data-volume assumptions, and rollback/recovery notes.
- Never mutate an applied migration; create a new corrective migration.
- Prefer backward-compatible expand/migrate/contract changes for deployed environments.
- Do not use application startup to create or alter production schema.

### Environments

- Local development uses a disposable PostgreSQL database, preferably through a documented local container or managed developer instance.
- CI uses an isolated PostgreSQL service/database per job or test run.
- Staging and production use managed PostgreSQL with migrations run as an explicit release step.
- Seeds are deterministic development/demo data only and must never contain real student data.

### Transactions and Tests

Transactions belong around authoritative use cases such as accepted answer submission, assessment completion, membership changes, publication, and progress update. Background jobs use durable status/idempotency records and retry-safe transactions. Tests use real PostgreSQL for constraints, transaction behavior, tenant scope, concurrency, migrations, and version references.

## 8. Authentication Strategy

### Boundary

Identity/Auth owns authentication and session lifecycle. Authorization remains in application policies and owning modules.

### Recommended Initial Shape

Use an opaque, revocable browser session represented by a secure HttpOnly, SameSite cookie. Persist session metadata server-side in PostgreSQL initially; introduce Redis for session acceleration only if measured need appears. Passwords, if supported, use a modern memory-hard password hashing algorithm and never enter logs or analytics.

Support these flows through an application-owned interface:

- registration;
- login;
- logout and session revocation;
- password reset;
- email verification if required by launch policy;
- current-user/session lookup.

The interface must leave room for future SSO/OAuth without making an external provider ID the sole Teachly identity.

### Unresolved Provider Decision

The approved documentation does not select an identity provider or confirm whether Teachly owns passwords at launch. Before coding, choose one of:

- managed authentication provider with a documented user/session mapping; or
- application-owned email/password authentication with a narrowly scoped future provider boundary.

Do not implement both. Whichever is selected must satisfy session revocation, recovery, verification, audit, minor-data, and deletion requirements.

NestJS guards/middleware establish the principal; domain policies establish access. Frontend route protection is not a substitute for API guards.

## 9. Authorization Model

Authorization is deny-by-default and evaluates the full access context, not a global role string.

### Authorization Dimensions

- **Platform role:** platform administrator privileges, isolated from ordinary tenant access.
- **Organization membership:** user, teacher, organization administrator, or other approved scoped capabilities within one organization.
- **Personal ownership:** independent teacher/student-owned resources.
- **Teaching relationship:** teacher access to explicitly managed students/groups and assigned work.
- **Guardian relationship:** parent/guardian read scope for a specific child, with status and consent policy.
- **Resource policy:** action-specific ownership, publication, assignment, and lifecycle rules.

### Required Checks

Every protected use case resolves:

1. authenticated principal;
2. requested organization context, if any;
3. direct resource owner or relationship;
4. membership/guardian status and scope;
5. action permission;
6. lifecycle and publication state.

Students may access their own assigned work and permitted independent learning. Teachers may manage students only through personal ownership, teaching relationships, or organization scope. Guardians are primarily read-only and cannot modify teacher-owned educational state by default. Organization administrators cannot automatically read every private relationship unless the product policy grants that scope.

Cross-tenant negative tests are mandatory for every organization-scoped resource. Audit sensitive membership, guardian, publication, result, and administrative access.

## 10. API Contract Strategy

### Recommendation

Use OpenAPI as the transport contract and generate TypeScript client/types for the web application. Keep Zod for frontend form/runtime validation and small client-side input schemas, but do not maintain a second hand-authored API schema. Backend request validation remains mandatory at the NestJS boundary.

### Contract Flow

```text
Backend DTO/controller contract
        ↓
OpenAPI document
        ↓
Generated TypeScript client/types
        ↓
Web feature queries and mutations
```

Contract generation runs in development/CI and fails when the generated output is stale. Domain entities and ORM types do not cross the API boundary.

### API Rules

- REST resources and explicit commands for `start`, `submit`, `assign`, `publish`, and `moderate`.
- Stable error envelope with safe error code, message, correlation ID, and optional field errors.
- Bounded cursor/page pagination according to resource behavior.
- Allowlisted filtering and sorting applied after authorization scope.
- Idempotency keys for submissions, assignments, imports, and retried commands.
- One evolving internal API initially; explicit versioning only when external compatibility requires it.
- Correlation IDs on requests, jobs, audit records, and provider calls.
- Rate limits by principal, organization, IP, and expensive operation.

The API is internal for MVP. Public integration APIs, webhooks, SSO, and SDKs remain future contracts.

## 11. Task Engine Implementation Boundary

### Conceptual Boundary

```text
Task identity
  -> TaskVersion (draft/reviewed/published, immutable after publication)
  -> Attempt (exact version reference)
  -> Evaluation (versioned deterministic rules)
  -> Result and learning facts
```

`Task` identifies the enduring educational problem. `TaskVersion` contains the content, answer schema, evaluation rule identity, metadata, provenance, and publication state. An `Attempt` records the learner execution against one exact version and preserves the evaluation outcome needed for historical review.

### Initial Implementation Constraints

- Begin with the smallest approved answer-type set after Product Owner selection; do not implement every candidate type.
- Keep type-specific validation/evaluation behind a task-type registry or equivalent narrow strategy, without turning it into a general plugin platform.
- Draft editing is allowed before publication; published versions are immutable.
- A correction that could change content, answer validity, scoring, or historical interpretation creates a new version.
- Start/submit operations are server-authoritative and idempotent.
- Evaluation is deterministic, testable, and independent of AI/provider availability.
- Replaying an old attempt uses the stored version and evaluation-rule identity, not current task content.

Generated variants, media-heavy tasks, programming tasks, localization, and advanced solution generation are later extensions.

## 12. Content Ingestion Boundary

### Pipeline

```text
External Source
    -> Import Batch
    -> Raw Import
    -> Normalization
    -> Validation
    -> Topic/Skill Mapping
    -> Moderation
    -> Canonical Content
    -> Published TaskVersion
```

Content Ingestion owns source adapters, raw artifacts, provenance, licensing status, normalization output, validation reports, duplicate candidates, and moderation state. Content owns canonical records and publication. Import code must not directly create student-facing published tasks.

### Job and State Rules

- Each import has a source, source identifier, batch, timestamp, licensing metadata, and traceable input.
- A source record and normalized identity support idempotent reprocessing.
- Duplicate detection produces a reviewable candidate; it must not silently discard content.
- Failed items retain diagnostics and can be retried from the appropriate stage.
- Normalization is deterministic for the same source input and adapter version.
- Validation gates publication; moderation/rights checks can also gate publication.
- Reprocessing creates an auditable transformation history and never rewrites historical attempts.
- Raw external HTML/scripts are untrusted and must be sanitized or represented as safe structured content.

Do not implement importers until licensed sources, first formats, and answer types are confirmed.

## 13. Background Jobs

### Principle

> Synchronous by default, asynchronous when there is a concrete reason.

Keep request-path work synchronous when it is bounded, user-visible, and transactionally coupled to the response. Use BullMQ/Redis when work is long-running, retryable, externally dependent, bursty, or not necessary to complete the request.

### Justified Candidates

- content import, normalization, validation, and reprocessing;
- email and notification delivery;
- analytics projection/aggregation when event volume warrants it;
- AI requests if latency/cost/provider retry behavior requires isolation;
- report/export generation.

Do not queue answer evaluation, permission checks, simple progress updates, or ordinary reads merely to standardize architecture. If a job is introduced, persist durable status, idempotency, attempts, failure reason, correlation ID, and enough audit context in PostgreSQL. Redis is queue coordination/cache, not business state.

## 14. Observability

### Confirmed Product Direction

Teachly will provide a unified metrics and analytics capability inspired by the core workflows of Prometheus and Grafana, while keeping the first delivery intentionally smaller and aligned with the modular monolith. This is a confirmed roadmap requirement, not a Stage 0 implementation task.

The capability has two explicitly separated planes:

1. **Operational observability:** request rate, errors, latency distributions, availability, database and dependency health, background-job health when jobs exist, rate-limit activity, AI provider latency/errors/token usage/cost, and release/deployment markers.
2. **Product and learning analytics:** tenant-safe product adoption, activation and workflow funnels, assignments, attempts, completion and outcome trends, skill evidence, teacher engagement, AI usefulness, and other privacy-reviewed educational indicators.

The target experience should reuse the most valuable Grafana/Prometheus interaction patterns without attempting to clone either product: time-range selection, filters and grouping, metric cards, time-series and distribution views, saved dashboards, drill-down from summary to evidence, threshold rules, and alerts. A curated default dashboard library is required so users do not need monitoring expertise to obtain value.

Implementation must remain incremental:

- define a versioned metric and event catalog, ownership, dimensions, units, retention, and access rules before collecting broad telemetry;
- add bounded counters, gauges, and histograms at the API/module boundaries, with correlation IDs linking metrics, traces, logs, and audit records;
- keep low-volume authoritative analytics facts and tenant-scoped derived read models in PostgreSQL first;
- expose operational metrics through a Prometheus-compatible boundary when the first dashboards require it, then use Grafana or an equivalent compatible visualization/alerting layer if deployment and operating cost are justified;
- build Teachly-native analytics screens over authorized API read models; the browser never queries infrastructure telemetry or cross-tenant data directly;
- introduce dedicated time-series storage, long-term retention, workers, or streaming only after measured volume or reliability requirements prove that PostgreSQL and the initial collector are insufficient.

Operational telemetry is never authoritative learning state. Analytics or monitoring failure must not fail an attempt, grading transaction, progress update, or other authoritative domain operation. Metric labels must avoid unbounded cardinality: raw user IDs, request IDs, free text, answers, prompts, and model responses are not metric dimensions.

### Initial Baseline

- Structured application logs with level, timestamp, service/module, request/job ID, actor/tenant-safe identifiers, and outcome.
- Request and correlation IDs propagated from API to domain operations, jobs, audit, and external calls.
- Sentry or equivalent for exceptions, traces, release context, and bounded performance signals.
- PostHog or equivalent for privacy-reviewed product events, not authoritative learning facts.
- Audit logs for membership, authorization-sensitive reads/actions, publication, moderation, assessment state, deletion, and AI data access.
- Job status, duration, retry count, failure reason, and queue latency when workers exist.

Do not log passwords, tokens, full sensitive answers, raw AI context, or unnecessary minor PII. Delivery starts with request failures/latency, database health, job health, evaluation failures, import failures, AI usage, and key product-loop events, then expands through the reviewed metric catalog rather than collecting every possible signal by default.

## 15. Testing Architecture

### Pyramid

1. **Unit:** answer validators, evaluators, progress/mastery rules, permission predicates, parsers, and pure policies.
2. **Domain/application:** publish, start, submit, assign, complete, moderate, and membership transitions.
3. **API integration:** DTOs, error contracts, authentication, organization/guardian scope, idempotency, pagination, and rate limits.
4. **Database integration:** real PostgreSQL transactions, constraints, migrations, concurrency, tenancy, version references, and seed/fixture behavior.
5. **Content ingestion:** raw preservation, normalization, validation, provenance, licensing gates, duplicates, retry, moderation, and publication.
6. **End-to-end:** teacher creates student, selects published content, assigns work, student submits, evaluation persists, progress updates, and teacher reads the result.

### Mandatory Invariants

- one organization cannot read another organization's data;
- guardians cannot exceed their relationship scope or mutate teacher-owned state;
- teachers cannot access students without an ownership, teaching, or organization relationship;
- published TaskVersions cannot be mutated in place;
- attempts reference exact task versions and remain reproducible;
- identical version/rule/answer inputs evaluate deterministically;
- imported canonical content retains source/provenance/license traceability;
- analytics or notification failure cannot invalidate an authoritative result;
- retries do not duplicate attempts, assignments, or imports.

## 16. Development Standards

- TypeScript strictness is enabled; avoid `any` except at explicitly isolated external boundaries.
- Domain terminology follows the approved documents; do not introduce subject-specific core names.
- Files and symbols use the repository's chosen formatter/linter conventions; establish them once at setup and do not make feature-specific exceptions.
- HTTP DTOs, domain objects, persistence records, and external provider payloads are distinct where their lifecycles differ.
- Errors are typed at boundaries, safe for clients, and logged with correlation context.
- Validation is explicit and repeated server-side; client validation improves UX only.
- Logs are structured and privacy-aware.
- Commits are small and imperative; pull requests explain behavior, tests, migrations, security impact, and documentation changes.
- Every migration is reviewed; every behavior change has tests; every architectural change updates or adds an ADR.
- Documentation updates accompany changed contracts, invariants, scope, or operational behavior.

## 17. Environment Strategy

### Environments

- **Local:** developer-managed web/API processes and disposable PostgreSQL; optional Redis only for features that need it.
- **Test/CI:** isolated PostgreSQL and deterministic fixtures; no real external credentials or student data.
- **Staging:** managed services and representative seed content, with non-production accounts and provider sandboxes.
- **Production:** managed services, restricted access, backups, monitoring, explicit migrations, and reviewed secrets.

### Configuration

Environment variables hold database URLs, session/auth secrets, cookie configuration, object-storage credentials, queue configuration, Sentry/PostHog keys, email provider settings, and future AI provider credentials. `.env.example` documents names and safe example values; real secrets are never committed, logged, or placed in generated client code.

Provider credentials and production data are never available to autonomous agents by default.

## 18. CI/CD Blueprint

### Pull Request Pipeline

```text
Install with lockfile
  -> format/lint
  -> typecheck
  -> unit/domain tests
  -> API/database integration tests
  -> contract generation/check
  -> build web and API
```

Use an isolated PostgreSQL service for integration tests. Add migration validation and a clean database migration test before accepting schema changes. Add dependency/security/secret scanning as a lightweight CI check.

### Later or Conditional Checks

- E2E tests run in CI once the vertical UI exists, initially on main/release or a dedicated job if runtime is high.
- Browser security and upload tests run when those flows exist.
- Deployment is outside this phase; production migration execution requires a reviewed release process.

CI must fail on stale generated API contracts, type errors, failed deterministic evaluation tests, unauthorized access regressions, or migration failures.

## 19. First Implementation Sequence

The sequence is dependency-aware and intentionally narrower than the full domain map.

### Step 1: Repository and Tooling Foundation

Create the workspace, strict TypeScript configuration, formatting/linting, test runner, environment conventions, API contract generation approach, and local PostgreSQL workflow. Do not create broad empty modules or speculative infrastructure.

### Step 2: Identity and Access Foundation

Implement the selected authentication strategy, user identity, sessions, principal resolution, personal workspace context, organization-ready memberships, and authorization policy primitives. Add audit hooks and negative access tests before adding educational state.

### Step 3: Minimal Content and Taxonomy

Implement generic subject/course/topic/skill references and a small canonical content path. Add task draft/publication lifecycle and one or two confirmed MVP task types. Use deterministic fixtures first; content ingestion can initially be represented by controlled fixture import if external licensing/source decisions are not complete.

### Step 4: Task Version and Attempt Loop

Implement immutable published TaskVersions, start/submit idempotency, exact version references, deterministic evaluation, result persistence, and reproducibility tests. This is the first technical correctness milestone.

### Step 5: Teacher Workspace and Student Relationship

Add teacher-owned students, minimal groups if needed, content selection, and the teacher-facing create/assign flow. Enforce relationship and organization scope through the same API policies.

### Step 6: Training/Homework Vertical Slice

Add training/activity definition, assignment recipients, student assigned-work view, task solving, completion, and teacher result view. Keep notifications in-app/minimal and synchronous where possible.

### Step 7: Learning State and Analytics Facts

Record accepted evaluation evidence, deterministic basic topic/skill progress, and PostgreSQL-backed events. Add the minimum teacher analytics needed to decide the next activity. Do not add AI before this state is trusted.

### Step 8: Generic Assessment/Slice

Resolve a task set into an assessment, create an assessment attempt, calculate deterministic results, and feed the same learning/analytics contracts. Timing and rules remain minimal until requirements are confirmed.

### Step 9: Hardening

Run tenant/guardian/teacher authorization tests, task replay tests, import/provenance tests, failure/retry tests, observability review, and end-to-end testing. Only then plan Phase 2 capabilities.

## 20. Phase 1 Coding Scope

The active post-hardening delivery scope is maintained in `docs/development/stage-1-showcase-plan.md`. It reflects the capabilities already implemented in the repository and supersedes using the historical bootstrap sequence below as a literal current task list. The approved self-hostable monitoring work is specified separately in `docs/development/stage-2-observability-plan.md`.

### Must Build

- repository/tooling foundation;
- selected authentication/session boundary;
- user and teacher workspace context;
- student relationship and minimal organization-ready scope;
- generic subject/course/topic/skill references;
- a deliberately small licensed or fixture-backed canonical content set;
- Task/TaskVersion lifecycle with immutable publication;
- one or two confirmed deterministic task types;
- task attempt submission, idempotency, evaluation, and result;
- teacher-created training/homework assignment;
- student assigned-work solving flow;
- basic topic/skill evidence and progress;
- minimal teacher results/analytics;
- audit foundation and critical authorization tests.

### Should Build

- minimal generic assessment/slice after the task loop is stable;
- controlled import fixture path with provenance and validation interfaces;
- in-app notifications for assignments;
- PostgreSQL-backed analytics events and a small read model;
- minimal group support if teacher validation shows it is required for assignment usability.

### Explicitly Defer

- full AI Tutor and AI-generated teacher content;
- complex billing/subscriptions;
- mobile and Telegram Mini App;
- video, calls, and whiteboard;
- advanced recommendation/adaptive learning engine;
- external B2B APIs, webhooks, SSO, SDKs, and embeddables;
- code execution sandbox;
- formal proctoring and external exam integrations;
- full parent dashboard, though the relationship and policy boundary must remain possible;
- organization-wide programs and advanced analytics;
- broad importer coverage before licensing, formats, and moderation operations are known.

## 21. Risks and Unresolved Decisions

### Decisions Required Before Coding

- Select the first licensed content source or explicitly approve fixture-only development content.
- Select the initial answer types and evaluation rules.
- Decide whether application-owned authentication or a managed provider owns passwords/sessions at launch.
- Confirm the minimum teacher workflow and analytics needed for the first validation release.
- Evaluate Drizzle versus Prisma/lower-level access and record the implementation choice.
- Confirm whether minimal assessment/slice is part of the first coding milestone or follows the training loop.

### Safe to Defer

- exact future public API shape;
- SSO and external identity mapping;
- billing entitlements;
- parent-facing UI details, beyond access policy and relationship foundations;
- AI provider, model routing, prompt library, and usage pricing;
- code execution architecture;
- generated variants, localization, media-heavy tasks, and advanced learning paths;
- queue infrastructure until an actual asynchronous workload exists.

### Implementation Risks

- Broad module scaffolding can create false completeness; implement contracts only when a vertical slice needs them.
- Choosing task types before content and evaluation decisions can cause rework.
- Authentication provider ambiguity can leak into every API and frontend feature; resolve it first.
- Shared types can become an unowned domain model; keep business ownership in modules.
- Analytics added before event semantics are stable can produce misleading teacher reports.
- Import architecture can be overbuilt before a licensed source and format are known.
- ORM convenience can obscure versioning and transaction behavior; verify generated SQL and migration workflow early.

## 22. Contradiction Review

No material contradictions were found between the current product documents, architecture documents, database guidance, API guidance, and ADRs.

The following are deliberate clarifications rather than requirement changes:

- **MVP versus first coding milestone:** the approved MVP includes a generic assessment/slice, but the implementation sequence places it after the core task/training loop so correctness is established first.
- **Content ingestion versus early development:** the approved MVP requires imported canonical content, but early technical work may use controlled fixtures until licensing and source formats are confirmed. The ingestion boundary must still be designed before production content is loaded.
- **Organization support versus organization administration:** the first phase establishes organization-ready ownership and authorization primitives, while advanced organization programs and analytics remain later.
- **Parent architecture versus parent UI:** guardian relationships and policy boundaries are preserved early; the parent dashboard remains deferred as documented.
- **Drizzle preference versus final selection:** Drizzle remains the preferred candidate, but the architecture document intentionally requires a short evaluation before dependency setup.

These clarifications preserve the approved product direction and avoid premature implementation commitments.

## Recommended First Coding Task

After the Product Owner resolves the authentication and initial content/task-type decisions, create the repository/tooling foundation and a minimal architecture test that verifies the workspace can build the web/API applications, generate the OpenAPI contract, connect to a disposable PostgreSQL database, and run one isolated domain test. Do not start with UI screens or broad database schema generation.
