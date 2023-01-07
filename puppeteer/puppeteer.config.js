const config = {
  launch: {
    timeout: 30000,
    dumpio: true,
  }
}

const isDebugMode = process.argv.includes('--debug');

if (isDebugMode) {
  config.launch = {
    ...config.launch,
    headless: false,
    slowMo: 10,
    devtools: true,
    args: ['--start-maximized'],
  };
}

module.exports = config;
