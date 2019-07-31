'use strict';

const child_process = require('child_process');
const path = require('path');

const production = process.argv.indexOf('--production') >= 0;
const baseDir = __dirname;

process.chdir(baseDir);

process.exitCode = 1;
try {
  child_process.execSync(path.join(baseDir, 'node_modules/.bin/rimraf')
    + ' ./lib/', { stdio: 'inherit' });

  console.log('-- TYPESCRIPT --\n');
  child_process.execSync(path.join(baseDir, 'node_modules/.bin/tsc'), { stdio: 'inherit' });

  console.log('-- ESLINT --\n');
  child_process.execSync(path.join(baseDir, 'node_modules/.bin/eslint')
    + ' src/**/*.{ts,tsx}',
    { stdio: 'inherit' });

  if (production) {
    console.log('-- JEST --\n');

    // Map stderr-->stdout because Jest weirdly writes to stderr during a successful run,
    // which the build tools (rightly so) interpret as an issue that should fail the build
    child_process.execSync(path.join(baseDir, 'node_modules/.bin/jest'), {
      stdio: [ 0, 1, 1 ]
    });
  }

  process.exitCode = 0;
} catch (e) {
  console.log('ERROR: ' + e.message);
}
