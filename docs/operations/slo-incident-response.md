# Pilot SLO and incident response

These are initial engineering objectives for a bounded pilot, not a public SLA. A customer SLA requires named support owners, representative traffic, and a signed commercial agreement.

## Pilot objectives

Measured monthly at the public API edge:

- readiness and core `/v1` API availability target: 99.5%, excluding agreed maintenance;
- server error ratio target: below 1%; alert investigation starts at 5% for ten minutes;
- p95 API latency objective: below 1 second for ordinary synchronous endpoints;
- deterministic assessment remains available when the AI provider is disabled or failing;
- recovery objectives: RTO 4 hours and RPO 24 hours until measured restore evidence supports tighter values.

Do not promise these figures contractually without owner approval. AI latency and output usefulness are reported separately from deterministic availability.

## Severity

- **SEV-1:** cross-tenant access, credential exposure, destructive corruption, or complete production outage. Stop risky writes, page the incident owner, preserve evidence, and notify affected customers through the approved channel.
- **SEV-2:** material degradation, failed AI provider, or one critical pilot workflow unavailable. Restore a safe degraded mode and update the customer owner.
- **SEV-3:** localized defect with a workaround. Track, prioritize, and communicate in the normal support window.

## Incident flow

1. Declare severity, incident owner, UTC start time, affected tenant/workflow, and communication owner.
2. Contain: revoke exposed keys, disable AI, or roll back the application only when schema compatibility allows it.
3. Diagnose with request IDs, structured logs, Teachly Monitor, deployment revision, and database state. Never copy raw credentials or unnecessary learner data into the incident channel.
4. Recover using `deployment-rollback.md` or `backup-restore.md`, then run public and authenticated smoke tests.
5. Close only after monitoring is stable and the customer owner has an outcome. Publish a blameless review for SEV-1/2 with timeline, root cause, actions, and owners.

Alert routing remains a launch blocker until a named human and contact channel are configured; Prometheus rules alone do not constitute on-call coverage.
