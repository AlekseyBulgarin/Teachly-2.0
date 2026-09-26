# ADR-011: Educational AI Authority and Learning State

- **Status:** Accepted for B2B-AI 0.6 pilot planning
- **Extends:** ADR-004 AI Boundaries with the first bounded educational intelligence workflow.

## Context

Teachly must differentiate through trusted educational intelligence rather than generic chat. The useful context includes learning history, deterministic results, course and skill context, and approved knowledge. AI can explain and propose, but it is not sufficiently deterministic to own educational authority.

## Authority Model

All educational intelligence follows this direction:

```text
OBSERVED FACT -> DETERMINISTIC DERIVED STATE -> AI HYPOTHESIS / PROPOSAL
```

### Observed Fact

An observed fact is an immutable or append-oriented record received from an authorized system or produced by an authoritative Teachly operation. Examples include:

- task and course context;
- attempt started or submitted;
- deterministic result and evaluation rule;
- approved knowledge document and version;
- teacher feedback;
- learner request;
- integration or usage event.

Observed facts retain source, tenant, actor or external-user reference, time, and correlation information.

### Deterministic Derived State

Deterministic state is calculated from observed facts and explicit versioned rules. It must be reproducible and explainable. It may be recalculated without relying on a model provider.

### AI Hypothesis or Proposal

AI artifacts are contextual assistance derived from authorized facts and approved knowledge. They include evidence references, confidence, policy/model metadata, and lifecycle status. They remain reviewable, retractable, and non-authoritative.

## Minimum Learning Concepts

### LearningEvent

An append-oriented fact describing a meaningful learning action or outcome, such as an attempt submission, deterministic result, activity completion, teacher feedback, or approved material interaction. It is tenant-scoped and idempotently ingestible.

### SkillEvidence

A deterministic evidence record connecting one or more learning events and a skill or topic. It records the rule or evaluator that produced it and the evidence references used. It is not a claim that the learner has permanently mastered or failed a skill.

### LearningState

A deterministic projection of recent evidence for an external learner within course and skill context. The minimum state includes evidence count, recent outcomes, last observed activity, and an explainable status such as insufficient evidence, needs practice, or showing progress. A sophisticated mastery algorithm is out of scope.

### MisconceptionHypothesis

An AI-generated, evidence-linked hypothesis about a likely learner gap or misconception. It includes confidence, supporting evidence, model/policy metadata, and a proposed, confirmed, rejected, or expired status. It does not change scoring or learning state by itself.

### TeacherInsight

A teacher-facing proposal summarizing a likely gap, the evidence used, and a possible intervention. It is visible as a candidate for review and may be accepted, dismissed, or corrected by an educator.

### LearningPlanRecommendation

A proposed next material, task, or activity selected from authorized content and learning context. The target and eligibility rules remain deterministic or teacher-controlled. AI may explain or prioritize the proposal but cannot silently assign it or alter authoritative learning state.

## First AI Flow

The first AI request follows this sequence:

```text
Student request
-> tenant and context authorization
-> task, course, and skill context
-> deterministic attempt and result history
-> learning evidence
-> approved knowledge retrieval
-> AI explanation or hint
-> misconception hypothesis
-> teacher insight and recommendation candidates
-> usage and evaluation record
```

The request must fail closed when the caller, external user, task, course, skill, or knowledge context is not authorized. The model receives only the minimum context needed for the requested assistance.

## AI Authority Restrictions

AI may propose, explain, summarize, classify, or provide a bounded hint. AI must never authoritatively modify:

- scoring;
- attempts or submissions;
- deterministic results;
- permissions or tenant membership;
- billing or entitlements;
- canonical task content or publication state;
- authoritative learning state;
- teacher assignments without explicit product authorization.

The deterministic learning workflow must continue to operate when AI is unavailable or disabled.

## Student and Teacher Behavior

Student-facing assistance should be grounded in the selected task, course, skill, deterministic history, and approved knowledge. It should support learning rather than blindly reveal an answer. If grounding is insufficient, it should abstain or request teacher review.

Teacher-facing artifacts should expose the likely gap, evidence references, approved material or next-activity candidates, confidence, and proposal status. Teacher feedback can correct or reject the artifact and may become an evaluation signal.

## Consequences

- Learning state can be trusted independently of model availability.
- AI artifacts require explicit provenance and lifecycle state.
- The first AI vertical slice depends on tenant authorization, learning events, evidence, and approved knowledge retrieval.
- Future recommendation and mastery work must preserve the observed-fact and deterministic-state boundary.
