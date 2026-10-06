# Backup and restore

Neon point-in-time snapshots are the primary operational recovery mechanism. A logical `pg_dump` export may be added as a second recovery format once PostgreSQL client binaries are installed in the operator environment.

## Before a production migration

1. Create a named snapshot of the production branch with an explicit retention date.
2. Apply and verify the migration on an isolated preview branch first.
3. Record the snapshot ID in the deployment change log.
4. Apply the reviewed SQL migration with the direct, non-pooled connection.
5. Run API readiness and critical smoke tests.

## Restore rehearsal

On 2026-10-05 a snapshot of the root branch in the non-production `teachly-test` project was created and restored into `rehearsal/stage-3-restore`. The restored branch reached `ready`, and `neon branches schema-diff production <restored-branch>` returned no schema differences. The temporary restored branch was then deleted; snapshot `snap-snowy-voice-b1ysf9uj` remains available until 2026-10-13.

For a real incident, restore without `--finalize`, inspect the restored branch, run application smoke tests against it, and only then finalize the swap. Never finalize directly as the first recovery step.

## Recovery acceptance

- The restored branch is `ready`.
- Schema diff against the snapshot source is empty.
- `drizzle.__drizzle_migrations` exists and contains the expected latest migration.
- API `/health/ready` returns 200 when pointed at the restored database.
- A read-only critical user-flow smoke test passes.
- The old branch and snapshot are retained until the incident is closed.
