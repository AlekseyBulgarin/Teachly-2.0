# ADR-008: Development Authentication Adapter

- **Status:** Accepted for Phase 2 development only

## Context

The production managed authentication provider has not been selected. The backend must still exercise internal user resolution and authorization without coupling domain code to a provider SDK.

## Decision

Use an application-owned `AuthenticationAdapter` boundary. Phase 2 supplies a development-only header adapter that resolves seeded development identities into Teachly users. It is disabled whenever `NODE_ENV=production` and is additionally controlled by `DEV_AUTH_ENABLED`.

The adapter returns an external provider/subject pair. Teachly resolves that pair through its own external-identity mapping and performs all authorization using internal user IDs and relationships.

## Alternatives Considered

- Hard-code user IDs in controllers: rejected because it bypasses the intended identity boundary.
- Implement passwords now: rejected because the provider decision is unresolved and password operations are outside this slice.
- Import a provider SDK: rejected because it would couple domain/application code before provider selection.

## Consequences

Local and automated development can exercise real authorization paths. The adapter must never be enabled in production, and a production provider adapter must preserve the same internal principal and identity-mapping contract.
