module.exports = function(source) {
  return source.replace(/\/\* *dev:start ?\*\/[\s\S]*?\* *dev:end *\*\//g, '')
};
