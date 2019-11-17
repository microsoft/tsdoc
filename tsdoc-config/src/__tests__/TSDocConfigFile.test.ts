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
  print(value: TSDocConfigFile, serialize: (value: any) => string, indent: (str: string) => string): any {
    return serialize({
      tsdocSchema: value.tsdocSchema,
      filePath: getRelativePath(value.filePath),
      fileNotFound: value.fileNotFound,
      extendsPaths: value.extendsPaths,
      extendsFiles: value.extendsFiles,
      tagDefinitions: value.tagDefinitions,
      messages: value.log.messages
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
      "fileNotFound": false,
      "filePath": "assets/p1/tsdoc.json",
      "messages": Array [],
      "tagDefinitions": Array [],
      "tsdocSchema": "https://developer.microsoft.com/json-schemas/tsdoc/v0/tsdoc.schema.json",
    }
  `);
});
test('Load p2', () => {
  expect(testLoadingFolder('assets/p2')).toMatchInlineSnapshot(`
    Object {
      "extendsFiles": Array [],
      "extendsPaths": Array [],
      "fileNotFound": true,
      "filePath": "assets/p2/tsdoc.json",
      "messages": Array [
        ParserMessage {
          "_text": undefined,
          "docNode": undefined,
          "messageId": "tsdoc-config-file-not-found",
          "textRange": TextRange {
            "buffer": "",
            "end": 0,
            "pos": 0,
          },
          "tokenSequence": undefined,
          "unformattedText": "File not found",
        },
      ],
      "tagDefinitions": Array [],
      "tsdocSchema": "",
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
          "fileNotFound": false,
          "filePath": "assets/p3/base1/tsdoc-base1.json",
          "messages": Array [],
          "tagDefinitions": Array [
            TSDocTagDefinition {
              "allowMultiple": false,
              "standardization": "None",
              "syntaxKind": 2,
              "tagName": "@base1",
              "tagNameWithUpperCase": "@BASE1",
            },
          ],
          "tsdocSchema": "https://developer.microsoft.com/json-schemas/tsdoc/v0/tsdoc.schema.json",
        },
        Object {
          "extendsFiles": Array [],
          "extendsPaths": Array [],
          "fileNotFound": false,
          "filePath": "assets/p3/base2/tsdoc-base2.json",
          "messages": Array [],
          "tagDefinitions": Array [
            TSDocTagDefinition {
              "allowMultiple": false,
              "standardization": "None",
              "syntaxKind": 2,
              "tagName": "@base2",
              "tagNameWithUpperCase": "@BASE2",
            },
          ],
          "tsdocSchema": "https://developer.microsoft.com/json-schemas/tsdoc/v0/tsdoc.schema.json",
        },
      ],
      "extendsPaths": Array [
        "./base1/tsdoc-base1.json",
        "./base2/tsdoc-base2.json",
      ],
      "fileNotFound": false,
      "filePath": "assets/p3/tsdoc.json",
      "messages": Array [],
      "tagDefinitions": Array [
        TSDocTagDefinition {
          "allowMultiple": false,
          "standardization": "None",
          "syntaxKind": 2,
          "tagName": "@root",
          "tagNameWithUpperCase": "@ROOT",
        },
      ],
      "tsdocSchema": "https://developer.microsoft.com/json-schemas/tsdoc/v0/tsdoc.schema.json",
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
          "fileNotFound": false,
          "filePath": "assets/p4/node_modules/example-lib/dist/tsdoc-example.json",
          "messages": Array [],
          "tagDefinitions": Array [
            TSDocTagDefinition {
              "allowMultiple": false,
              "standardization": "None",
              "syntaxKind": 2,
              "tagName": "@example",
              "tagNameWithUpperCase": "@EXAMPLE",
            },
          ],
          "tsdocSchema": "https://developer.microsoft.com/json-schemas/tsdoc/v0/tsdoc.schema.json",
        },
      ],
      "extendsPaths": Array [
        "example-lib/dist/tsdoc-example.json",
      ],
      "fileNotFound": false,
      "filePath": "assets/p4/tsdoc.json",
      "messages": Array [],
      "tagDefinitions": Array [
        TSDocTagDefinition {
          "allowMultiple": false,
          "standardization": "None",
          "syntaxKind": 2,
          "tagName": "@root",
          "tagNameWithUpperCase": "@ROOT",
        },
      ],
      "tsdocSchema": "https://developer.microsoft.com/json-schemas/tsdoc/v0/tsdoc.schema.json",
    }
  `);
});
