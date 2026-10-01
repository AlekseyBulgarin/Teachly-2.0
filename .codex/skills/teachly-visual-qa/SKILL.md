---
name: teachly-visual-qa
description: Perform browser-based visual and interaction QA for the Teachly Showcase using Playwright.
---

Use this skill after meaningful Showcase UI changes.

Use Playwright MCP when available.

Required viewports:
- 1440x900
- 1280x800
- 768x1024
- 390x844

Routes:
- /ecosystem
- /platform
- /learning
- /ai
- /teacher
- /knowledge
- /analytics
- /integrations

Verify:
- no sidebar/content overlap
- no horizontal overflow
- readable typography
- no clipped content
- CTA layout
- mobile drawer behavior
- active navigation
- Teachly logo navigation
- buttons and links
- Live vs Preview clarity
- graceful API fallback

Actually test important interactions.

Workflow:
IMPLEMENT
-> OPEN REAL SITE
-> INSPECT
-> INTERACT
-> FIX
-> RECHECK

Do not declare the UI ready based only on typecheck or build.