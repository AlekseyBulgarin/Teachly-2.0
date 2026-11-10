# Public Site Redesign Plan

Status: active  
Approved scope: full public-site redesign, verification, commit, pull request, merge, and production deployment  
Source brief: `C:\Users\Администратор\Downloads\Teachly_Codex_prompt.txt` (reviewed 2026-11-10)  
Baseline: `origin/main` at `b3c22bb`

## Outcome

Make the public Teachly site immediately understandable to teams that already operate an online school, LMS, or EdTech product and can involve a developer in an integration. The homepage must explain one concrete pilot scenario, show honest capability status, state what the customer team must provide, and lead to a real contact channel.

Teachly remains an embeddable educational-module ecosystem. It must not be repositioned as an LMS, homework-checking service, Telegram bot, or autonomous AI product.

## Non-negotiable rules

1. Evidence before claims. Public capability wording must follow the implementation, capability registry, API contracts, and verified browser behavior.
2. No invented customers, integrations, metrics, ROI, timelines, prices, certifications, SLAs, storage regions, compliance claims, or AI data policies.
3. Use the status system exactly: `PILOT`, `DEMO`, `IN_DEVELOPMENT`, `PLANNED`. A demo is not a production workflow.
4. Business language first. Keep architecture and API terminology on detailed routes, not in the primary homepage narrative.
5. The primary scenario is tasks → practice → stored result → progress only to the extent verified in code and tests.
6. The homepage targets teams with their own product. State before the contact step that technical-team participation is required for integration.
7. Preserve access to all real modules and existing routes. Reduce homepage repetition without deleting the product catalogue.
8. Preserve RU/EN parity, semantic HTML, keyboard use, visible focus, reduced motion, and honest fallback states.
9. Reuse existing components and dependencies. Do not rewrite the backend, authentication, database, or framework for this landing-page task.
10. Do not send a real lead or call paid AI APIs during validation. A success state is allowed only when a real handler confirms success.
11. Preserve other worktrees and unrelated user changes. Work only in `codex/public-site-redesign`.
12. Release only after targeted tests, full web checks, browser QA, CI, PR review gates, and production smoke verification pass.

## Execution stages

### Stage 0 — Evidence and baseline audit (`COMPLETE`)

- Read repository rules, architecture, testing guidance, current routes, capability registry, SEO and contact implementation.
- Inspect the current production and local homepage at desktop and mobile sizes.
- Classify visible capabilities as verified, text-only/unverified, or prototype/planned.
- Record the current CTA/contact behavior, anchors, navigation, console, network, accessibility and performance risks.

Exit criteria: a concise fact map and a scoped implementation plan based on current code rather than the brief alone.

### Stage 1 — Information architecture and copy (`COMPLETE`)

- Reduce the homepage to 7–9 meaningful sections plus header/footer.
- Establish one primary scenario and one conversion path.
- Move deep architecture, catalogue detail, comparisons and technical detail to existing relevant routes.
- Rewrite RU and EN copy together; remove repetition and unsupported claims.
- Preserve important old anchors or provide intentional replacements.

Exit criteria: the first screen answers what Teachly is, who it is for, the first scenario, customer requirements and the next action.

### Stage 2 — UI and interaction implementation (`COMPLETE`)

- Implement the new composition using the existing premium dark visual system.
- Use one meaningful product example as the hero visual.
- Make capability status and limitations visible without relying on colour or tooltips.
- Ensure the scenario interaction is deterministic, resettable and does not call AI on page load.
- Keep the complete module catalogue reachable without letting it dominate the homepage.

Exit criteria: desktop and mobile flows are coherent, readable and free of decorative fake metrics.

### Stage 3 — Contact, trust and technical clarity (`COMPLETE`)

- Verify the real contact channel and every CTA destination.
- State the four pilot steps and required technical-team participation.
- Consolidate verified data/security facts and precise limitations.
- Keep FAQ focused on suitability, developer involvement, migration, one-module pilots, status meanings, conditions, data and AI.

Exit criteria: every primary CTA reaches a genuine contact path; no simulated form submission exists.

### Stage 4 — Accessibility, SEO and performance (`COMPLETE`)

- Update title, description, OG and structured data only where supported by the canonical configuration.
- Verify heading order, landmarks, labels, focus, keyboard flow, reduced motion and mobile navigation.
- Review client-component boundaries, bundle impact, media sizing and rendering behavior.
- Verify 360, 390, 768, 1024, 1280 and 1440 px behavior.

Exit criteria: no unintended page overflow, clipped content, hover-only action, broken anchor, empty handler or missing route.

### Stage 5 — Verification and remediation (`COMPLETE`)

- Run web typecheck, unit tests, production build and `git diff --check`.
- Run targeted interaction tests first, then the relevant/full Playwright and visual suites.
- Inspect console and network behavior and correct every change-related regression.
- Re-audit the brief and this document item by item.

Exit criteria: checks pass or any external limitation is explicitly documented; no known change-related defect remains.

### Stage 6 — Release and production acceptance (`IN_PROGRESS`)

- Commit the reviewed change set and push the dedicated branch.
- Open a focused PR with tests, risks and rollback notes.
- Wait for CI and security gates, fix failures, merge, and wait for Vercel production readiness.
- Smoke-test the production alias on desktop and mobile, including CTA targets, navigation, API fallbacks, console and overflow.

Exit criteria: the merged production version is live and verified; the final report lists files, routes, evidence, tests, limitations and only concrete owner follow-ups.

## Decision log

- 2026-11-10: Work isolated from dirty `codex/full-audit-remediation` worktree.
- 2026-11-10: No database migration or backend architecture change is planned; the public web client owns this scope.
- 2026-11-10: Commit, PR, merge and production deployment explicitly approved by the product owner.
- 2026-11-10: Evidence audit confirmed the pilot chain `tasks → trainer → progress`; teacher and aggregate analytics remain explicitly `DEMO`.
- 2026-11-10: The homepage was reduced to one scenario and eight sections. The full capability catalogue remains available on demand.
- 2026-11-10: The only contact channel treated as verified by the approved brief is `+7 992 313-57-78`; unverified Telegram and email links were removed from the homepage.
- 2026-11-10: Verification passed: typecheck, 13 unit tests, production build, 128 Playwright scenarios across four standard projects (8 wide-screen-only skips), dedicated 360/1024 checks, and 32 visual baselines.
- 2026-11-10: Lighthouse passed all configured assertions across 10 routes. Homepage scores: performance 95, accessibility 96, best practices 96, SEO 100, CLS 0.
- 2026-11-10: CI exposed newly published high/critical advisories. Next.js, OpenAI, Zod and reviewed transitive overrides were upgraded; the production dependency audit now reports no high or critical advisories.

