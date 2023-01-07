const { teardown: teardownDevServer } = require('jest-dev-server');
const { teardown: teardownPuppeteer } = require('jest-environment-puppeteer');

module.exports = async (globalConfig) => {
  await teardownDevServer(globalConfig);
  await teardownPuppeteer();
}
