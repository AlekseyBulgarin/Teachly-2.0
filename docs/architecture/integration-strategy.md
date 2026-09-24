# Integration Strategy

## Direction

Teachly should eventually operate as both a standalone application and a platform component for existing education products. The internal modular monolith remains the system of record; integration is an adapter and contract layer, not a second product architecture.

## Contract Layers

- **Internal module interfaces:** application services used within the monolith; can evolve with the codebase.
- **Application REST API:** supports Teachly's own web clients and may later expose selected stable operations.
- **Public integration API:** future versioned contract with external credentials, scopes, quotas, and tenant mapping.
- **Webhooks:** future outbound notifications for durable domain facts, signed and replay-protected.
- **Identity integration:** future SSO and external-user mapping; must not make an external ID the only Teachly identity.

## Future Capabilities

- REST/OpenAPI resource access;
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

Do not implement public integration APIs in MVP. First validate internal workflows, identify stable resource boundaries, then run one narrow integration pilot before committing to broad SDK or webhook surface area.
