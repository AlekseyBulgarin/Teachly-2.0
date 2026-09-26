# ADR-010: B2B Tenant and External Identity Model

- **Status:** Accepted for B2B-AI 0.6 pilot planning
- **Supersedes:** Future-only integration timing for this narrow pilot; broad public integration remains deferred.

## Context

Teachly is being validated as an intelligence layer for existing education platforms. Customers keep their own authentication and frontend, while Teachly must isolate data, authorize API calls, and address learners who do not have Teachly accounts.

The existing Phase 2 backend has users, teacher relationships, courses, tasks, attempts, results, and audit events, but it does not yet provide B2B tenant context or external-user ownership.

## Decision

Use the following ownership chain for the pilot:

```text
Organization -> Workspace -> Integration -> ApiKey
                                      \-> ExternalUser mapping
```

### Organization

An **Organization** is a B2B customer or company. It owns commercial and administrative scope and may contain one or more workspaces.

### Workspace

A **Workspace** is an isolated operational environment inside an organization. It represents a product, school unit, course environment, or integration boundary. Integrations, API keys, external-user mappings, and pilot educational data are scoped to a workspace.

### Integration

An **Integration** represents one configured customer platform connection. It belongs to one organization and workspace and owns the namespace for external identifiers and synchronization policy.

### ApiKey

An **ApiKey** is a machine credential for one integration and workspace. It is not a human identity and does not replace customer authentication.

### ExternalUser

An **ExternalUser** is a learner, teacher, or other customer-platform identity represented in Teachly without requiring a Teachly account.

The canonical external identity address is:

```text
workspace_id + integration_id + external_user_id
```

The customer owns the external identity lifecycle. Teachly owns the mapping, tenant scope, authorization checks, and audit history.

## Pilot Roles

The minimum human roles are:

- `organization_admin`: manages organization membership and organization-level settings.
- `workspace_admin`: manages a workspace, its integrations, keys, and permitted workspace members.
- `educator`: uses authorized learning context and reviews proposed insights and recommendations.

No separate analyst role is required for P0. A read-only reporting scope may be added after the pilot proves that it is needed. External learners are not Teachly memberships in this model.

## Mapping, Collisions, and Relinking

- An external-user mapping is unique within its integration and workspace.
- The same external ID may exist in different workspaces or different integrations.
- An external ID cannot be silently reassigned to another Teachly user or tenant.
- Relinking requires an explicit privileged operation, validation of ownership, preservation of the prior mapping history, and an audit event.
- Deactivation or deletion from the customer platform must not silently erase historical facts; it changes access and retention state according to the approved privacy policy.
- Customer role claims are input context only. Teachly authorization uses its own workspace membership, integration scope, and resource policies.

## Tenant Request Context

Every integration request must resolve a tenant request context before accessing resources:

```text
API key -> integration -> organization/workspace -> external principal -> policy -> resource scope
```

The context must include, as applicable:

- organization identifier;
- workspace identifier;
- integration identifier;
- authenticated API-key identity and scopes;
- external user identifier;
- requested operation;
- correlation and audit identifiers.

Missing, ambiguous, revoked, or mismatched context fails closed. Resource queries scope by tenant before returning data.

## Tenant-Scoped Resources

The following resources are tenant-scoped for the pilot:

- integrations and API keys;
- external users and identity mappings;
- courses, course context, tasks, skills, and workspace-owned knowledge;
- learning events, skill evidence, learning state, and derived intelligence artifacts;
- attempts and deterministic results received or produced within the pilot boundary;
- usage events and AI evaluation records;
- sensitive audit records.

Platform-owned content may be shared only through explicit visibility and authorization rules. It does not become tenant-owned merely because a tenant references it.

## API Key Controls

- Keys are created and owned by the organization/workspace integration boundary.
- Keys have explicit capability scopes, such as external-user synchronization, learning-event ingestion, assistance invocation, insight reads, and recommendation reads.
- Only a non-reversible hash is persisted. A display prefix may be retained for identification without exposing the secret.
- The raw secret is shown only at creation and is never logged or returned by later reads.
- Keys have status, creation metadata, optional expiration, and explicit revocation.
- Rotation creates replacement secret material without weakening audit history.
- Creation, use of sensitive scopes, failed authentication, rotation, and revocation are auditable.
- Rate limits and usage budgets apply by organization, workspace, integration, and key.

## Customer Authentication Ownership

The customer remains the authentication owner for external learners and teachers. Teachly does not require external users to register, sign in, recover passwords, or maintain Teachly sessions. Direct Teachly users, such as workspace administrators, may use a separate Teachly authentication boundary later.

## Consequences

- Existing core resources must gain explicit tenant ownership or an authorized tenant projection before they are exposed through the pilot API.
- Cross-tenant negative tests are mandatory.
- SSO, webhooks, SDKs, and broad public API versioning remain future work.
- The model supports multiple customer systems without making an external identifier the sole Teachly identity.
- Tenant context is a prerequisite for AI context assembly and usage accounting.
