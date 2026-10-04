# Integration Strategy

## Direction

Teachly should eventually operate as both a standalone application and a platform component for existing education products. The internal modular monolith remains the system of record; integration is an adapter and contract layer, not a second product architecture.

## Contract Layers

- **Internal module interfaces:** application services used within the monolith; can evolve with the codebase.
- **Application REST API:** supports Teachly's own web clients and may later expose selected stable operations.
- **Public integration API:** `/v1` pilot contract with workspace credentials, scopes, quotas, tenant mapping, generated types, and a typed example client.
- **Webhooks:** future outbound notifications for durable domain facts, signed and replay-protected.
- **Identity integration:** future SSO and external-user mapping; must not make an external ID the only Teachly identity.

## Current Pilot Capabilities

- reviewed REST/OpenAPI contracts and generated TypeScript types/client;
- external learner synchronization, assessment, theory, trainer, learner-intelligence, remediation, and API-key lifecycle operations;
- stable error, pagination, idempotency, quota, scope, and compatibility rules documented in `docs/api/v1-policy.md`;

## Deferred Capabilities

- webhooks for assignment, attempt, assessment, and result changes;
- SSO and external identity mapping;
- content import/export contracts;
- embeddable task/training components;
- SDKs after usage patterns stabilize.

## Integration Invariants

- External systems never bypass Teachly authorization or domain evaluation.
- Mapping external users to Teachly users is explicit, auditable, and revocable.
- External organizations map to scoped Teachly tenants.
- Idempotency and correlation IDs are required for retries.
- Public contracts expose stable DTOs, not internal tables.
- Provider failures do not corrupt authoritative attempts or progress.

## Rollout

Run one narrow integration pilot through `/v1` and the example consumer before committing to a broad SDK, webhook, or embeddable surface. Keep those additions behind evidence from real delivery, retry, authentication, and user-interface boundaries.
