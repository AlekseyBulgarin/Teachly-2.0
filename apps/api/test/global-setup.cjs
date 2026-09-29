const fs = require('node:fs');
const { spawn } = require('node:child_process');
const { statePath } = require('./embedded-postgres.cjs');
const path = require('node:path');

module.exports = async () => {
  if (fs.existsSync(statePath)) {
    throw new Error('Another PostgreSQL Jest lifecycle is active or did not shut down cleanly');
  }
  const server = spawn(process.execPath, [path.join(__dirname, 'embedded-postgres-server.cjs')], {
    detached: true,
    stdio: 'ignore',
  });
  server.unref();
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (fs.existsSync(statePath)) {
      const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      if (state.serverPid) return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Embedded PostgreSQL did not start');
};
