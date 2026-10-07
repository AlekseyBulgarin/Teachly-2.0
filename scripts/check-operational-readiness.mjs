import { readFile } from 'node:fs/promises';

const requirements = [
  ['docs/operations/pilot-launch.md', ['## Go/no-go', '## Release evidence', '## Commercial boundary']],
  ['docs/operations/slo-incident-response.md', ['## Pilot objectives', '## Severity', '## Incident flow']],
  ['docs/operations/deployment-rollback.md', ['Application rollback', 'Database']],
  ['docs/operations/backup-restore.md', ['restore', 'smoke']],
  ['docs/operations/observability.md', ['Teachly Monitor', 'persistent storage']],
  ['docs/integrations/reference-pilot-acceptance.md', ['## Technical gate', '## Product and legal gate']],
  ['docs/api/v1-policy.md', ['Deprecation', 'Idempotency']],
];

const failures = [];
for (const [path, markers] of requirements) {
  try {
    const text = await readFile(path, 'utf8');
    for (const marker of markers) if (!text.includes(marker)) failures.push(`${path}: missing ${marker}`);
  } catch {
    failures.push(`${path}: missing file`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Operational readiness contract passed (${requirements.length} artifacts).`);
}
