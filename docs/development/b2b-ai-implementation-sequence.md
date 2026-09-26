# B2B-AI Implementation Sequence

## Status

- **Phase:** B2B-AI 0.6
- **Purpose:** Near-term dependency-aware sequence after the pilot, tenant, identity, AI authority, and privacy decisions.
- **Scope:** Planning only. This document does not authorize speculative infrastructure or broad module scaffolding.

The first integration is a narrow REST API with a workspace-scoped API key. The customer keeps authentication and frontend ownership. Broad public API versioning, SSO, webhooks, SDKs, and the standalone client remain later work.

## Sequence

### 1. P0: Tenant Foundation

Establish Organization, Workspace, membership scope, the three pilot roles, tenant request context, and deny-by-default policy primitives.

Dependencies:

- approved tenant and role model;
- direct Teachly principal boundary for administrative users;
- PostgreSQL ownership and isolation design.

Exit criteria:

- every protected operation can resolve organization and workspace context;
- cross-tenant negative tests exist;
- tenant context is available to audit and downstream modules.

### 2. P0: External Identity and Integration/API Key

Add Integration, ApiKey, and ExternalUser mapping. Implement workspace/integration/external-user uniqueness, collision handling, explicit relinking, hashed and revocable API keys, capability scopes, correlation IDs, and audit events.

Exit criteria:

- customer users can be addressed without Teachly accounts;
- revoked or mismatched keys fail closed;
- external identity collisions cannot silently cross tenants.

### 3. P0: Tenant-Scope Existing Core Resources

Apply tenant ownership or authorized tenant projections to courses, task context, skills, assignments, attempts, deterministic results, and audit access. Preserve the existing versioned and deterministic result invariants.

Exit criteria:

- existing assignment and attempt behavior remains deterministic;
- all integration-visible resources enforce tenant scope;
- tenant isolation and ownership tests cover reads, writes, retries, and result access.

### 4. P0: Learning Event and Evidence Foundation

Define and persist LearningEvent facts, deterministic SkillEvidence, and a minimal LearningState projection. Start with evidence counts, recent outcomes, last activity, and explainable status. Do not introduce a sophisticated mastery algorithm.

Exit criteria:

- events are idempotent and traceable to source operations;
- evidence is reproducible from facts and versioned rules;
- state remains available when AI is disabled.

### 5. P0: Approved Knowledge Ingestion and Retrieval

Implement the smallest approved knowledge path with source, license, tenant visibility, document version, moderation status, and retrieval references. Keep raw external content untrusted and prevent unreviewed content from entering student-facing AI context.

Exit criteria:

- every retrieved excerpt has an approved source and version;
- retrieval is tenant- and workspace-authorized;
- unsupported or unavailable knowledge produces a safe fallback.

### 6. P0: AI Provider and Evaluation Boundary

Add the AI provider port, context assembly policy, structured response schema, safety validation, usage accounting, provider/model metadata, and an evaluation record boundary. Keep provider calls downstream of authorization and evidence retrieval.

Exit criteria:

- model output cannot mutate authoritative domain state;
- provider failures and AI disablement do not fail deterministic learning workflows;
- groundedness, safety, usefulness, latency, and cost can be evaluated.

### 7. P0: Grounded Remediation and Teacher Insight

Implement the single AI vertical slice: post-attempt student hint or explanation plus proposed MisconceptionHypothesis, TeacherInsight, and LearningPlanRecommendation artifacts.

Exit criteria:

- student output is grounded and avoids blind answer dumping;
- teacher artifacts expose evidence, confidence, and proposal status;
- no artifact changes scoring, attempts, permissions, billing, canonical content, or authoritative learning state.

### 8. P0, then P1: Partner API and Pilot E2E

Expose only the API operations required for the selected partner: external-user synchronization, course/task/skill context, learning-event ingestion, assistance invocation, and authorized insight/recommendation reads. Validate the complete partner flow with pseudonymous data, auditability, usage limits, and operational monitoring.

After P0 pilot evidence, P1 commercial hardening may add:

- stronger quotas and organization reporting;
- operational SLAs and support tooling;
- stable contract versioning;
- additional integrations or approved webhooks;
- billing and commercial entitlements where justified.

### 9. P2: ML Fine-Tuning and Specialization

Only after repeated pilot evidence, approved evaluation data, teacher feedback labels, and legal approval should Teachly consider SFT, preference tuning, distillation, or task-specific specialization. Foundation-model training from scratch is not part of this plan.

## Required Verification

- Cross-tenant authorization and API-key isolation tests.
- External-user collision, relinking, deactivation, and idempotency tests.
- Deterministic result and version-lineage regression tests.
- Learning-event replay and evidence reproducibility tests.
- Knowledge provenance, licensing, moderation, and retrieval-scope tests.
- AI output-schema, groundedness, safety, cost, latency, and provider-failure tests.
- Full partner E2E test from external identity through student assistance and teacher proposal review.

## Historical Documentation Note

This sequence narrows the earlier internal-first implementation plan for one approved B2B pilot. It does not make broad public APIs, SSO, webhooks, SDKs, or advanced ML generally available. Existing historical documents remain unchanged.
