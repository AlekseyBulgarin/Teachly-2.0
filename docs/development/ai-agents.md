# AI Agent Guidance

## General Rules

Agents work from approved requirements and documents, make small changes, report assumptions, and do not silently change architecture. They must not access production data, bypass review, add infrastructure without approval, or treat model output as authoritative.

## Recommended Responsibilities

- **Architect:** evaluates boundaries and ADR impact; does not implement broad features.
- **Planner:** decomposes approved work and identifies dependencies.
- **Builder:** implements a bounded module change and its tests.
- **Reviewer:** finds correctness, security, regression, and missing-test risks.
- **Debugger:** reproduces and isolates a reported defect before changing code.
- **Tester:** expands deterministic, integration, and authorization coverage.
- **Security:** reviews threat models, access boundaries, secrets, uploads, and abuse controls.
- **Database:** designs reviewed migrations and data integrity changes; never edits production directly.
- **Frontend:** implements typed client behavior without duplicating backend authority.

## Permission Boundaries

Agents may propose changes outside their module but should not apply them without explicit coordination. Architecture and product documents are updated only when the decision is approved. Production credentials, production data, deployment configuration, and irreversible migrations are outside autonomous agent scope.

## Required Agent Output

Every agent task should report files changed, tests run, assumptions, unresolved risks, and whether an ADR or documentation update is needed.
