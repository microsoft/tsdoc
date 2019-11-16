import * as path from 'path';

import { TSDocConfigFile } from '../TSDocConfigFile';

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

function testLoadingFolder(assetPath: string): TSDocConfigFile {
  return TSDocConfigFile.loadForFolder(path.join(__dirname, assetPath));
}

test('Load p1', () => {
  expect(testLoadingFolder('assets/p1')).toMatchInlineSnapshot(`
    Object {
      "extendsFiles": Array [],
      "extendsPaths": Array [],
      "filePath": "assets/p1/tsdocconfig.json",
      "tagDefinitions": Array [],
      "tsdocSchema": "https://developer.microsoft.com/json-schemas/tsdoc/v1/tsdocconfig.schema.json",
    }
  `);
});
test('Load p2', () => {
  expect(testLoadingFolder('assets/p2')).toMatchInlineSnapshot(`
    Object {
      "extendsFiles": Array [],
      "extendsPaths": Array [],
      "filePath": "assets/p2/tsdocconfig.json",
      "tagDefinitions": Array [],
      "tsdocSchema": "https://developer.microsoft.com/json-schemas/tsdoc/v1/tsdocconfig.schema.json",
    }
  `);
});
test('Load p3', () => {
  expect(testLoadingFolder('assets/p3')).toMatchInlineSnapshot(`
    Object {
      "extendsFiles": Array [
        Object {
          "extendsFiles": Array [],
          "extendsPaths": Array [],
          "filePath": "assets/p3/base1/tsdocconfig-base1.json",
          "tagDefinitions": Array [
            TSDocTagDefinition {
              "allowMultiple": false,
              "standardization": "None",
              "syntaxKind": 2,
              "tagName": "@base1",
              "tagNameWithUpperCase": "@BASE1",
            },
          ],
          "tsdocSchema": "https://developer.microsoft.com/json-schemas/tsdoc/v1/tsdocconfig.schema.json",
        },
        Object {
          "extendsFiles": Array [],
          "extendsPaths": Array [],
          "filePath": "assets/p3/base2/tsdocconfig-base2.json",
          "tagDefinitions": Array [
            TSDocTagDefinition {
              "allowMultiple": false,
              "standardization": "None",
              "syntaxKind": 2,
              "tagName": "@base2",
              "tagNameWithUpperCase": "@BASE2",
            },
          ],
          "tsdocSchema": "https://developer.microsoft.com/json-schemas/tsdoc/v1/tsdocconfig.schema.json",
        },
      ],
      "extendsPaths": Array [
        "./base1/tsdocconfig-base1.json",
        "./base2/tsdocconfig-base2.json",
      ],
      "filePath": "assets/p3/tsdocconfig.json",
      "tagDefinitions": Array [
        TSDocTagDefinition {
          "allowMultiple": false,
          "standardization": "None",
          "syntaxKind": 2,
          "tagName": "@root",
          "tagNameWithUpperCase": "@ROOT",
        },
      ],
      "tsdocSchema": "https://developer.microsoft.com/json-schemas/tsdoc/v1/tsdocconfig.schema.json",
    }
  `);
});
test('Load p4', () => {
  expect(testLoadingFolder('assets/p4')).toMatchInlineSnapshot(`
    Object {
      "extendsFiles": Array [
        Object {
          "extendsFiles": Array [],
          "extendsPaths": Array [],
          "filePath": "assets/p4/node_modules/example-lib/dist/tsdocconfig-example.json",
          "tagDefinitions": Array [
            TSDocTagDefinition {
              "allowMultiple": false,
              "standardization": "None",
              "syntaxKind": 2,
              "tagName": "@example",
              "tagNameWithUpperCase": "@EXAMPLE",
            },
          ],
          "tsdocSchema": "https://developer.microsoft.com/json-schemas/tsdoc/v1/tsdocconfig.schema.json",
        },
      ],
      "extendsPaths": Array [
        "example-lib/dist/tsdocconfig-example.json",
      ],
      "filePath": "assets/p4/tsdocconfig.json",
      "tagDefinitions": Array [
        TSDocTagDefinition {
          "allowMultiple": false,
          "standardization": "None",
          "syntaxKind": 2,
          "tagName": "@root",
          "tagNameWithUpperCase": "@ROOT",
        },
      ],
      "tsdocSchema": "https://developer.microsoft.com/json-schemas/tsdoc/v1/tsdocconfig.schema.json",
    }
  `);
});
