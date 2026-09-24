# ADR-001: Modular Monolith

- **Status:** Accepted for initial implementation

## Context

Teachly has several related domains but will initially be maintained by a small team. Independent deployment and distributed consistency would add complexity before product boundaries and load patterns are proven.

## Decision

Build a NestJS modular monolith. Modules have explicit ownership, application interfaces, dependency direction, and tests. They deploy together initially; module boundaries are not service boundaries.

## Alternatives Considered

- Microservices: rejected as premature operational and consistency complexity.
- A single unstructured application: rejected because content, assessment, learning, teaching, and AI need explicit boundaries.
- Serverless per feature: rejected because domain transactions and local development would become harder without a demonstrated need.

## Consequences

The team gets simple deployment and transactional PostgreSQL workflows. The codebase must enforce module boundaries through review, dependency rules, and contract tests. Extraction remains possible later but is not a current goal.
