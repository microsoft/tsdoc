import * as path from 'path';

import { TSDocConfigFile } from '../TSDocConfigFile';
import { ConfigLoader } from '../ConfigLoader';

function getRelativePath(testPath: string): string {
  return path
    .relative(__dirname, testPath)
    .split('\\')
    .join('/');
}

expect.addSnapshotSerializer({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  test(value: any) {
    return value instanceof TSDocConfigFile;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  print(value: any, serialize: (value: any) => string, indent: (str: string) => string): any {
    return serialize({
      tsdocSchema: value.tsdocSchema,
      filePath: getRelativePath(value.filePath),
      extendsPaths: value.extendsPaths,
      extendsFiles: value.extendsFiles,
      tagDefinitions: value.tagDefinitions
    });
  }
});

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
  expect(configFile).toMatchInlineSnapshot(`
    Object {
      "extendsFiles": Array [],
      "extendsPaths": Array [],
      "filePath": "assets/p5/tsdoc-config.json",
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
      "tsdocSchema": "https://developer.microsoft.com/json-schemas/tsdoc/v1/tsdoc-config.schema.json",
    }
  `);
});
test('Load p6', () => {
  const configFile: TSDocConfigFile | undefined = ConfigLoader.tryLoadFromPackageFolder(
    path.join(__dirname, 'assets/p6')
  );
  expect(configFile).toMatchInlineSnapshot(`
    Object {
      "extendsFiles": Array [
        Object {
          "extendsFiles": Array [],
          "extendsPaths": Array [],
          "filePath": "assets/p6/base1/tsdoc-config.json",
          "tagDefinitions": Array [
            TSDocTagDefinition {
              "allowMultiple": false,
              "standardization": "None",
              "syntaxKind": 2,
              "tagName": "@base1",
              "tagNameWithUpperCase": "@BASE1",
            },
          ],
          "tsdocSchema": "https://developer.microsoft.com/json-schemas/tsdoc/v1/tsdoc-config.schema.json",
        },
        Object {
          "extendsFiles": Array [],
          "extendsPaths": Array [],
          "filePath": "assets/p6/base2/tsdoc-config.json",
          "tagDefinitions": Array [
            TSDocTagDefinition {
              "allowMultiple": false,
              "standardization": "None",
              "syntaxKind": 2,
              "tagName": "@base2",
              "tagNameWithUpperCase": "@BASE2",
            },
          ],
          "tsdocSchema": "https://developer.microsoft.com/json-schemas/tsdoc/v1/tsdoc-config.schema.json",
        },
      ],
      "extendsPaths": Array [
        "./base1/tsdoc-config.json",
        "./base2/tsdoc-config.json",
      ],
      "filePath": "assets/p6/tsdoc-config.json",
      "tagDefinitions": Array [
        TSDocTagDefinition {
          "allowMultiple": false,
          "standardization": "None",
          "syntaxKind": 2,
          "tagName": "@root",
          "tagNameWithUpperCase": "@ROOT",
        },
      ],
      "tsdocSchema": "https://developer.microsoft.com/json-schemas/tsdoc/v1/tsdoc-config.schema.json",
    }
  `);
});
