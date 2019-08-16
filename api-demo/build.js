'use strict';

const child_process = require('child_process');
const path = require('path');

const baseDir = __dirname;

process.exitCode = 1;

process.chdir(baseDir);

try {
  child_process.execSync(path.join(baseDir, 'node_modules/.bin/rimraf')
    + ' ./lib/', { stdio: 'inherit' });

  console.log('-- TYPESCRIPT --\n');
  child_process.execSync(path.join(baseDir, 'node_modules/.bin/tsc'), { stdio: 'inherit' });

  console.log('-- ESLINT --\n');
  child_process.execSync(path.join(baseDir, 'node_modules/.bin/eslint')
    + ' -f unix src/**/*.{ts,tsx}',
    { stdio: 'inherit' });

  process.exitCode = 0;
} catch (e) {
  console.log('ERROR: ' + e.message);
}
