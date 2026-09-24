# Conceptual Database Baseline

This document is intentionally not a final schema. It contains ownership, relationship, lifecycle, and invariant guidance for later database design. No SQL or migrations belong here.

## Source of Truth

PostgreSQL is authoritative for identity references, organization memberships, relationships, content lifecycle, published task versions, activities, attempts, assessments, progress, audit records, and core analytics facts. Redis, object storage, queues, and external analytics are not authoritative.

## Conceptual Areas

- **Identity:** users, sessions, profile data, account lifecycle.
- **Access:** organizations, memberships, scoped permissions, guardian relationships, classes, enrollments.
- **Taxonomy:** subjects, courses, modules, topics, skills, prerequisites.
- **Ingestion:** sources, import batches, raw payload references, normalized artifacts, provenance, licenses, validation, moderation.
- **Content:** tasks, task versions, answer schemas, evaluation rules, materials, publication state.
- **Teaching:** training activities, homework, assignments, recipients, feedback.
- **Assessment:** specifications, assessments, variants, selected version references, attempts, task attempts, scoring/results.
- **Learning:** sessions, evidence, student progress, skill progress, learning paths, recommendations.
- **Platform:** notifications, audit records, analytics events, AI conversations and usage.

## Ownership and Tenancy

Each record has one clear owning module and an explicit lifecycle. Organization-owned data has an organization context; personal data has a user owner; platform content has a distinct ownership type. A user can participate in multiple organizations. Guardian access is a relationship, not a tenant role.

## Versioning

Published TaskVersion records are immutable. Attempts retain the task version identifier and evaluation-rule identity. Assessment variants resolve their task set at creation/start according to product policy. Taxonomy changes must not silently rewrite historical evidence.

## Lifecycle and Retention

Records need states such as draft, active, archived, suspended, or deleted where applicable. Raw imports remain available for provenance according to license and retention policy. Account deletion must distinguish deletion, anonymization, audit retention, and records needed to preserve another user's history.

## Integrity Requirements

- tenant and relationship scope is checked before reads and writes;
- attempts cannot reference unpublished or unavailable versions unless explicitly grandfathered;
- evaluation and progress writes are transactionally tied to accepted attempt results;
- audit records are append-oriented;
- analytics processing failure cannot roll back authoritative learning state;
- external identifiers are never the sole identity key for a Teachly user.
