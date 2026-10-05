import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createTeachlyClient } from './client';

test('adds workspace authentication and a request id to v1 requests', async () => {
  let captured: Request | undefined;
  const client = createTeachlyClient({
    baseUrl: 'https://api.example.test/',
    apiKey: 'test-only-key',
    requestId: () => 'request-123',
    fetch: async (request) => {
      captured = request instanceof Request ? request : new Request(request);
      return Response.json({ id: 'integration-1' });
    },
  });

  const result = await client.GET('/v1/integration');

  assert.equal(result.response.status, 200);
  assert.equal(captured?.url, 'https://api.example.test/v1/integration');
  assert.equal(captured?.headers.get('authorization'), 'Bearer test-only-key');
  assert.equal(captured?.headers.get('x-request-id'), 'request-123');
});

test('does not send a workspace API key to public unversioned routes', async () => {
  let captured: Request | undefined;
  const client = createTeachlyClient({
    baseUrl: 'https://api.example.test',
    apiKey: 'test-only-key',
    requestId: () => 'request-456',
    fetch: async (request) => {
      captured = request instanceof Request ? request : new Request(request);
      return Response.json({ status: 'ok', database: 'ok' });
    },
  });

  await client.GET('/health');

  assert.equal(captured?.headers.get('authorization'), null);
  assert.equal(captured?.headers.get('x-request-id'), 'request-456');
});
