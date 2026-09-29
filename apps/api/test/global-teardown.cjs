const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const { statePath } = require('./embedded-postgres.cjs');

module.exports = async () => {
  if (!fs.existsSync(statePath)) return;
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  if (state.serverPid) {
    try {
      if (process.platform === 'win32') execFileSync('taskkill', ['/pid', String(state.serverPid), '/f', '/t'], { stdio: 'ignore' });
      else process.kill(-Number(state.serverPid), 'SIGTERM');
    } catch {}
  }
  fs.rmSync(statePath, { force: true });
};
