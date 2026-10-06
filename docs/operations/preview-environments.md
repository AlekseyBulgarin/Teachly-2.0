# Preview environments

Preview environments must never use the production database. Each preview receives an isolated Neon branch and a separate Railway environment. Web previews are deployed through Vercel.

## Stage 3 rehearsal

On 2026-10-05 the production Neon project rejected a schema-only branch because its legacy web-access `anonymous` role is not supported by that beta feature. To avoid copying educational data, the preview branch was created in the dedicated `teachly-test` project instead:

- Neon project: `teachly-test` (`withered-leaf-45999665`)
- branch: `preview/stage-3-production-readiness` (`br-steep-bar-b1h7x1zn`)
- parent: `phase-2-test`
- expiry: 2026-10-13T00:00:00Z
- Railway environment: `preview-stage-3` (`9ff66986-0ba4-45ea-8298-591ed21fbccd`)

Reviewed migrations were applied with the branch's direct connection. An explicit schema diff against `phase-2-test` returned `has_changes: false` after migration.

The rehearsal also found that reviewed SQL migrations 0017–0021 had journal entries but no current Drizzle metadata snapshot. `0021_snapshot.json` now records the schema after those already-reviewed migrations; a fresh `pnpm db:generate` reports no schema changes instead of proposing duplicate tables.

## Repeatable flow

1. Create an expiring branch in the test project. Use schema-only branching in production only after Neon supports the project's role configuration.
2. Obtain a direct connection for migrations and a pooled connection for the API runtime. Never print either connection string.
3. Run `pnpm db:migrate` against the direct connection.
4. Run `neon diff <parent> --branch <preview>` and review the result.
5. Create or update a dedicated Railway preview environment and set its database URLs before its first deployment.
6. Deploy the API and then point the Vercel preview at the preview API URL.
7. Run smoke, Playwright and Lighthouse checks.
8. Delete short-lived runtime environments when the PR closes. Neon branches also receive a TTL as a final safety net.
