# ADR-004: AI Boundaries

- **Status:** Accepted for initial implementation

## Context

AI can provide useful explanations and recommendations but may hallucinate, be unavailable, or return inconsistent outputs. Educational correctness, permissions, and progress require deterministic authority.

## Decision

AI is an orchestration and assistance subsystem. It may read explicitly authorized context and produce hints, explanations, analysis, or proposed recommendations. It cannot own correctness, scoring, mastery, progress, authorization, billing, or assessment state.

## Alternatives Considered

- AI as adaptive state machine: rejected because it is not sufficiently deterministic or auditable.
- AI only as a separate chatbot: rejected because useful context-aware assistance still needs governed integration.
- Provider-specific architecture: rejected to preserve future routing and cost control.

## Consequences

AI outputs require context, policy, validation, usage controls, and visible provenance. Core learning works when AI is disabled.
