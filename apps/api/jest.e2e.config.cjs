const postgres = require('./jest.postgres.config.cjs');

module.exports = {
  ...postgres,
  testRegex: '\\.e2e-spec\\.ts$',
};
