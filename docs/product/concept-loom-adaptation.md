# Concept Loom adaptation for Teachly

## Decision

Teachly may adapt the learning workflow demonstrated by
[ConceptLoom](https://github.com/Zproger/ConceptLoom) as a native ecosystem
module. The initial delivery is an explicitly labelled Showcase demo, not a
production learning-state implementation.

Reviewed upstream revision: `6cc52dfbc8dca2ab02680171d2f85ea402ebc8df`
(ConceptLoom 1.1.0, MIT), reviewed on 2026-10-08.

## What is reused

The product pattern is:

```text
goal -> knowledge frontier -> minimum route -> concealed checkpoint -> transfer -> saved next step
```

This complements Teachly's existing tasks, approved knowledge, learner
progress, teacher signals, and provider-ready AI boundary.

No upstream runtime source is vendored in this milestone. The Showcase links
to the original project and identifies the method as an open-source
inspiration; it does not claim a partnership.

## Why the upstream runtime is not embedded

ConceptLoom is intentionally a local stdio MCP server. It stores resumable
state in workspace files and keeps checkpoint tokens in process memory. Those
choices are appropriate for a local learning workspace but are not suitable as
Teachly's multi-tenant production authority.

The upstream documentation also states that free-form responses are judged by
the model. Teachly must keep final grading and learning-state transitions on
the server and treat AI as a supporting subsystem.

## Showcase boundary

The `/concept-loom` route is a client-side interactive illustration:

- it uses fixed, reviewed example scenarios;
- it does not call an AI provider;
- it does not persist learner state;
- it does not claim production grading;
- it marks both the page and catalog capability as `DEMO`.

## Production path

A production version should be implemented as an owning backend module after a
pilot validates the scenario. It should:

1. store goals, approved routes, evidence, gaps, review dates, and resume points
   in PostgreSQL through reviewed migrations;
2. expose typed versioned contracts and tenant-scoped integration permissions;
3. create and assess concealed checkpoints on the server with replay and
   expiry rules;
4. use the existing Knowledge module for approved source material;
5. use the AI boundary only for explanations and proposals, never as the owner
   of grading or progress;
6. publish signals through existing Progress, Teacher, and Analytics module
   contracts instead of reading their persistence directly;
7. add authorization, cross-tenant, idempotency, migration, and API tests before
   changing the capability from `DEMO`.

No ADR or schema migration is required for the Showcase-only milestone.
