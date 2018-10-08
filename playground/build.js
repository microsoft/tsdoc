'use strict';

const productionIndex = process.argv.indexOf('--production');
if (productionIndex !== -1) {
  process.argv[productionIndex] = '--env.production';
}

require('webpack-cli/bin/cli');
