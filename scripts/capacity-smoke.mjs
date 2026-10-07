import { performance } from 'node:perf_hooks';
import { pathToFileURL } from 'node:url';

const limits = { maxRequests: 500, maxConcurrency: 25, maxTimeoutMs: 30_000 };

export async function runCapacitySmoke(options) {
  const url = new URL(options.url);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only HTTP(S) URLs are allowed');
  const requests = integer(options.requests, 1, limits.maxRequests, 'requests');
  const concurrency = integer(options.concurrency, 1, Math.min(requests, limits.maxConcurrency), 'concurrency');
  const timeoutMs = integer(options.timeoutMs, 100, limits.maxTimeoutMs, 'timeoutMs');
  const durations = [];
  const statuses = new Map();
  let cursor = 0;
  let failures = 0;

  async function worker() {
    while (cursor < requests) {
      cursor += 1;
      const started = performance.now();
      try {
        const response = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(timeoutMs), redirect: 'error' });
        durations.push(performance.now() - started);
        statuses.set(response.status, (statuses.get(response.status) ?? 0) + 1);
        if (!response.ok) failures += 1;
        await response.body?.cancel();
      } catch {
        durations.push(performance.now() - started);
        failures += 1;
        statuses.set(0, (statuses.get(0) ?? 0) + 1);
      }
    }
  }

  const wallStarted = performance.now();
  await Promise.all(Array.from({ length: concurrency }, worker));
  const wallMs = performance.now() - wallStarted;
  durations.sort((a, b) => a - b);
  return {
    url: url.toString(), requests, concurrency, wallMs: round(wallMs),
    requestsPerSecond: round(requests / (wallMs / 1000)),
    latencyMs: { p50: percentile(durations, 0.5), p95: percentile(durations, 0.95), max: round(durations.at(-1) ?? 0) },
    failures, errorRate: round(failures / requests), statuses: Object.fromEntries(statuses),
  };
}

function integer(value, min, max, name) {
  if (!Number.isInteger(value) || value < min || value > max) throw new Error(`${name} must be an integer from ${min} to ${max}`);
  return value;
}

function percentile(values, ratio) {
  if (!values.length) return 0;
  return round(values[Math.max(0, Math.ceil(values.length * ratio) - 1)]);
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function parseArgs(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith('--') || value === undefined) throw new Error('Arguments must use --name value pairs');
    values.set(key.slice(2), value);
  }
  if (!values.get('url')) throw new Error('--url is required');
  return {
    url: values.get('url'),
    requests: Number(values.get('requests') ?? 50),
    concurrency: Number(values.get('concurrency') ?? 5),
    timeoutMs: Number(values.get('timeout-ms') ?? 5_000),
    maxP95Ms: Number(values.get('max-p95-ms') ?? 1_000),
    maxErrorRate: Number(values.get('max-error-rate') ?? 0.01),
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const report = await runCapacitySmoke(options);
  console.log(JSON.stringify(report, null, 2));
  if (report.latencyMs.p95 > options.maxP95Ms || report.errorRate > options.maxErrorRate) process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
}
