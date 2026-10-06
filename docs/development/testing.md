# Testing Strategy

## Unit Tests

Test pure evaluation rules, answer validation, progress calculations, mastery rules, permission predicates, parsers, and recommendation policies with table-driven cases.

## Domain and Application Tests

Test state transitions such as publish, start, submit, assign, complete, moderate, and membership changes. Verify invariants and rejected transitions.

## Integration and Database Tests

Use a real PostgreSQL-compatible test environment for transactions, constraints, tenant scoping, migrations, task-version references, and concurrent submission behavior. Test queue/job persistence separately from worker execution. Local runs use the embedded PostgreSQL lifecycle — see [Local PostgreSQL E2E Setup](./e2e-postgres.md).

The API Jest suites use separate checked-in configs so shell escaping cannot broaden a targeted run:

- `pnpm --filter @teachly/api test:unit` runs only `*.spec.ts` suites and does not start PostgreSQL.
- `pnpm --filter @teachly/api test:integration` runs only `*.integration-spec.ts` suites.
- `pnpm --filter @teachly/api test:e2e` runs only `*.e2e-spec.ts` suites.
- `pnpm --filter @teachly/api test:database` runs integration and e2e suites in one embedded PostgreSQL lifecycle; CI uses this command to avoid a stop/start race between database suites.

Database suites require `ALLOW_TEST_DB_RESET=true` and must never point at a shared or production database.

## API Tests

Validate DTOs, error contracts, authentication, organization scope, guardian scope, idempotency, pagination, and rate-limit behavior. Include negative cross-tenant and cross-student cases.

## End-to-end Tests

Cover the teacher-first loop: teacher creates student, selects content, assigns work, student submits, evaluation persists, progress updates, and teacher reads results. Add guardian read-only scenarios when the UI exists.

## Content Ingestion Tests

Keep fixtures for every supported external format. Test raw preservation, normalization, invalid input, provenance, license gates, duplicate handling, mapping status, moderation, and publication.

## Deterministic Evaluation

Maintain golden cases for each task type and versioned evaluator. Re-running an historical attempt must produce the recorded result under the recorded rules, not current mutable behavior.

## Security and Resilience

Include dependency scanning, secret checks, authorization regression tests, upload abuse cases, AI prompt-injection/context leakage tests, retry/idempotency tests, backup restoration exercises, and observability checks.
