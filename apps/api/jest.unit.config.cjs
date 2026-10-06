const base = require('./jest.config.cjs');

module.exports = {
  ...base,
  testRegex: '\\.spec\\.ts$',
};
