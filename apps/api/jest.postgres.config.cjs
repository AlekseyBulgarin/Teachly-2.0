const base = require('./jest.config.cjs');

module.exports = {
  ...base,
  globalSetup: '<rootDir>/test/global-setup.cjs',
  globalTeardown: '<rootDir>/test/global-teardown.cjs',
  setupFiles: ['<rootDir>/test/postgres-jest-env.cjs'],
  maxWorkers: 1,
};
