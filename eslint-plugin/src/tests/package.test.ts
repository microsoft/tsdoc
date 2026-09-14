// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import * as fs from 'node:fs';
import * as path from 'node:path';

interface IPackageJson {
  dependencies?: { [name: string]: string };
  peerDependencies?: { [name: string]: string };
}

function getPackageName(moduleSpecifier: string): string {
  if (moduleSpecifier.startsWith('@')) {
    return moduleSpecifier.split('/').slice(0, 2).join('/');
  }
  return moduleSpecifier.split('/')[0];
}

function collectImportedPackageNames(sourceText: string): string[] {
  const importRegExp: RegExp = /(?:from|import)\s+['"]([^'"]+)['"]/g;
  const packageNames: string[] = [];
  for (const regExpMatch of sourceText.matchAll(importRegExp)) {
    const moduleSpecifier: string | undefined = regExpMatch[1];
    if (!moduleSpecifier || moduleSpecifier.startsWith('.') || moduleSpecifier.startsWith('node:')) {
      continue;
    }
    packageNames.push(getPackageName(moduleSpecifier));
  }
  return packageNames;
}

test('published typings import only packages declared as dependencies or peerDependencies', () => {
  const packageJsonPath: string = path.join(__dirname, '..', '..', 'package.json');
  const packageJsonText: string = fs.readFileSync(packageJsonPath, { encoding: 'utf8' });
  const packageJson: IPackageJson = JSON.parse(packageJsonText) as IPackageJson;

  const declaredPackageNames: Set<string> = new Set<string>([
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.peerDependencies ?? {})
  ]);

  const typingsPath: string = path.join(__dirname, '..', 'index.d.ts');
  const typingsText: string = fs.readFileSync(typingsPath, { encoding: 'utf8' });
  const missingPackageNames: string[] = collectImportedPackageNames(typingsText).filter(
    (packageName: string) => !declaredPackageNames.has(packageName)
  );

  expect(missingPackageNames).toEqual([]);
});
