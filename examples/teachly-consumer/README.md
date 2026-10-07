# Teachly reference pilot consumer

Server-side TypeScript reference for the first partner workflow. It checks scopes and AI readiness, synchronizes a pseudonymous learner, creates an idempotent Trainer session, and reads the four Learner Intelligence views through the generated OpenAPI client. A configured answer can optionally exercise deterministic submission and grounded remediation.

Copy `.env.example` to `.env`, then follow `docs/integrations/quickstart.md`. The API key stays server-side and the public task contract never exposes an answer key.

Webhooks, browser widgets, and a separately versioned public SDK remain deferred until a real partner validates their delivery and UI requirements.
