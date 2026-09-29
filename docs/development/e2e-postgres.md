# Local PostgreSQL E2E Setup

How `apps/api` database suites (`.e2e-spec.ts`, `.integration-spec.ts`) get a disposable PostgreSQL without any local install.

## How embedded PostgreSQL starts

- Suites must run with `apps/api/jest.postgres.config.cjs`, which adds `globalSetup`/`globalTeardown` and `maxWorkers: 1` on top of `jest.config.cjs`.
- `test/global-setup.cjs` refuses to start if the state file already exists, then spawns `node test/embedded-postgres-server.cjs` detached and polls the state file for `serverPid` for up to 120s.
- `test/embedded-postgres.cjs` uses the `embedded-postgres` npm package: initialise the cluster only when `<dataDir>/PG_VERSION` is missing, start it, create the database (error `42P04` = already exists is ignored), then write the state file. The server process appends `serverPid` and stays alive.
- State file: `$TMPDIR/teachly-api-e2e-postgres.json`. Data dir: `$TMPDIR/teachly-api-e2e-postgres` (reused between runs, `persistent: true`).

## Test database

| Setting | Value |
| --- | --- |
| Host / port | `127.0.0.1:55432` |
| User / password | `postgres` / `teachly-test` |
| Database | `teachly_test` |

`test/postgres-test.ts#testDatabase()` rebuilds `TEST_DATABASE_URL` and `DATABASE_URL` from the state file, so an ambient `TEST_DATABASE_URL` is ignored. It requires `JEST_WORKER_ID` (must run under Jest) and `ALLOW_TEST_DB_RESET=true`, and sets `NODE_ENV=test`, `DEV_AUTH_ENABLED=true`.

## Migrations and reset

`resetTestDatabase(database)` per suite (usually in `beforeAll`/`beforeEach`):

1. `DROP SCHEMA IF EXISTS drizzle CASCADE` and `public CASCADE`, then `CREATE SCHEMA public`.
2. `applyMigrations()` — the Drizzle journal in `database/migrations`.
3. `seedDevelopmentFixtures({ includeDemoRecords: false })` — fixed `fixtureIds`, no demo data.

## How E2E Nest apps bind HTTP

Each spec builds `Test.createTestingModule({ imports: [AppModule] })`, overrides `DatabaseService` with the test pool, registers `requestIdMiddleware`, `ValidationPipe({ whitelist, forbidNonWhitelisted, transform })`, `HttpExceptionFilter`, calls `app.init()`, then `startTestApp(app)` → `app.listen(0, '127.0.0.1')` (ephemeral port on loopback). Requests go through `request(app.getHttpServer())`.

## Teardown

- Per suite: `await app?.close()` in `afterAll`/`afterEach`.
- `test/global-teardown.cjs`: Windows `taskkill /pid <serverPid> /f /t` (kills the whole tree, including postgres), POSIX `process.kill(-serverPid, 'SIGTERM')` (process group); then deletes the state file. The data directory is kept for the next run.
- Because `maxWorkers: 1`, only one PostgreSQL lifecycle exists at a time.

## Common failures

```bash
# Run the suites
corepack pnpm --filter @teachly/api test:e2e
corepack pnpm --filter @teachly/api test:integration
# Single file (from apps/api)
corepack pnpm exec jest --config jest.postgres.config.cjs --runInBand test/task-bank.e2e-spec.ts
```

| Error | Fix |
| --- | --- |
| `Another PostgreSQL Jest lifecycle is active or did not shut down cleanly` / `Embedded PostgreSQL state already exists` | Stale state file from a killed run: `Remove-Item "$env:TEMP\teachly-api-e2e-postgres.json" -Force` (`rm -f "$TMPDIR/teachly-api-e2e-postgres.json"` on POSIX) and stop orphaned `postgres`/`node` processes. |
| `Embedded PostgreSQL did not start` (after 120s) | Port 55432 is taken (`netstat -ano \| findstr 55432`) or the data dir is corrupt: stop the process and `Remove-Item -Recurse "$env:TEMP\teachly-api-e2e-postgres"`. |
| `Database reset requires ALLOW_TEST_DB_RESET=true` | Prefix the run: `$env:ALLOW_TEST_DB_RESET='true'` (`ALLOW_TEST_DB_RESET=true …`). Only for disposable databases. |
| `PostgreSQL tests must run under the configured Jest PostgreSQL lifecycle` | Spec was run with plain `jest`/`test:unit`; use `--config jest.postgres.config.cjs`. |
| `Embedded PostgreSQL is not running. Use the PostgreSQL Jest config for database tests.` | The state file is missing (setup never ran, or teardown already deleted it) — rerun through the postgres config, not a single manual import. |
