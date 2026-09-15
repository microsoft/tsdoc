// Deletes packed npm tarballs whose exact name@version is already published on the registry, so the
// downstream ESRP publish step only receives packages that actually need publishing.
//
// The bump pipeline packs every "shouldPublish" project via "rush publish --pack --include-all",
// which also packs packages whose version did not change in this bump. Publishing an already-present
// version would fail, so those tarballs are filtered out here (mirroring rushstack's
// "publish-cohort.js filter-packages" step).
//
// Usage:
//   node filter-unpublished-tarballs.js --packages-path <dir>

'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '--packages-path':
        args.packagesPath = argv[++i];
        break;
      default:
        throw new Error(`Unrecognized argument: ${arg}`);
    }
  }
  if (!args.packagesPath) {
    throw new Error('The --packages-path argument is required');
  }
  return args;
}

// Reads "package/package.json" out of a packed npm tarball without extracting the whole archive.
function readPackageManifest(tarballPath) {
  const json = execFileSync('tar', ['-xzOf', tarballPath, 'package/package.json'], {
    encoding: 'utf8'
  });
  return JSON.parse(json);
}

// Returns true if the exact name@version is already present on the registry.
function isAlreadyPublished(name, version) {
  try {
    const output = execFileSync('npm', ['view', `${name}@${version}`, 'version'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
    return output === version;
  } catch (error) {
    // "npm view" exits non-zero (E404) when the package or version does not exist yet.
    return false;
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  const packagesPath = path.resolve(args.packagesPath);
  if (!fs.existsSync(packagesPath)) {
    throw new Error(`Packages path does not exist: ${packagesPath}`);
  }

  const tarballs = fs
    .readdirSync(packagesPath)
    .filter((fileName) => fileName.endsWith('.tgz'))
    .sort();

  if (tarballs.length === 0) {
    console.log(`No tarballs found in ${packagesPath}; nothing to filter.`);
    return;
  }

  let keptCount = 0;
  let removedCount = 0;

  for (const tarball of tarballs) {
    const tarballPath = path.join(packagesPath, tarball);
    const { name, version } = readPackageManifest(tarballPath);
    const id = `${name}@${version}`;

    if (isAlreadyPublished(name, version)) {
      console.log(`Removing ${id} (already published).`);
      fs.unlinkSync(tarballPath);
      removedCount++;
    } else {
      console.log(`Keeping ${id} (not yet published).`);
      keptCount++;
    }
  }

  console.log(
    `Done. Kept ${keptCount} package(s) to publish; removed ${removedCount} already-published package(s).`
  );
}

try {
  main();
} catch (error) {
  console.error(`##[error]${error.message}`);
  process.exit(1);
}
