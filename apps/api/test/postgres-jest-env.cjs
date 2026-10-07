// This file is loaded only by the embedded PostgreSQL Jest lifecycle.
// postgres-test.ts still ignores ambient database URLs and resolves the
// disposable database from the lifecycle-owned state file before resetting it.
process.env.ALLOW_TEST_DB_RESET = 'true';
