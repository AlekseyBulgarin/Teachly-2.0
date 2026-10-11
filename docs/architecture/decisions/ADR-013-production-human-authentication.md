# ADR-013: Production human authentication with Neon Auth

- **Status:** Accepted

## Context

Teachly already separates external identity verification from internal authorization, but production still selected the development header adapter. Human Bearer tokens also collided with Teachly machine API keys on assessment routes.

## Decision

Use Neon Auth as the production identity provider. The API validates EdDSA access tokens against the branch JWKS and verifies issuer and audience before accepting the immutable `sub` claim. It then resolves `(provider = neon, subject)` through `external_identities`; roles, tenant membership and educational permissions remain owned by Teachly PostgreSQL.

Teachly API keys remain machine credentials and are identified by the `tlk_` prefix. Mixed human/machine routes send only those credentials through machine authentication. Identity mappings are created by the explicit, audited `auth:link-neon` operator command; successful login never grants a Teachly role automatically.

Development keeps the existing `x-dev-user` adapter behind `DEV_AUTH_ENABLED=true`. Production startup requires `HUMAN_AUTH_PROVIDER=neon` and an HTTPS `NEON_AUTH_BASE_URL`.

## Consequences

- Compromised or malformed JWTs fail closed before internal identity resolution.
- Multiple applications may authenticate through Neon while Teachly remains authoritative for access.
- A new human account cannot access domain routes until an operator intentionally maps it.
- Trusted domains, email verification, SMTP and any OAuth credentials remain deployment configuration and must pass the Neon production checklist.
