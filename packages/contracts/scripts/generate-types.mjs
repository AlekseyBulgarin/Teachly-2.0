import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import openapiTS, { astToString, COMMENT_HEADER } from 'openapi-typescript';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const schemaPath = resolve(packageRoot, 'openapi.json');
const outputPath = resolve(packageRoot, 'src/generated.ts');
const checkOnly = process.argv.includes('--check');

const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
const ast = await openapiTS(schema, { alphabetize: true, immutable: true });
const next = `${COMMENT_HEADER}${astToString(ast)}`;

if (checkOnly) {
  const current = await readFile(outputPath, 'utf8').catch(() => '');
  if (current !== next) {
    throw new Error('Generated TypeScript contracts are stale. Run `pnpm contracts:generate`.');
  }
} else {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, next, 'utf8');
}
