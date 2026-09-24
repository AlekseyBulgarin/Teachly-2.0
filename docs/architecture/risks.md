# Architectural and Product Risks

| Risk | Impact | Probability | Mitigation | Address |
|---|---|---:|---|---|
| Imported content lacks redistribution rights | Legal exposure and forced content removal | High | License registry, provenance, publication gate, source agreements | Before launch content |
| Imported formats are inconsistent | Slow ingestion and poor task quality | High | Narrow adapters, raw retention, normalization fixtures, validation reports | MVP |
| Task evaluation is incorrect | Incorrect feedback and progress | High | Deterministic rules, golden tests, versioned evaluators, review workflow | Before each task type |
| Task model becomes over-generalized | Slow delivery and confusing content authoring | Medium | Implement a small MVP taxonomy, add types only with evidence | MVP design |
| Task versions are mutable | Historical results change silently | High | Immutable published versions and snapshot references | Before attempts |
| Topic/skill mapping is weak | Recommendations and analytics lose trust | High | Curated taxonomy, mapping review, confidence/status fields | MVP content |
| Mastery metric is not credible | Teachers ignore progress | High | Explainable deterministic evidence, calibration with teachers | MVP analytics |
| Code execution is unsafe | Severe security incident | Medium | Defer or isolate with independent threat model and resource limits | Before code tasks |
| Parent access leaks child data | Privacy and trust harm | Medium | Dedicated relationship, scoped policies, access tests, consent decision | Before parent UI |
| Tenant isolation failure | Cross-customer data breach | Medium | Explicit scope, deny-by-default policies, isolation tests, audit | MVP |
| Teacher workflow is too complex | Low adoption despite broad features | High | Validate one loop, usability testing, limit MVP configuration | MVP |
| Analytics events become inconsistent | Misleading teacher/product decisions | Medium | Versioned event contracts, event ownership, reconciliation jobs | MVP |
| AI costs grow faster than value | Margin and availability pressure | Medium | Feature gates, budgets, quotas, caching, provider abstraction | Before AI launch |
| AI gives unsafe or misleading guidance | Student harm and trust loss | Medium | Context policy, output validation, disclaimers, human feedback, no authority | Before AI launch |
| Public integration freezes unstable APIs | Expensive compatibility burden | Medium | Internal-first pilot and explicit versioning | Phase 3 |
| Operational complexity grows prematurely | Small team cannot maintain platform | High | Managed services, modular monolith, measure before scaling | Continuous |
| Database/event volume grows unexpectedly | Cost and query degradation | Medium | Retention policy, indexes, projections, archival plan | Before scale |
| Vendor/provider lock-in | Migration cost and reduced resilience | Medium | Adapters at boundaries, portable data, avoid provider-specific domain state | During integrations |
| Child/minor obligations are misunderstood | Regulatory and product redesign risk | Medium | Jurisdiction review, data minimization, consent/retention decisions | Before broad launch |
| Content moderation backlog grows | Unsafe or unavailable content | Medium | Status workflow, prioritization, source quality scoring | MVP operations |
