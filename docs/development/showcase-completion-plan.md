# Showcase completion and release plan

Approved for execution on 2026-10-09. This plan closes the remaining code and production gaps found after stages 0–7 without changing Teachly's modular-monolith boundaries or inventing customer requirements.

## Stage 1 — truthful, complete Showcase routes

Outcome: every navigation item opens a real page and every readiness badge matches the capability demonstrated by the current API.

- Restore the existing Learning Intelligence and Knowledge experiences as first-class routes instead of redirects.
- Reuse the typed Learner Intelligence and Knowledge APIs through the same-origin Showcase proxy.
- Keep unavailable and empty states explicit; no sample number may be presented as live data.
- Reconcile AI product/demo readiness with the provider runtime and verify one real remediation request before claiming a live demo.
- Add focused unit and Playwright regression coverage for route identity, API fallback and configured/unconfigured AI states.

Acceptance:

- `/learning` and `/knowledge` render their own H1 and retain their URLs.
- their live panels use authenticated server-side demo credentials and expose no secret to the browser;
- AI capability and page labels do not contradict the runtime state;
- Web typecheck, unit tests and focused browser tests pass.

## Stage 2 — complete SEO and discovery contract

Outcome: every public Showcase route has a unique title, description, canonical URL and sitemap entry.

- Centralize the route metadata catalog so navigation, sitemap and tests cannot silently drift.
- Add static metadata exports to every Showcase page.
- Keep metadata in Server Components and keep interactive UI below the server page boundary.
- Add deterministic tests for route coverage, unique titles, canonical paths and absolute sitemap URLs.

Acceptance:

- all Showcase routes have tested metadata;
- no page inherits the generic root canonical URL;
- sitemap contains each canonical Showcase route exactly once;
- production HTML exposes the expected title, description and canonical URL.

## Stage 3 — full interaction, visual and performance QA

Outcome: the complete public surface is covered at the four agreed viewports and each major rendering archetype is covered by Lighthouse.

- Extend Playwright visual coverage from the selected decision pages to all public Showcase routes.
- Exercise navigation, language persistence, AI states, Learning and Knowledge live/fallback states.
- Expand Lighthouse from four pages to the representative heavy and decision-critical routes.
- Review changed baselines at 1440×900, 1280×800, 768×1024 and 390×844.

Acceptance:

- functional Playwright suite passes at all four viewports;
- all visual baselines are committed and pass on the Windows rendering platform used by CI;
- Lighthouse accessibility, best-practices and SEO gates pass; performance warnings are documented rather than hidden.

## Stage 4 — maintenance and audit truth

Outcome: repository automation and documentation describe current reality rather than historical blockers.

- Stop Dependabot from grouping incompatible major upgrades into broad production/development pull requests.
- Keep safe minor/patch updates grouped and keep major upgrades reviewable in isolation.
- Publish one dated current-state document for stages 0–7, Concept Loom and remaining external launch gates.
- Mark historical audits as superseded where later work resolved their findings without rewriting their history.

Acceptance:

- Dependabot configuration follows the current official GitHub schema;
- the current-state document separates completed code, deployed capability and external/customer decisions;
- no unresolved item is reported as delivered.

## Stage 5 — release, deploy and production verification

Outcome: one reviewed release reaches production with evidence from CI and post-deploy smoke tests.

- Run Web typecheck/build/unit, functional E2E, full visual regression and Lighthouse.
- Run repository contract/security/operations checks that are affected by the release.
- Commit each completed stage separately on `codex/showcase-completion`.
- Push one focused pull request with risks and rollback notes, wait for required checks, then merge.
- Wait for the production deployment and verify public routes, metadata, security headers, API health and the live AI scenario.

Acceptance:

- the release PR is green and merged;
- Vercel production serves the merged commit;
- all public Showcase routes return success and the new Learning, Knowledge and AI flows work;
- the final report lists commits, PR, tests, production evidence, assumptions and remaining external risks.

## Deliberately external gates

These are not silently implemented as part of the Showcase release because they require business, legal or customer input:

- the first named pilot customer and launch owner;
- licensed content sources and moderation ownership;
- minor-data consent, retention and deletion policy;
- contractual SLO/SLA and production capacity claims;
- alert contact routing and a production Prometheus storage/backup budget;
- public webhooks, SDK and embeddable packages before a real integration validates their requirements.
