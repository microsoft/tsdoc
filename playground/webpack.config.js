'use strict';

const { generateBuildWebpackConfiguration } = require('./webpack.shared.config');

// module.exports = function(env) {
//   return generateBuildWebpackConfiguration(env);
// }
module.exports = generateBuildWebpackConfiguration({
  production: true
});
