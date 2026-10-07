import assert from 'node:assert/strict';
import test from 'node:test';
import { monitorRequestAuthorized } from './monitor-auth';

const env = { NODE_ENV: 'test', TEACHLY_MONITOR_USER: 'operator', TEACHLY_MONITOR_PASSWORD: 'strong-monitor-password' } as NodeJS.ProcessEnv;

test('monitor basic authentication fails closed and compares the complete credentials', () => {
  assert.equal(monitorRequestAuthorized(null, env), false);
  assert.equal(monitorRequestAuthorized(`Basic ${Buffer.from('operator:wrong').toString('base64')}`, env), false);
  assert.equal(monitorRequestAuthorized(`Basic ${Buffer.from('operator:strong-monitor-password').toString('base64')}`, env), true);
  assert.equal(monitorRequestAuthorized(`Basic ${Buffer.from('other:strong-monitor-password').toString('base64')}`, env), false);
  assert.equal(monitorRequestAuthorized(`Basic ${Buffer.from(`operator:${'x'.repeat(1025)}`).toString('base64')}`, env), false);
});
