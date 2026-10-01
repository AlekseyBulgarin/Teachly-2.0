---
name: teachly-frontend
description: Implement safe frontend changes in the Teachly Next.js Showcase while preserving architecture, i18n, API boundaries and quality gates.
---

Use this skill for work inside apps/web.

Stack:
- Next.js 16 App Router
- React
- TypeScript
- Tailwind CSS v4
- shadcn-compatible UI

Rules:
- preserve current architecture
- reuse shared components
- avoid unnecessary dependencies
- avoid unnecessary client components
- preserve RU/EN i18n
- preserve the same-origin /api/teachly proxy
- keep API secrets server-side
- never expose secrets through NEXT_PUBLIC_*
- do not change backend architecture to solve frontend problems
- do not invent backend functionality
- do not turn the Showcase into an LMS

Verification should match task scope.

For a normal Showcase milestone:
- web typecheck
- web build
- git diff --check

Use Playwright only when visual or interaction behavior changed.

Do not commit unless explicitly requested.