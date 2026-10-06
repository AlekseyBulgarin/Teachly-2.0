# Client acceptance checklist

Use the deployed preview, not a development server.

- The first screen explains what Teachly is, who it is for and the next action without scrolling.
- Russian and English selection persists after navigation and reload.
- All showcase routes render at 1440, 1280, 768 and 390 pixel viewports without horizontal overflow.
- AI remediation, variants, analytics, teacher and integration demos clearly distinguish live API data from illustrative content.
- The lead/contact action is reachable from the primary journey.
- Keyboard navigation reaches the menu, tabs, language switch and primary calls to action with a visible focus state.
- There are no browser console errors or CSP violations in the tested journey.
- Lighthouse accessibility, best-practices and SEO scores are at least 0.90; performance is reported and investigated below 0.75.
- API liveness and readiness return 200, while `/metrics` rejects a missing token.
- The preview uses the preview API and isolated Neon branch, never production data.
