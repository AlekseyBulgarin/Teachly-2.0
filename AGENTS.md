# Teachly Agent Instructions

Rules below are stable. They apply to every agent working in this repository, including Codex.

## Architecture

- **Modular monolith.** `apps/api` is a NestJS modular monolith. Module ownership boundaries are real boundaries: do not reach across modules for persistence or invariants. See `docs/architecture/decisions/ADR-001-modular-monolith.md`.
- **Frontend/backend boundary.** `apps/web` is a client, never an authority. Domain rules, evaluation, scoring, permissions, and tenant scope live on the server. The frontend consumes typed contracts and must not duplicate them.
- **PostgreSQL is the source of truth.** Schema changes go through reviewed migrations. Never hide schema changes in application startup.
- **AI is a supporting subsystem.** It assists the learning loop; it does not own state or grading.

## Build strategy

Order of preference for any new capability:

**reuse → integrate → extend → build**

Search the existing codebase first. Reuse what already exists, then integrate an existing library, then extend an existing module, and only last write something new.

## Infrastructure

**No speculative infrastructure.** Do not add Redis, queues, Kafka, microservices, Kubernetes, event sourcing, vector databases, or ML infrastructure unless a task explicitly requires it. See the deferred list in `docs/architecture/overview.md`.

## Workflow

- **No commits unless requested.** Never commit, amend, push, or open PRs unless the user explicitly asks. Leave changes in the working tree.
- **Preserve existing user changes.** The working tree often carries uncommitted work. Do not revert, discard, stash, or overwrite it, and do not run destructive git commands.
- **Targeted tests first.** Add tests aimed at the behavior being changed. Follow `docs/development/testing.md` for the layer that applies (unit, domain, integration, API, e2e). Do not run the destructive database suites against a shared database.
- **Small, scoped changes.** Do not silently change architecture, rename common commands, or rewrite product copy.
- **Report honestly.** Report files changed, verification run, assumptions, and remaining risks.

## References

- `docs/development/ai-agents.md` — role boundaries and required agent output
- `docs/development/workflow.md` — delivery cycle and migration rules
- `docs/development/testing.md` — testing strategy
- `README.md` — commands, environment, local PostgreSQL setup
