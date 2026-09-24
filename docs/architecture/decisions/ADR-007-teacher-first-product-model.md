# ADR-007: Teacher-first Product Model

- **Status:** Accepted for initial product direction

## Context

Teachly must deliver value by helping teachers conduct preparation, while still providing excellent student learning and future parent/organization experiences.

## Decision

Make teacher planning, assignment, review, and next-activity workflows the primary product anchor. Model students as learning participants, guardians as relationship-scoped observers, and organizations as optional tenants. B2C and B2B use the same platform.

## Alternatives Considered

- Student-first task-bank product: rejected because it does not address the primary workflow and differentiation.
- Organization-first SIS: rejected because it would over-prioritize administration over preparation.
- Separate teacher and student products: rejected because assignment, attempts, results, and progress need one domain model.

## Consequences

Teacher workflow quality and analytics are MVP priorities. Parent UI, advanced organization administration, and broad self-directed features can follow without changing the core model.
