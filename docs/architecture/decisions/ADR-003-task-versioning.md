# ADR-003: Immutable Task Versions

- **Status:** Accepted for initial implementation

## Context

Tasks may be corrected, reworded, remapped, or re-evaluated. Historical attempts must remain explainable even after content changes.

## Decision

Separate stable task identity from immutable published TaskVersion records. Attempts and resolved assessments reference the exact version and evaluation rules used. Corrections create a new version where history could change.

## Alternatives Considered

- Mutable task rows: rejected because historical results would drift.
- Copying full tasks into every attempt: rejected as wasteful and harder to manage than version references plus necessary snapshots.
- Versioning only external imports: rejected because canonical Teachly content also evolves.

## Consequences

Storage and publication workflows are more explicit. Historical auditability, reproducible evaluation, and safe content corrections become possible.

### Phase 2 lifecycle clarification

Published versions are frozen in full: content, answer schema, evaluator identity, provenance, status, and task association cannot be updated or deleted. The `archived` enum value is reserved for a later lifecycle decision; Phase 2 does not permit published-to-archived transitions. Corrections insert a new version. Attempts retain the original version ID and results retain the exact accepted submission ID plus evaluator identity. PostgreSQL migration triggers enforce the frozen published row, including deletion, and integration tests must prove this rule against a real database.
