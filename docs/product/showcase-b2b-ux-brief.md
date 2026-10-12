# Teachly public Showcase: B2B/UX delivery brief

## Outcome

Within the first 30–60 seconds, an owner or leader of an online school, LMS,
or EdTech product should understand that Teachly adds connected educational
capabilities to the product they already run. Teachly does not replace the
customer's interface, users, authentication, courses, billing, or core
business logic.

The public journey should make the next decision easy:

1. understand the business problem;
2. see a relevant end-to-end use case;
3. inspect a real demo and its honest status;
4. understand the integration boundary and controls;
5. request a demonstration for one bounded pilot scenario.

## Source-of-truth order

When public copy and implementation disagree, use this order:

1. current API and domain behavior;
2. generated OpenAPI contracts and automated tests;
3. current-stage and architecture documentation;
4. Showcase copy.

Never promote a capability because it appears in a mock or roadmap. Every
public promise must map to a route, API contract, test, or explicit roadmap
decision.

## Public status model

Every capability has exactly one public status:

- **Available for pilot** — the required server capability and integration
  boundary exist and can be included in a reviewed pilot;
- **Interactive demo** — the buyer can explore the UX, but it is not offered
  as a production capability;
- **In development** — implementation is active but not ready for a pilot;
- **Planned** — a product direction without an implementation claim.

Domain workflow states such as `approved`, `active`, or `review` are not public
capability statuses.

## Conversion rules

- The primary homepage action is **Request a demo** and leads to real contact
  channels.
- The secondary action is **View the live demo** and leads to the connected
  Tasks → Progress → Teacher story.
- Pilot information appears after product value is understood.
- A CTA label must describe the action that actually happens after activation.
- No invented customers, metrics, ROI, SLAs, certifications, integration
  deadlines, or partnerships.

## Information architecture

The homepage sequence is:

1. value proposition and audience;
2. proof that the customer's product remains primary;
3. business problems and Teachly Core;
4. four outcome-oriented use cases;
5. how connection works;
6. selected modules and the full catalog;
7. integration boundary and controls;
8. bounded pilot;
9. contact.

Top-level marketing navigation is limited to Product, Solutions, Modules,
Integration, and Demo. The complete module inventory remains inside the
catalog and internal Showcase navigation.

## Evidence matrix for this milestone

| Public claim | Repository evidence | Public status |
| --- | --- | --- |
| Tasks, variants, theory, trainer, whiteboard | Owning API modules, persistence tests, interactive routes | Available for pilot |
| Learner profile, progress, learning intelligence | Deterministic result/evidence projections and tested API views | Available for pilot |
| Grounded remediation AI | Provider boundary, approved-knowledge references, tested configured/unconfigured flow | Available for pilot |
| Teacher prioritisation | Deterministic demo view exists; complete group workflow remains future scope | Interactive demo |
| Leadership analytics | Honest demo aggregation exists; full management reporting is not claimed | Interactive demo |
| Understanding map | Client-side reviewed scenarios; no persistent backend authority | Interactive demo |
| Webhooks, public SDK, embeddable packages | Explicitly deferred until a real integration validates contracts | Planned |

## Page requirements

### Homepage

- Preserve Teachly's premium dark visual identity.
- Sell use cases before asking the buyer to understand the complete catalog.
- Explain Progress versus Learning Intelligence and Theory versus Knowledge in
  plain language before module-level exploration.
- Make the live demo path explicit and connected.
- Show technical controls in business language without enterprise/compliance
  overclaims.

### Integration

Present two levels in order:

1. **For the product owner:** what stays with the customer, what Teachly owns,
   minimum data, first integration, pilot acceptance;
2. **For the technical team:** `/v1`, OpenAPI, scopes, tenant isolation,
   idempotency, quotas/rate limits, request IDs, audit and observability.

### Module pages

Each page answers: problem, business outcome, required data, produced result,
ecosystem connection, current proof, integration requirement, and public
status. Similar concepts must use concrete distinctions instead of repeated
abstract copy.

## Quality gates

- RU and EN parity for changed public copy;
- descriptive page title and `h1` for route announcements;
- keyboard-operable navigation and visible focus;
- reduced-motion support;
- no horizontal overflow or clipped CTA at 1440×900, 1280×800, 768×1024,
  and 390×844;
- live, error, loading, and empty states remain honest;
- web typecheck, unit tests, production build, relevant Playwright interaction
  and visual tests, and `git diff --check` pass.

## Out of scope

- new roadmap backend modules;
- speculative infrastructure;
- stored lead forms before consent, retention, access, and deletion ownership
  are approved;
- production-readiness claims not supported by deployment evidence;
- architectural rewrites unrelated to the public B2B journey.
