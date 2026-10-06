const postgres = require('./jest.postgres.config.cjs');

module.exports = {
  ...postgres,
  testRegex: '\\.integration-spec\\.ts$',
};
