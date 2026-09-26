# ADR-012: Privacy and Future ML Data Principles

- **Status:** Accepted for B2B-AI 0.6 pilot planning
- **Extends:** Security Baseline and ADR-004 AI Boundaries for the B2B integration pilot.

## Context

The pilot processes educational data from an existing customer platform. The data may relate to minors and may be subject to CIS jurisdiction-specific requirements. Teachly needs enough traceability to evaluate educational AI without treating operational data as an unrestricted training corpus.

## Privacy Boundary

### PII Minimization

- Collect only the identity and educational fields needed for the requested workflow.
- Prefer customer-owned identifiers and pseudonymous learner references over names, email addresses, phone numbers, or free-form personal details.
- Do not send unnecessary PII to model providers.
- Keep customer authentication data and credentials outside Teachly unless a separate approved identity decision requires otherwise.
- Do not log raw API keys, provider secrets, full sensitive answers, or unnecessary learner data.

### Pseudonymous External Learners

External learners are addressed through the tenant-owned mapping:

```text
workspace_id + integration_id + external_user_id
```

The external identifier should be pseudonymous where possible. Re-identification remains the customer's responsibility unless a documented pilot requirement says otherwise.

### Minimum Provider Context

Each model request must be purpose-bound and limited to the authorized context required for that request, such as:

- task and course context;
- relevant skill context;
- selected deterministic attempt and result history;
- relevant learning evidence;
- approved knowledge excerpts;
- the learner request.

Unrelated tenant data, broad learner histories, credentials, direct identifiers, and unrestricted raw documents must not be included by default.

### Tenant Isolation

Tenant and workspace authorization occurs before context retrieval and before provider submission. Context snapshots, AI responses, usage records, and evaluations retain tenant ownership. Cross-tenant data must not be used for prompting, reporting, or training without an explicit approved policy.

### Operational Data and ML Datasets

Operational records support product behavior and auditability. ML datasets support evaluation or future model improvement. They are logically separate, have separate access policies, and do not share data automatically.

Operational data must not be reused for provider training, SFT, preference tuning, or other ML purposes without an explicit policy and, where required, consent and legal approval.

## AI Interaction Traceability

The first AI interaction must be traceable through minimized, policy-controlled records containing, where applicable:

- tenant, workspace, integration, and external-user references;
- provider and model;
- prompt and safety policy version;
- authorized context references and source versions;
- task, course, topic, and skill references;
- the learner request, subject to redaction and retention policy;
- structured model output and student-facing response;
- misconception, insight, and recommendation references;
- teacher feedback and learner outcome when available;
- latency, token usage, estimated cost, retry, and failure data;
- evaluation result, evaluator version, and review status.

Raw prompts, raw context, and model responses require stricter access and retention controls than derived metrics. Redaction or pseudonymization should occur before data enters any future ML dataset.

## Future ML Progression

Teachly should evolve its intelligence capability in this order:

```text
foundation/open-weight model
-> RAG, tools, and authorized context
-> educational evaluations
-> structured data collection
-> supervised fine-tuning
-> preference tuning
-> distillation or specialization
```

Teachly will not train a foundation model from scratch for the pilot or the foreseeable next phase.

## Pilot-Specific Open Requirements

The following require partner-specific product and legal validation before production learner data is used:

- applicable CIS jurisdiction and residency requirements;
- lawful basis and consent requirements, including requirements for minors;
- retention and deletion periods for operational and AI records;
- customer export, correction, and deletion behavior;
- provider data-use, retention, and model-training terms;
- whether learner requests and teacher feedback may enter evaluation or training datasets;
- incident response, access review, and data-subprocessor requirements.

## Consequences

- Privacy and legal policy are part of the pilot gate, not a later ML concern.
- Evaluation data must be useful without exposing unnecessary learner identity.
- Provider abstraction must preserve portable operational records and avoid provider-specific domain authority.
- AI can be disabled or deleted without changing authoritative attempts, results, permissions, billing, or learning state.
