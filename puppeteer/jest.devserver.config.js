var baseConfig = require('./jest.config');

module.exports = {
  ...baseConfig,
  globalSetup: './devserver.setup.js',
  globalTeardown: './devserver.teardown.js',
}
