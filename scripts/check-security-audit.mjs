import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const allowlist = JSON.parse(readFileSync(resolve(root, 'security/audit-allowlist.json'), 'utf8'));
const onWindows = process.platform === 'win32';
const command = onWindows ? process.env.ComSpec ?? 'cmd.exe' : 'corepack';
const args = onWindows
  ? ['/d', '/s', '/c', 'corepack pnpm audit --prod --json --registry=https://registry.npmjs.org']
  : ['pnpm', 'audit', '--prod', '--json', '--registry=https://registry.npmjs.org'];
const result = spawnSync(command, args, {
  cwd: root,
  encoding: 'utf8',
  windowsHide: true,
});

if (result.error) {
  console.error(`Unable to run dependency audit: ${result.error.message}`);
  process.exit(1);
}

let report;
try {
  report = JSON.parse(result.stdout || '{}');
} catch {
  console.error('Dependency audit did not return valid JSON.');
  if (result.stderr) console.error(result.stderr.trim());
  process.exit(1);
}

if (!report.advisories || !report.metadata) {
  console.error('Dependency audit returned an incomplete report.');
  if (result.stderr) console.error(result.stderr.trim());
  process.exit(1);
}

const severityRank = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };
const today = new Date().toISOString().slice(0, 10);
const advisories = Object.values(report.advisories ?? {}).filter(
  (advisory) => (severityRank[advisory.severity] ?? 0) >= severityRank.high,
);
const failures = [];

for (const advisory of advisories) {
  const allowed = allowlist.find(
    (entry) => entry.advisory === advisory.github_advisory_id
      && entry.package === advisory.module_name
      && entry.severity === advisory.severity,
  );
  if (!allowed) {
    failures.push(`${advisory.github_advisory_id} (${advisory.module_name}, ${advisory.severity}) is not allowlisted`);
    continue;
  }
  if (allowed.reviewBy < today) {
    failures.push(`${allowed.advisory} allowlist review expired on ${allowed.reviewBy}`);
  }
  const paths = advisory.findings?.flatMap((finding) => finding.paths ?? []) ?? [];
  if (paths.length === 0 || paths.some((path) => !path.includes(allowed.allowedPathFragment))) {
    failures.push(`${allowed.advisory} appeared through a path outside its reviewed build-tool boundary`);
  }
}

for (const entry of allowlist) {
  if (entry.reviewBy < today) failures.push(`${entry.advisory} allowlist review expired on ${entry.reviewBy}`);
}

if (failures.length > 0) {
  console.error('Production dependency audit failed:');
  for (const failure of [...new Set(failures)]) console.error(`- ${failure}`);
  process.exit(1);
}

if (advisories.length === 0) {
  console.log('Production dependency audit passed with no high or critical advisories.');
} else {
  console.log(`Production dependency audit passed with ${advisories.length} reviewed temporary exception(s).`);
  for (const advisory of advisories) console.log(`- ${advisory.github_advisory_id}: review before ${allowlist.find((entry) => entry.advisory === advisory.github_advisory_id).reviewBy}`);
}
