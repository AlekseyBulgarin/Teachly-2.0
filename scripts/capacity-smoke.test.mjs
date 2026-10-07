import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import { runCapacitySmoke } from './capacity-smoke.mjs';

test('capacity smoke bounds concurrency and reports successful readiness traffic', async () => {
  let active = 0;
  let peak = 0;
  const server = createServer((_request, response) => {
    active += 1;
    peak = Math.max(peak, active);
    setTimeout(() => { active -= 1; response.writeHead(200).end('ok'); }, 5);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  try {
    assert.notEqual(address, null);
    const port = typeof address === 'object' ? address.port : 0;
    const report = await runCapacitySmoke({ url: `http://127.0.0.1:${port}/health/ready`, requests: 20, concurrency: 4, timeoutMs: 1_000 });
    assert.equal(report.failures, 0);
    assert.deepEqual(report.statuses, { 200: 20 });
    assert.ok(peak <= 4);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('capacity smoke rejects unsafe request volume', async () => {
  await assert.rejects(
    runCapacitySmoke({ url: 'https://example.test/health/ready', requests: 501, concurrency: 1, timeoutMs: 1_000 }),
    /requests must be an integer from 1 to 500/,
  );
});
