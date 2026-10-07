# Client Demo deployment

The public Showcase keeps all Teachly credentials on the server. The browser calls only the exact same-origin routes allowed by `apps/web/app/api/teachly/[...path]/route.ts`.

## Services

- Database: one dedicated Neon PostgreSQL database/branch.
- API: one Railway service from the repository root.
- Web: one Vercel project from the repository root, with `apps/web` selected through the pnpm filter commands below.
- Runtime: Node.js 22 and the repository-pinned pnpm version through Corepack.

## Environment variables

Web public-safe: none.

Web server-only:

- `TEACHLY_API_URL`
- `TEACHLY_DEMO_API_KEY`
- `TEACHLY_DEMO_SESSION_SECRET` (recommended; signs HttpOnly demo-whiteboard bindings)
- `TEACHLY_DEMO_EXTERNAL_LEARNER_ID`
- `TEACHLY_DEMO_ATTEMPT_ID`
- `TEACHLY_DEMO_TASK_IDS`
- `TEACHLY_SITE_URL`

API server-only:

- `NODE_ENV`
- `DEV_AUTH_ENABLED`
- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED`
- `AI_PROVIDER` (`disabled`, `openai`, or `openai-compatible`)
- `AI_API_KEY` (`OPENAI_API_KEY` remains a backward-compatible alias for direct OpenAI)
- `AI_PROVIDER_NAME` (safe display label for a compatible provider)
- `AI_BASE_URL` (required only for an OpenAI-compatible provider)
- `AI_API_MODE` (`responses` or `chat_completions`)
- `AI_MODEL`
- `AI_TIMEOUT_MS` (optional)
- `METRICS_TOKEN`
- `SERVICE_VERSION`
- `DEPLOYMENT_ENVIRONMENT`
- `PROMETHEUS_URL` (private server-side URL; optional until Teachly Monitor is enabled)
- `PROMETHEUS_BEARER_TOKEN` (optional server-side Prometheus query credential)
- `PROMETHEUS_TIMEOUT_MS` (optional, capped at 15 seconds)
- `PORT` (provided by Railway)
- `TEACHLY_DEMO_SEED_ENABLED` (required only for the explicit seed command)
- `TEACHLY_DEMO_API_KEY` (required only for the explicit seed command; it must match the Web value)

Never prefix these variables with `NEXT_PUBLIC_`.

Internal Web monitoring variables:

- `TEACHLY_MONITOR_USER`
- `TEACHLY_MONITOR_PASSWORD` (strong unique value)
- `METRICS_TOKEN` (same API metrics token; server-to-server only)

Without the two Monitor credentials, `/monitor` and `/api/monitor/*` fail closed. Place the Monitor behind an additional platform access policy or private network when available.

## Build and start commands

Railway API, repository root:

```text
Build: corepack pnpm install --frozen-lockfile && corepack pnpm --filter @teachly/api build
Pre-deploy: corepack pnpm db:migrate
Start: corepack pnpm --filter @teachly/api start
Health check: /health
```

Vercel Web, repository root:

```text
Install: corepack pnpm install --frozen-lockfile
Build: corepack pnpm --filter @teachly/web build
Output: managed by Next.js/Vercel
```

`DATABASE_URL` may use Neon's pooled URL for the running API. Set `DATABASE_URL_UNPOOLED` to the direct Neon URL so migrations and the explicit seed command use a direct connection.

## Safe initialization

1. Create the Neon database and set both database URLs on Railway.
2. Set `NODE_ENV=production`, `DEV_AUTH_ENABLED=false`, and the remaining API variables. Keep `AI_PROVIDER=disabled` until a provider credential is ready; the API and Showcase then fail closed without fabricated AI output.
3. Run migrations with `corepack pnpm db:migrate`.
4. Generate a fresh Teachly-format key; never use the deterministic development key from `apps/web/.env.example`. One suitable one-time command is `node -e "const {randomBytes}=require('node:crypto'); console.log('tlk_'+randomBytes(8).toString('hex')+'.'+randomBytes(32).toString('base64url'))"`.
5. Temporarily set `TEACHLY_DEMO_SEED_ENABLED=true` and set `TEACHLY_DEMO_API_KEY` to that fresh key.
6. Run `corepack pnpm db:seed:demo` once from a Railway shell/job with the API environment.
7. Set `TEACHLY_DEMO_SEED_ENABLED=false` after successful initialization.

The production demo seed is guarded, idempotent, does not run at application startup, rejects the known development key, and grants only the scopes needed by the public demos.

## Deployment order

1. Provision Neon.
2. Configure the Railway API environment.
3. Run database migrations.
4. Run the explicit demo fixture initialization.
5. Deploy/restart the Railway API.
6. Verify the Railway `/health` response.
7. Configure the four Web server-only variables in Vercel.
8. Deploy the Vercel Web project.
9. Run the public smoke checklist below.
10. Add production domains after the generated deployment URLs pass smoke testing.

No browser CORS configuration is needed: the browser uses the Web same-origin proxy and only the Vercel server calls the Railway API. Direct B2B API clients remain server-to-server integrations.

The API currently uses a process-local rate limiter. That is intentional for the single-instance baseline. Before running multiple API replicas, replace its storage with a shared implementation and verify limits across replicas; do not add shared infrastructure before that scaling requirement exists.

## Post-deploy smoke checklist

- `/` redirects to `/ecosystem`; an unknown route returns 404.
- Desktop and mobile navigation work; RU/EN changes visible copy and document language.
- Tasks and Theory load, fail softly, and recover through Retry.
- Trainer completes start, incorrect/correct submit, next, complete, and restart without duplicate mutations.
- Whiteboard drawing saves locally and returns after F5; copy does not claim realtime collaboration.
- Student Profile loads through the real API.
- Progress grouping changes without stale data.
- Telegram, email-copy success state, and `tel:+79923135778` work.
- Browser console has no fatal errors or hydration warnings and pages have no horizontal overflow.
- Browser network requests expose no API key, `Authorization`, `x-dev-user`, or browser-controlled learner identity.
