const fs = require('node:fs');
const { start } = require('./embedded-postgres.cjs');

start().then(() => {
  const statePath = require('./embedded-postgres.cjs').statePath;
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  fs.writeFileSync(statePath, JSON.stringify({ ...state, serverPid: process.pid }), 'utf8');
  setInterval(() => undefined, 2 ** 31 - 1);
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
