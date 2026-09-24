# Development Workflow

## Delivery Cycle

1. Clarify the product outcome and acceptance criteria.
2. Check the relevant domain document, ADRs, open questions, and security constraints.
3. Write a small implementation plan and identify data/API changes.
4. Implement within the owning module; avoid cross-module persistence access.
5. Add unit, domain, integration, and authorization tests appropriate to the change.
6. Review behavior, security, observability, and documentation impact.
7. Run formatting, linting, type checks, tests, and migration checks.
8. Update ADRs or product documentation when a decision changes.
9. Submit a focused pull request with risks and rollback notes.

## Schema and Migrations

Database changes require a reviewed migration, backward/forward compatibility assessment, data migration plan where needed, and rollback or recovery strategy. Never hide schema changes in application startup.

## Domain Changes

The owning module defines invariants and public application interfaces. A change that crosses boundaries must document the dependency and avoid circular ownership. Changes to task evaluation, task versions, progress rules, permissions, or tenant scope require especially explicit tests.

## AI-assisted Work

AI agents may propose or implement narrowly scoped changes, but a human reviews domain behavior, security, migrations, and architectural decisions. Agents must not invent product requirements or directly alter production data.
