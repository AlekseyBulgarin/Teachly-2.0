# Teachly Design System and B2B Demo Direction

## Status

- **Status:** Approved visual and product-reference direction.
- **Scope:** Future Teachly reference client, internal intelligence tool, and B2B demo UI.
- **Implementation:** Deferred until the Core AI vertical slice is stable.

This document is the canonical visual direction for Teachly. It governs future frontend work without changing the headless API, domain, or database authority model.

## 1. Brand Positioning

Teachly is a universal B2B Educational Intelligence platform. It adds an intelligent educational layer to existing learning products rather than requiring customers to replace their authentication, frontend, CRM, payments, or core platform.

```text
External Educational Platform
-> Teachly API
-> Learning Context
-> Learning State
-> Approved Knowledge
-> Educational AI
-> Student Assistance / Teacher Insights / Analytics
```

Teachly supports online schools, LMS platforms, tutoring platforms, exam-preparation products, universities, corporate learning systems, and other educational products.

Teachly has two product surfaces:

- **Headless B2B core:** tenant-scoped APIs, learning context, evidence, approved knowledge, AI boundaries, and analytics.
- **Reference/demo web application:** a client of the same application/API boundaries that demonstrates the value Teachly adds to a customer platform.

Teachly is not primarily an AI-content detector. Its product value is contextual educational intelligence grounded in authorized facts, deterministic derived state, and approved knowledge.

## 2. Visual Identity

### Brand

- Name: `Teachly`
- Logo: geometric abstract `T` mark made of three connected rounded geometric shapes.
- Mark treatment: green/turquoise gradient used with restraint.
- Lockup: logo mark plus `Teachly` wordmark.
- Character: clean, modern, technical, premium SaaS.

### Experience qualities

The interface should feel:

- educational;
- intelligent;
- trustworthy;
- technical;
- premium;
- modern.

The visual language is dark-first, calm, information-rich, and deliberately less playful than consumer EdTech.

## 3. Color Tokens

These are the starting design tokens. Components should consume semantic tokens rather than hard-coded colors.

| Token | Value | Use |
|---|---|---|
| `brand.primary` | `#10B981` | Primary action, active states, positive intelligence signal |
| `brand.dark` | `#059669` | Hover state, emphasis, dark brand accents |
| `brand.accent` | `#22C55E` | Secondary positive signal and restrained glow |
| `surface.canvas` | `#0F172A` | Main dark background |
| `surface.card` | `#1E293B` | Layered cards and panels |
| `surface.subtle` | `#334155` | Secondary surfaces and controls |
| `border.default` | `#334155` | Subtle dividers and card borders |
| `text.primary` | `#F8FAFC` | Main text on dark surfaces |
| `text.secondary` | `#CBD5E1` | Supporting text and metadata |
| `info` | `#3B82F6` | Informational status and neutral system signals |
| `warning` | `#F59E0B` | Review, caution, or incomplete state |
| `error` | `#EF4444` | Errors, rejection, or failed operations |

Green must not be used to imply that an AI hypothesis is a confirmed educational fact. Status meaning always takes precedence over color decoration.

## 4. Typography

- Primary typeface: **Inter**.
- Use strong weight and size hierarchy rather than decorative type treatments.
- Headings should be compact and confident.
- Body text should prioritize readability in dense evidence and analytics views.
- Monospace may be used for API keys, event IDs, request IDs, and technical integration metadata only.
- Avoid overly small metadata text, especially for provenance, evidence, and AI status.

## 5. UI Principles

- Lead with educational value, not generic business analytics.
- Show the relationship between learner activity, deterministic state, knowledge, and AI output.
- Keep navigation small and task-oriented.
- Use layered dark cards with subtle borders and medium or large radius.
- Use restrained green gradients and glows only for brand emphasis or primary actions.
- Integrate data visualization into meaningful cards instead of ornamental charts.
- Make source, evidence, version, confidence, and proposal status visible where they affect trust.
- Distinguish facts, deterministic derived state, and AI proposals in both labels and layout.
- Prefer calm density: enough information for a B2B decision, without an enterprise control-panel feel.
- Keep the reference client useful as an internal tool and legible as a sales demo.

## 6. Component Principles

Future components should be built around semantic educational states rather than generic dashboard widgets.

### Core primitives

- `AppShell`: dark canvas, compact navigation, workspace context, user/session controls.
- `MetricCard`: educational metric with period, scope, and source label.
- `EvidenceCard`: deterministic facts with exact source references.
- `LearningStateCard`: derived state with rule/version and recent evidence.
- `ProposalCard`: AI hypothesis or recommendation with confidence and review status.
- `KnowledgeStatusBadge`: approved, draft, rejected, restricted, or unknown license.
- `TracePanel`: end-to-end request, context, source, model, usage, and evaluation trace.
- `IntegrationHealthCard`: connection state, request volume, errors, and last activity without exposing secrets.
- `DataTable`: restrained density, clear filters, and responsive fallback.

### State hierarchy

Every intelligence surface should make the following distinction explicit:

| State type | Visual treatment | Meaning |
|---|---|---|
| Fact | Neutral evidence styling | Recorded event, attempt, result, or source record |
| Deterministic derived state | Green/blue structured styling with rule label | Server-derived learning state or evidence projection |
| AI hypothesis/recommendation | Bordered proposal styling with confidence/status | Assistive output requiring interpretation or review |

Avoid presenting AI proposals as green success confirmations.

## 7. Information Architecture

Keep the primary navigation limited to:

```text
Teachly
├── Overview
├── Learners
├── Learning
├── AI Intelligence
├── Knowledge
├── Analytics
├── Integrations
└── Settings
```

Sections require a demonstrated B2B need. Boards, social features, leaderboards, consumer gamification, and broad authoring areas are not default navigation items.

The reference client may expose a demo mode, but demo mode must use the same application/API contracts as an integrated customer flow.

## 8. Key Demo Screens

### Overview

The first screen must communicate Teachly’s value in under 30 seconds:

- active learners;
- recent learning events;
- attempts and results;
- weak skills;
- recent AI interactions;
- AI insight summary;
- integration health;
- AI usage and cost where available.

This is an educational intelligence overview, not a generic revenue or business KPI dashboard.

### Learners

The learner list emphasizes learner, course, recent activity, learning state, weak skills, recent results, and AI insight indicators.

The learner detail is a flagship demo screen:

```text
Learner
-> Learning State
-> Skills
-> Attempts
-> Evidence
-> AI Insights
-> Recommendations
```

### Learning

Show courses, skills, learning events, skill evidence, learning state, and progress. A richer skill map may be added later, but no speculative mastery algorithm is required for the first UI.

### AI Intelligence

Show grounded student assistance, mistake explanations, misconception hypotheses, teacher insights, learning recommendations, supporting evidence, confidence, and proposal status.

This is the flagship surface. Every AI output should answer: what was observed, what was derived, what was proposed, and what evidence supports it.

### Knowledge

Show approved sources, documents, versions, moderation state, provenance, and retrieval references. Status must be obvious:

- approved;
- draft;
- rejected;
- restricted;
- unknown license.

Unapproved knowledge must never appear as available student grounding.

### Analytics

Prioritize skill performance, weak areas, learner trends, cohort patterns, recurring mistakes, AI usefulness, and learning activity. Vanity metrics are secondary.

### Integrations

Make the B2B value chain visible:

```text
Customer LMS
-> Teachly Integration
-> Educational Context
-> Teachly Intelligence
-> API Response
```

Show integration identity, API key status, external users, recent requests, usage, errors, and connection health. Raw API secrets are shown only once at creation and never displayed afterward.

## 9. Demo User Journey

The reference client should demonstrate one complete story in three to five minutes:

1. An external educational platform sends learner, task, and result data.
2. Teachly records deterministic learning evidence.
3. Teachly updates Learning State.
4. The learner answers a task incorrectly.
5. Teachly combines approved knowledge with authorized learner context.
6. Educational AI explains the mistake.
7. Teachly records a possible misconception hypothesis.
8. A teacher receives an evidence-backed insight.
9. Teachly proposes the next learning action.
10. The customer sees the complete trace from integration request to proposal.

The story must remain understandable even when AI is unavailable: deterministic events, results, evidence, and learning state remain authoritative.

## 10. EGEGE Ideas to Adapt

Adapt product ideas without copying source code, identity, or architecture:

- focused task-solving interface;
- rich task presentation;
- clear answer and result state;
- explicit solution reveal;
- practice-session UX;
- learner progress visualization;
- teacher-oriented task and activity workflows.

EGEGE’s XP, streaks, leaderboard, and social mechanics may be considered later as optional engagement projections. They must not become learning authority.

## 11. Patterns to Avoid

- Generic shadcn dashboard appearance.
- Excessive gradients or glassmorphism.
- Neon cyberpunk styling.
- Childish EdTech visuals.
- Excessive gamification.
- Overly dense enterprise control panels.
- AI output presented as fact or grading authority.
- Consumer authentication assumptions in the B2B core.
- Frontend-only business logic.
- Separate demo data paths that bypass tenant, evidence, knowledge, or audit boundaries.
- Copying EGEGE source code, visual identity, SQLite architecture, or monolithic client state.

## 12. Frontend Implementation Rules

- The web application is a reference client, internal tool, and B2B demo; it is not the source of truth.
- Consume the same REST/OpenAPI and application boundaries intended for B2B integrations.
- Do not duplicate scoring, progress projection, authorization, tenant scope, approval decisions, or learning-state logic in the browser.
- Use generated API contracts or typed request layers rather than hand-maintained domain interfaces.
- Keep server state separate from local presentation state.
- Preserve tenant, workspace, external-user, correlation, and audit context in requests.
- Render provenance and proposal status from API data instead of reconstructing them in the client.
- Do not add frontend dependencies or implement UI before the Core AI vertical slice and required APIs are stable.
- Use shadcn or similar primitives only as implementation primitives; the Teachly visual identity must remain distinctive.

## 13. Mobile and Responsive Principles

- Desktop is the primary B2B dashboard target.
- Use responsive layout changes, not merely scaled desktop cards.
- Preserve the learner, course, state, and action context on narrow screens.
- Collapse secondary navigation into a compact navigation control.
- Convert wide tables into stacked records or horizontally scrollable evidence rows.
- Keep AI proposal status, confidence, and evidence references visible on mobile.
- Do not rely on hover-only interactions.
- Delay decorative motion and respect reduced-motion preferences.
- Mobile adaptation is a later implementation phase, but responsive constraints must shape component boundaries now.

## 14. Accessibility Principles

- Maintain WCAG-oriented contrast for dark surfaces and status colors.
- Never communicate state by color alone.
- Provide text labels for facts, derived state, proposal status, and confidence.
- Use semantic headings and landmarks for dashboard sections.
- Make tables, filters, dialogs, and navigation keyboard-operable.
- Provide visible focus states against dark cards.
- Support reduced motion and avoid flashing or decorative motion that competes with learning content.
- Use accessible names for charts and summarize important trends in text.
- Ensure provenance, evidence, and AI proposal labels remain readable at increased text size.
