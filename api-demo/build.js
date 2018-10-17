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

  console.log('-- TSLINT --\n');
  child_process.execSync(path.join(baseDir, 'node_modules/.bin/tslint')
    + ' --config tslint.json --project .',
    { stdio: 'inherit' });

  process.exitCode = 0;
} catch (e) {
  console.log('ERROR: ' + e.message);
}

