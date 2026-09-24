# API Overview

The initial API is an internal application REST API documented with OpenAPI. It is not yet a public integration contract. DTOs and resource boundaries should be stable enough to support a future external API without exposing database tables.

## Conceptual API Groups

| Group | Initial purpose | Future public potential |
|---|---|---|
| `/auth` | Sessions, registration, recovery | Limited, provider-dependent |
| `/users` | Profiles and preferences | Yes, scoped |
| `/organizations` | Organizations, memberships, invitations | Yes, with tenant contracts |
| `/students` | Student relationships and views | Yes |
| `/teachers` | Teacher workspace capabilities | Yes, scoped |
| `/content` | Taxonomy, canonical content, publication views | Yes, carefully licensed |
| `/content-imports` | Import batches and moderation workflows | Usually partner/admin only |
| `/tasks` | Published task versions and metadata | Yes, scoped |
| `/task-attempts` | Start, submit, evaluate, review | Yes, idempotent |
| `/training` | Training activities and sessions | Yes |
| `/learning` | Progress, mastery evidence, recommendations | Yes, privacy-scoped |
| `/assessments` | Definitions, variants, attempts, results | Yes |
| `/homework` | Assignments, recipients, feedback | Yes |
| `/analytics` | Teacher and organization read models | Restricted/scoped |
| `/notifications` | In-app delivery and preferences | Limited |
| `/ai` | Governed assistance requests and history | Restricted, policy-bound |

## API Rules

Use explicit organization context, relationship authorization, DTO validation, bounded pagination, allowlisted filters, stable error codes, idempotency keys for retried commands, correlation IDs, and rate limits. Commands such as `submit`, `start`, `assign`, `publish`, and `moderate` must enforce domain state transitions.

## Internal versus External

Internal clients may use application-specific read models. Future external consumers require versioned contracts, credentials/scopes, quotas, webhook signatures, external identity mappings, and compatibility policy. Public access must never bypass the same authoritative task evaluation, tenant isolation, or audit rules.
