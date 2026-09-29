const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const statePath = path.join(os.tmpdir(), 'teachly-api-e2e-postgres.json');
const databaseDir = path.join(os.tmpdir(), 'teachly-api-e2e-postgres');
const port = 55432;
const user = 'postgres';
const password = 'teachly-test';
const database = 'teachly_test';

const options = {
  databaseDir,
  user,
  password,
  port,
  authMethod: 'password',
  persistent: true,
  onLog: () => undefined,
  onError: (error) => console.error(error),
};

async function loadPostgres() {
  return (await import('embedded-postgres')).default;
}

async function start() {
  const EmbeddedPostgres = await loadPostgres();
  if (fs.existsSync(statePath)) {
    throw new Error('Embedded PostgreSQL state already exists; a previous PostgreSQL test run may still be active');
  }
  if (!fs.existsSync(path.join(databaseDir, 'PG_VERSION'))) {
    fs.rmSync(databaseDir, { recursive: true, force: true });
  }
  const postgres = new EmbeddedPostgres(options);
  if (!fs.existsSync(path.join(databaseDir, 'PG_VERSION'))) await postgres.initialise();
  await postgres.start();
  try {
    await postgres.createDatabase(database);
  } catch (error) {
    if (error?.code !== '42P04') throw error;
  }
  fs.writeFileSync(statePath, JSON.stringify({ databaseDir, port, user, password, database }), 'utf8');
}

module.exports = { start, statePath };
