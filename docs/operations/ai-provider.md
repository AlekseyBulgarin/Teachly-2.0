# AI provider operation

Teachly treats AI as a replaceable supporting subsystem. PostgreSQL remains the source of truth for attempts, results, scores, learning state, authorization, and audit records. A provider can suggest grounded remediation but cannot change those facts.

## Safe default

With `AI_PROVIDER=disabled` (or without an AI credential), the API starts normally, `/v1/ai/status` reports `configured: false`, and remediation requests fail closed with a sanitized unavailable response. No synthetic answer is shown as live provider output.

## Direct OpenAI

```text
AI_PROVIDER=openai
AI_API_KEY=<server-only secret>
AI_MODEL=gpt-4o-mini
AI_API_MODE=responses
AI_TIMEOUT_MS=10000
```

`OPENAI_API_KEY` remains a compatibility alias. New deployments should use `AI_API_KEY`. The Responses request uses strict structured output and `store: false`.

## OpenAI-compatible provider

```text
AI_PROVIDER=openai-compatible
AI_PROVIDER_NAME=<safe display name>
AI_API_KEY=<server-only secret>
AI_BASE_URL=https://provider.example/v1
AI_API_MODE=chat_completions
AI_MODEL=<provider model id>
AI_TIMEOUT_MS=10000
```

The compatible provider must support Chat Completions structured JSON schema. Validate the exact provider/model combination in a non-production environment before enabling it in production.

## Verification and rollback

1. Configure the server-only values on the API service; never expose them through `NEXT_PUBLIC_*` or the Web deployment.
2. Restart the API and call authenticated `GET /v1/ai/status` with a key that has `remediation:write`.
3. Run one remediation against an isolated demo learner and confirm evidence references, abstention behavior, audit trace, latency, and token usage.
4. To roll back immediately, set `AI_PROVIDER=disabled` and restart the API. Existing authoritative learning data is unaffected.

The status response deliberately excludes API keys and provider endpoints. Provider failures are mapped to stable public errors; raw provider messages are not returned to clients.
