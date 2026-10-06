# Teachly `/v1` API policy

## Compatibility

`/v1` is the supported integration surface. Within this major version Teachly may add endpoints, optional fields, enum values, scopes, and response headers. Existing fields keep their meaning and type. Removing or renaming a field, making an optional input required, or changing authorization semantics requires a new major version.

Deprecations are announced in the changelog and response documentation at least 90 days before removal. A deprecated endpoint returns the standard `Deprecation` header and, when a date is known, `Sunset` plus a `Link` to its replacement. Security fixes may use a shorter window when keeping the old behavior would be unsafe.

## Requests and errors

- Authenticate server-to-server calls with `Authorization: Bearer <workspace-api-key>`.
- Send an opaque `x-request-id` for end-to-end correlation. Teachly echoes it or creates one.
- Every `/v1` response includes `x-teachly-api-version: 1`.
- Errors use `{ statusCode, code, message, details?, requestId }`. Integrations branch on `code`, not human-readable `message`.
- Unknown response fields and enum values must be handled safely by consumers.

## Pagination

Changing or event-like collections use opaque cursor pagination:

```json
{ "items": [], "nextCursor": null }
```

`limit` defaults to the endpoint's documented value and is bounded to `1..100`. Consumers must treat cursors as opaque and must not reuse them with different filters. Small configuration/reference collections may return a bare array only when the OpenAPI contract documents a fixed hard cap.

## Idempotency

Retryable commands use the request field `idempotencyKey` (1–200 characters). Its uniqueness scope is the authenticated workspace plus the owning resource or operation. Replaying the same key and equivalent command returns the stored result and sets `idempotentReplay: true` where the response exposes replay state. Reusing a key for a conflicting command returns `409`.

## Quotas

The baseline quota is 300 requests per 60 seconds per running API instance. Expensive AI remediation is limited to 30 requests per 60 seconds. Responses expose `x-ratelimit-limit`, `x-ratelimit-remaining`, and `x-ratelimit-reset` when a limiter applies; exhaustion returns `429` with the standard error body. The current single-instance limiter is intentional. A shared counter is required before horizontal API scaling.

## Scopes

API keys are workspace- and integration-scoped. A request must have every scope declared by the operation. The current catalog is:

- `integrations:read`, `integrations:write`
- `external_users:read`, `external_users:write`
- `assessment:read`, `assessment:answer:read`, `assessment:write`, `assessment:manage`
- `theory:read`, `theory:write`, `theory:manage`
- `trainer:read`, `trainer:write`
- `learner_intelligence:read`
- `remediation:write`
- `whiteboard:read`, `whiteboard:write`

Issue the minimum set needed by one consumer. Raw secrets are returned only at creation or rotation; rotation revokes the previous key atomically, and revocation takes effect immediately.
