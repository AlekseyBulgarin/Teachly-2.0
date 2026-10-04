# Teachly integration quickstart

## 1. Prepare a server-side environment

Keep the workspace API key in a server secret store. Never embed it in a browser bundle, mobile application, repository, log, or analytics payload.

```dotenv
TEACHLY_API_URL=https://teachlyapi-production.up.railway.app
TEACHLY_API_KEY=replace-with-a-workspace-api-key
TEACHLY_EXTERNAL_USER_ID=your-learner-id
```

The example values belong in `examples/teachly-consumer/.env`, which is ignored by Git.

## 2. Run the typed example

```bash
corepack pnpm install
corepack pnpm --filter @teachly/example-consumer check
corepack pnpm --filter @teachly/example-consumer start
```

The example synchronizes one external learner, then verifies that it appears in the integration-scoped learner list. It uses `@teachly/contracts`, whose endpoint, request, and response types are generated from `packages/contracts/openapi.json`.

## 3. Follow the production lifecycle

1. Create a narrowly scoped key with an administrative integration key.
2. Store the returned secret once; list operations expose metadata only.
3. Send a unique `x-request-id` on every call and persist it with integration logs.
4. Use a stable `idempotencyKey` when retrying the same command.
5. Rotate keys without downtime by deploying the new secret, verifying it, then retiring the old deployment configuration. Teachly revokes the old key as part of rotation.
6. Revoke a key immediately when a consumer is retired or a secret may be exposed.

## 4. Contract updates

Regenerate and review the contract after an API change:

```bash
corepack pnpm contracts:generate
corepack pnpm contracts:check
```

See `docs/api/v1-policy.md` for compatibility, errors, pagination, idempotency, quotas, and scope rules.

## Deferred surfaces

Webhooks, a published SDK, and embeddable packages are deliberately deferred until at least one real partner flow establishes delivery, retry, signing, and UI-boundary requirements. The generated client is an internal pilot client, not a separately versioned public SDK.
