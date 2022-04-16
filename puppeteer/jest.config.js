const { defaults: tsJest } = require('ts-jest/presets');

process.env.JEST_PUPPETEER_CONFIG = require.resolve('./puppeteer.config.js');

module.exports = {
  preset: 'jest-puppeteer',
  setupFilesAfterEnv: ['@testing-library/jest-dom', 'expect-puppeteer'],
  testTimeout: 60000,
  transform: tsJest.transform,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
