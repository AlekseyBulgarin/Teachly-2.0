# ADR-005: Organization-Aware Multi-tenancy

- **Status:** Accepted for initial implementation

## Context

Teachly supports independent teachers, organizations, users in multiple organizations, independent students, and guardian relationships. A global role field cannot express these scopes safely.

## Decision

Model organizations and explicit OrganizationMembership records. Keep personal ownership, organization ownership, teacher/student relationships, and GuardianStudent relationships distinct. Every organization-scoped request resolves and authorizes a tenant context.

## Alternatives Considered

- One organization per user: rejected because multi-organization membership is required.
- `User.role = teacher`: rejected because roles are scoped relationships, not identity attributes.
- Separate B2C and B2B systems: rejected because it duplicates domain logic and blocks migration between contexts.

## Consequences

Authorization and data access require more explicit policy checks. The same core platform can support B2C, B2B, and later integrations.
