# ADR-009: Phase 2 Single-choice Vertical Slice

- **Status:** Accepted for Phase 2

## Context

Teachly needs a production-oriented backend foundation, but the universal task engine and generic assessment model are intentionally deferred. A small deterministic task type provides a meaningful correctness milestone without designing every educational answer format.

## Decision

Phase 2 implements one immutable published `single-choice` TaskVersion and the flow:

```text
Teacher -> Student -> Assignment -> Attempt -> Answer -> Evaluation -> Result
```

The evaluator is server-side, deterministic, version-aware, and independently tested. Development content is synthetic/internal fixture content and carries explicit development-only provenance. Generic Assessment is deferred until the task-attempt loop is stable.

## Alternatives Considered

- Implement multiple task types: rejected as unnecessary complexity before source and answer requirements are confirmed.
- Start with generic Assessment: deferred because it would add state transitions before task correctness is proven.
- Use AI for evaluation: rejected because correctness and progress must remain deterministic and auditable.

## Consequences

The first schema and API are intentionally narrow. The TaskVersion content and evaluator identity leave room for additional evaluators, while no production content licensing or universal task taxonomy is implied.
