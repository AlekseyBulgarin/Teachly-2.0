# Deployment and rollback

Application rollback and database recovery are separate operations. An application deployment may be rolled back immediately only when its database changes are backward-compatible.

## Release sequence

1. Require green API, database, contracts, web, Lighthouse and security CI jobs.
2. Verify the Vercel and Railway previews against the isolated Neon branch.
3. Create a pre-migration Neon snapshot when the release contains SQL migrations.
4. Apply reviewed, backward-compatible migrations.
5. Deploy API, verify `/health/live` and `/health/ready`, then deploy web.
6. Run the client acceptance checklist and observe errors/latency during the initial window.

## Rollback

- Vercel: select the previous known-good production deployment and promote/rollback it, then run the public showcase smoke test.
- Railway: redeploy the previous successful API deployment, then verify both health endpoints and one authenticated integration request.
- Git: create a normal revert commit for the faulty application change. Do not rewrite shared history.
- Database: prefer a forward-fix migration. If data recovery is required, restore the pre-migration snapshot into a new branch, inspect it, test the application against it and only then finalize the branch swap.

Never run an old application version against an incompatible schema. The release owner must state whether the migration is backward-compatible before authorizing application rollback.
