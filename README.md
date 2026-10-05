# Teachly

Teachly is a teacher-first educational operating system. This repository currently contains the Phase 2 backend vertical slice and the approved product/architecture documentation.

## Structure

- `apps/api`: NestJS modular monolith backend.
- `apps/web`: Next.js Teachly Ecosystem presentation site and live reference client.
- `packages/contracts`: generated OpenAPI contracts and the typed pilot client.
- `examples/teachly-consumer`: minimal server-side integration consumer.
- `database`: migrations and development fixture references.
- `docs`: product, architecture, and development decisions.

## Prerequisites

- Node.js 24 or compatible LTS release.
- Corepack-enabled pnpm 12.
- PostgreSQL 15+ for integration tests and local persistence.

Enable the repository package manager with `corepack enable`, then install dependencies:

```text
corepack pnpm install
```

Copy `.env.example` to `.env.local` and set `DATABASE_URL` if needed. The API loads the ignored root `.env.local`; the web app uses `apps/web/.env.local`.

## Local PostgreSQL

Create a local database and user matching `.env.example`, or reuse the configured Neon/dev PostgreSQL database. Teachly does not require Redis or a queue for this phase.

## Database

Generate migrations after schema changes:

```text
corepack pnpm db:generate
corepack pnpm db:migrate
corepack pnpm db:seed
```

The seed creates deterministic development users, education taxonomy, and one internal single-choice task through the fixture pipeline.

## Local Ecosystem

With the local env files configured and the deterministic database seed applied, start both applications with:

```text
corepack pnpm db:migrate
corepack pnpm db:seed
corepack pnpm dev
```

- Web: `http://localhost:3000`
- API: `http://localhost:3001`
- API health: `http://localhost:3001/health`

The equivalent separate commands are `corepack pnpm dev:api` and `corepack pnpm dev:web`.

## Backend

```text
corepack pnpm dev:api
```

- API: `http://localhost:3001`
- OpenAPI UI: `http://localhost:3001/docs`
- Health: `http://localhost:3001/health`

Development authentication uses the `x-dev-user` header and is enabled only when `NODE_ENV` is not `production` and `DEV_AUTH_ENABLED=true`. Use `teacher` or `student` for the seeded identities.

## Verification

```text
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test:unit
corepack pnpm test
```

Verify the generated integration contract and example consumer with:

```text
corepack pnpm contracts:check
corepack pnpm --filter @teachly/contracts test
corepack pnpm --filter @teachly/example-consumer check
```

The integration quickstart is in `docs/integrations/quickstart.md`; `/v1` compatibility and protocol rules are in `docs/api/v1-policy.md`.

Unit tests do not need PostgreSQL:

```text
corepack pnpm test:unit
```

Integration and e2e tests require a **disposable** PostgreSQL database. Set `TEST_DATABASE_URL` to a connection URL whose database name ends in `_test` and explicitly set `ALLOW_TEST_DB_RESET=true`. These suites **drop and recreate the public schema** for isolation. Never point them at a shared or production database. Missing configuration fails the suites rather than skipping them.

```text
corepack pnpm test:integration
corepack pnpm test:e2e
corepack pnpm test
```

The database suites run the migrations and deterministic fixture seed from a clean schema. `corepack pnpm db:migrate` and `corepack pnpm db:seed` use `DATABASE_URL` for local development; seeding additionally requires explicit `NODE_ENV=development` (or `test`) and `DEV_AUTH_ENABLED=true`. The development authentication adapter is not production authentication. Startup requires explicit `NODE_ENV`, `DEV_AUTH_ENABLED`, and `DATABASE_URL` values.
