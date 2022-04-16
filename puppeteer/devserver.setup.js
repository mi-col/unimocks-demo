const { setup: setupDevServer } = require('jest-dev-server');
const { setup: setupPuppeteer } = require('jest-environment-puppeteer');

module.exports = async (globalConfig) => {
  await setupPuppeteer(globalConfig);
  await setupDevServer({
    command: 'npm run start-integration',
    launchTimeout: 60000,
    debug: true,
    port: 3000,
  });
}
