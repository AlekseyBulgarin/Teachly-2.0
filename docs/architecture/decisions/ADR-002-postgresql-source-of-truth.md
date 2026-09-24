# ADR-002: PostgreSQL as Source of Truth

- **Status:** Accepted for initial implementation

## Context

Teachly needs consistent relationships, content versions, attempts, scoring, progress, tenant scope, and audit records. These states must remain queryable and transactionally related.

## Decision

Use PostgreSQL as the authoritative store for business state. Redis, object storage, analytics tools, and queues are supporting systems only. PostgreSQL-backed events begin the analytics approach.

## Alternatives Considered

- Multiple specialized databases: rejected until a measured requirement exists.
- Event sourcing: rejected because current product value does not justify rebuilding all state from events.
- Redis as primary state: rejected because durability, querying, and relational authorization are central.

## Consequences

Transactions and relational constraints support correctness. Retention, indexing, projections, and archival must be planned as data grows. Cache invalidation cannot change authoritative behavior.
