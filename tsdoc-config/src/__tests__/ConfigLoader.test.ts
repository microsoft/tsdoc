import * as path from 'path';

import { TSDocConfigFile } from '../TSDocConfigFile';
import { ConfigLoader } from '../ConfigLoader';

function getRelativePath(testPath: string): string {
  return path
    .relative(__dirname, testPath)
    .split('\\')
    .join('/');
}

test('Load p1', () => {
  const configFile: TSDocConfigFile | undefined = ConfigLoader.tryLoadFromPackageFolder(
    path.join(__dirname, 'assets/p1')
  );
  expect(configFile).toBeDefined();
  expect(getRelativePath(configFile!.filePath)).toEqual('assets/p1/folder/tsdoc-config.json');
});
test('Load p2', () => {
  const configFile: TSDocConfigFile | undefined = ConfigLoader.tryLoadFromPackageFolder(
    path.join(__dirname, 'assets/p2')
  );
  expect(configFile).toBeDefined();
  expect(getRelativePath(configFile!.filePath)).toEqual('assets/p2/folder/tsdoc-config.json');
});
test('Load p3', () => {
  const configFile: TSDocConfigFile | undefined = ConfigLoader.tryLoadFromPackageFolder(
    path.join(__dirname, 'assets/p3')
  );
  expect(configFile).toBeDefined();
  expect(getRelativePath(configFile!.filePath)).toEqual('assets/p3/folder/tsdoc-config.json');
});
test('Load p4', () => {
  const configFile: TSDocConfigFile | undefined = ConfigLoader.tryLoadFromPackageFolder(
    path.join(__dirname, 'assets/p4')
  );
  expect(configFile).toBeDefined();
  expect(getRelativePath(configFile!.filePath)).toEqual('assets/p4/tsdoc-config.json');
});
test('Load p5', () => {
  const configFile: TSDocConfigFile | undefined = ConfigLoader.tryLoadFromPackageFolder(
    path.join(__dirname, 'assets/p5')
  );
  expect(configFile).toMatchInlineSnapshot(
    { filePath: expect.any(String) },
    `
    Object {
      "extends": Array [],
      "filePath": Any<String>,
      "tagDefinitions": Array [
        TSDocTagDefinition {
          "allowMultiple": true,
          "standardization": "None",
          "syntaxKind": 0,
          "tagName": "@myInlineTag",
          "tagNameWithUpperCase": "@MYINLINETAG",
        },
        TSDocTagDefinition {
          "allowMultiple": false,
          "standardization": "None",
          "syntaxKind": 1,
          "tagName": "@myBlockTag",
          "tagNameWithUpperCase": "@MYBLOCKTAG",
        },
        TSDocTagDefinition {
          "allowMultiple": false,
          "standardization": "None",
          "syntaxKind": 2,
          "tagName": "@myModifierTag",
          "tagNameWithUpperCase": "@MYMODIFIERTAG",
        },
      ],
      "tsdocVersion": "0.12",
    }
  `
  );
});
