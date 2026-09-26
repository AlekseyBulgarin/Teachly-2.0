# B2B Educational AI Pilot

## Status

- **Phase:** B2B-AI 0.6
- **Status:** Approved pilot definition
- **Product direction:** Teachly is a B2B Educational AI Intelligence layer for existing education platforms. The standalone Teachly application remains a future demo and reference client.

## Target Customer

The first customer is a CIS-oriented online school, tutoring center, or exam-preparation platform that:

- owns its user accounts and frontend;
- already has course, task, attempt, and deterministic result data;
- has at least one active exam-preparation subject or program;
- can provide an engineering contact for a server-to-server integration;
- can approve pseudonymous educational data use for the pilot.

The customer does not migrate authentication, learner accounts, or the primary user experience to Teachly.

## Pilot Problem

Existing education platforms have learning history and deterministic results but cannot reliably turn them into contextual intelligence. Teachers need a trusted connection between:

- what a learner attempted;
- which course and skills were involved;
- what the deterministic result shows;
- which approved knowledge explains the topic;
- what misconception may be present; and
- what activity should happen next.

Generic chat does not solve this problem because it lacks authorized learning context, provenance, and teacher-facing evidence.

## First Integration

The pilot uses a narrow server-to-server REST API with a workspace-scoped API key.

- The customer owns authentication and frontend identity.
- Teachly maps customer identities as `workspace_id + integration_id + external_user_id`.
- The customer sends authorized course, task, skill, attempt, and result context through idempotent API operations.
- The customer invokes assistance from its own learner or teacher experience.
- Teachly returns bounded assistance and proposed intelligence artifacts.
- Broad public API versioning, SDKs, webhooks, and SSO remain future capabilities.

## First AI Use Case

The first AI capability is **grounded post-attempt remediation**.

```text
Student request
-> authorized tenant and learner context
-> task, course, and skill context
-> deterministic attempt and result history
-> learning-state evidence
-> approved knowledge retrieval
-> grounded explanation or hint
-> misconception hypothesis
-> teacher insight and learning-plan candidates
-> usage and evaluation record
```

### Student Output

- A grounded explanation or hint tied to the task, course, skill, and approved knowledge.
- Guidance that supports solving without blindly dumping the answer.
- A safe abstention or escalation when the available context is insufficient.

### Teacher Output

- A likely learning gap or misconception.
- Evidence references used to form the hypothesis.
- A recommended approved material or next activity.
- Confidence and status indicating that the output is a proposal, not an authoritative fact.

## Pilot Success Metrics

Targets are initial pilot gates and must be calibrated against the partner baseline.

- At least 80% of targeted learning events are accepted without manual correction.
- 100% of AI requests are traceable to tenant, external user, task or skill context, model/provider, policy version, usage, and evaluation data.
- Zero cross-tenant access findings in integration and negative authorization tests.
- At least 70% teacher-rated usefulness for insight or next-activity proposals.
- A measurable reduction in teacher time spent identifying learner gaps, with the baseline recorded before the pilot.
- Learner assistance remains grounded in approved knowledge, with unsupported requests producing an abstention or safe fallback.
- Provider failures, AI disablement, or delayed AI responses do not interrupt deterministic learning results.

## P0 Exclusions

- Teachly-owned authentication for external learners or teachers.
- Customer frontend migration or a standalone Teachly learner experience.
- SSO, webhooks, SDKs, and a broad public API surface.
- Autonomous tutoring or autonomous teacher actions.
- AI scoring, grading, or answer correctness decisions.
- AI modification of permissions, attempts, results, billing, canonical content, or authoritative learning state.
- A sophisticated mastery algorithm or fully adaptive learning engine.
- Broad multi-subject content ingestion.
- Foundation-model training, SFT, preference tuning, or distillation.
- Production code execution, proctoring, plagiarism detection, or exam simulation.
- Billing and subscription enforcement.
- Cross-tenant analytics or organization-wide programs.

## Open Hypotheses

- The first partner and exact subject remain to be selected.
- The first pilot may require non-minor or de-identified data until legal review is complete.
- The first content and knowledge sources, licenses, and moderation owner remain unresolved.
- The pilot must confirm whether Teachly imports customer result facts only or also evaluates a narrow Teachly-owned task set.
- The first teacher workflow may be API response only, a Teachly review surface, or both.
- Provider, model, latency target, and synchronous versus asynchronous execution remain implementation decisions.
- Retention, deletion, residency, consent, and provider data-use terms require partner-specific legal validation.

## Historical Documentation Note

Existing teacher-first and standalone product documents remain historical guidance. This document narrows the first validation target to a B2B intelligence-layer pilot without removing the future standalone reference client.
