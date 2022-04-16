const argvStart = process.argv.slice(0, 2);
const argvEnd = process.argv.slice(2);
process.argv = [...argvStart, ...argvEnd, '--stats'];

const rewire = require("rewire");
const defaults = rewire("react-scripts/scripts/build.js");
const config = defaults.__get__("config");
const path = require('path');

config.module.rules.push({
  test: /\.(js|ts|jsx|tsx)?$/,
  use: [{
    loader: path.resolve('./remove-dev.loader.js'),
  }]
});
