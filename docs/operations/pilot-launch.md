# Pilot launch gate

## Go/no-go

The release owner may approve a pilot only when CI is green, the reference acceptance checklist has evidence, production and rollback smoke tests pass, a database recovery point exists, monitoring has a named responder, and customer privacy/commercial approvals are recorded. Any cross-tenant finding, unresolved secret exposure, incompatible rollback, missing legal approval, or absent incident owner is a no-go.

## Release evidence

Record the commit and image/deployment IDs, OpenAPI checksum, migration list and compatibility statement, Neon branch/snapshot, API and web deployment URLs, secret-free reference preflight, capacity-smoke report, Lighthouse report, security scan, restore rehearsal date, and approver. Keep this bundle with the pilot record.

Run a bounded readiness capacity check only against an approved environment:

```bash
pnpm smoke:capacity -- --url https://api.example.com/health/ready --requests 100 --concurrency 10 --max-p95-ms 1000 --max-error-rate 0.01
```

The script permits only HTTP GET, caps runs at 500 requests and 25 concurrent workers, and exits non-zero when thresholds fail. It is a smoke gate, not a substitute for representative load testing.

## Commercial boundary

The first pilot may be priced at direct infrastructure and operating cost only. Before signing, list monthly database, API, web, monitoring, AI usage, backup, support, tax/payment, and contingency costs; specify currency, usage cap, overage decision, payment timing, and who can approve additional spend. Do not publish an invented price or promise unlimited usage.

SSO, billing automation, contractual SLA, dedicated infrastructure, webhooks, public SDKs, and custom retention are separate scoped decisions. Add them only after a real customer requirement and cost owner exist.

The current showcase contact path uses Telegram, phone, and email. Do not persist lead PII inside Teachly until a controller, consent text, retention/deletion period, access owner, spam controls, and breach process are approved.

## Rollout and rollback

1. Deploy migrations to an isolated Neon branch and run database/API tests.
2. Deploy preview API and web; complete client acceptance and the reference preflight.
3. Create the production recovery point and record backward/forward compatibility.
4. Deploy API before web when the web depends on a backward-compatible contract addition.
5. Run health, key-authenticated reference, monitor, and public journey smoke tests.
6. If a gate fails, stop rollout and follow `deployment-rollback.md`; never improvise a destructive database rollback.
