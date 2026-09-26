# Teachly Vision

## Status

- **Confirmed:** Teachly is a universal B2B Educational Intelligence platform with a teacher-first reference experience.
- **Confirmed:** The initial market is CIS-oriented and Russian-language workflows are expected.
- **Assumption:** The first product experience will be web-first.
- **Proposed default:** Keep country, education system, examination, and subject as data, not code modules.

## Product

Teachly adds an intelligent educational layer to existing online schools, LMS platforms, tutoring platforms, exam-preparation products, universities, corporate learning systems, and other educational products. It connects authorized learner context, deterministic learning state, approved knowledge, and future Educational AI without requiring a customer to replace its authentication, frontend, CRM, payments, or core platform.

The future Teachly reference application also supports teacher workflows: organize learners, select or import content, create training and assessments, assign work, evaluate attempts, understand progress, and plan the next activity. The task bank is an input to a teacher-led preparation loop, not the complete product definition.

The core loop is:

```text
Teacher plans -> Student practices -> Teachly evaluates -> Teacher understands -> Next activity
```

Students receive a focused solving and feedback experience. Parents or guardians receive explicitly scoped monitoring access. Organizations can provide a shared workspace without changing the underlying product model.

## Users and Business Model

- **Teacher:** primary product user and workflow owner.
- **Student:** learner who solves tasks, completes activities, and receives feedback.
- **Parent/Guardian:** relationship-based observer, not an organization role.
- **Organization:** optional tenant for schools, tutoring centers, online schools, and educational companies.
- **Platform administrator:** manages platform safety, moderation, and operations.

B2C independent teachers and B2B organizations use the same platform. Billing and subscription limits are future modules, not separate architectures.

## Market and Content Direction

Initial preparation may cover OGE and EGE subjects including Informatics and ICT, Russian Language, Mathematics, Social Studies, History, Physics, Chemistry, Biology, Literature, and Geography. These are rollout priorities and reference-client scenarios, not hard-coded domain types or the product boundary.

External task banks are a major content source. Teachly must preserve provenance and licensing information while converting raw imports into validated canonical content. Imported solutions are not authoritative until validated and moderated.

## Long-Term Direction

Teachly should become:

- a headless platform API that can be embedded in existing education products;
- a standalone reference/demo web application consuming the same API and application boundaries;
- a teacher operating workspace for owned or integrated learning contexts;
- a foundation for adaptive learning, AI assistance, and future mobile experiences.

## Non-goals for This Baseline

This document does not commit Teachly to a specific examination rule set, billing design, AI provider, parent dashboard scope, or integration contract. Those decisions are recorded as assumptions or open questions elsewhere.
