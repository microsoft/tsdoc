// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { TSDocConfiguration, TSDocTagDefinition, TSDocTagSyntaxKind } from '@microsoft/tsdoc';
import * as path from 'path';

import { TSDocConfigFile } from '../TSDocConfigFile';

function getRelativePath(testPath: string): string {
  return path.relative(__dirname, testPath).split('\\').join('/');
}

expect.addSnapshotSerializer({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  test(value: any) {
    return value instanceof TSDocConfigFile;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  print(value: unknown, print: (value: any) => string, indent: any, options: any, colors: any): any {
    const configFile: TSDocConfigFile = value as TSDocConfigFile;
    return print({
      tsdocSchema: configFile.tsdocSchema,
      filePath: getRelativePath(configFile.filePath),
      fileNotFound: configFile.fileNotFound,
      extendsPaths: configFile.extendsPaths,
      extendsFiles: configFile.extendsFiles,
      noStandardTags: configFile.noStandardTags,
      tagDefinitions: configFile.tagDefinitions,
      supportForTags: Array.from(configFile.supportForTags).map(([tagName, supported]) => ({
        tagName,
        supported
      })),
      messages: configFile.log.messages,
      supportedHtmlElements: configFile.supportedHtmlElements,
      reportUnsupportedHtmlElements: configFile.reportUnsupportedHtmlElements
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
      "noStandardTags": undefined,
      "reportUnsupportedHtmlElements": undefined,
      "supportForTags": Array [],
      "supportedHtmlElements": undefined,
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
      "noStandardTags": undefined,
      "reportUnsupportedHtmlElements": undefined,
      "supportForTags": Array [],
      "supportedHtmlElements": undefined,
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
          "noStandardTags": undefined,
          "reportUnsupportedHtmlElements": undefined,
          "supportForTags": Array [
            Object {
              "supported": true,
              "tagName": "@base1",
            },
          ],
          "supportedHtmlElements": undefined,
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
          "noStandardTags": undefined,
          "reportUnsupportedHtmlElements": undefined,
          "supportForTags": Array [
            Object {
              "supported": false,
              "tagName": "@base2",
            },
          ],
          "supportedHtmlElements": undefined,
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
      "noStandardTags": undefined,
      "reportUnsupportedHtmlElements": undefined,
      "supportForTags": Array [
        Object {
          "supported": true,
          "tagName": "@base2",
        },
      ],
      "supportedHtmlElements": undefined,
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
          "noStandardTags": undefined,
          "reportUnsupportedHtmlElements": undefined,
          "supportForTags": Array [],
          "supportedHtmlElements": undefined,
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
      "noStandardTags": undefined,
      "reportUnsupportedHtmlElements": undefined,
      "supportForTags": Array [],
      "supportedHtmlElements": undefined,
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

test('Re-serialize p3', () => {
  const configFile: TSDocConfigFile = TSDocConfigFile.loadForFolder(path.join(__dirname, 'assets/p3'));
  expect(configFile.hasErrors).toBe(false);

  // This is the data from p3/tsdoc.json, ignoring its "extends" field.
  expect(configFile.saveToObject()).toMatchInlineSnapshot(`
    Object {
      "$schema": "https://developer.microsoft.com/json-schemas/tsdoc/v0/tsdoc.schema.json",
      "supportForTags": Object {
        "@base2": true,
      },
      "tagDefinitions": Array [
        Object {
          "syntaxKind": "modifier",
          "tagName": "@root",
        },
      ],
    }
  `);
});

test('Re-serialize p3 without defaults', () => {
  const parserConfiguration: TSDocConfiguration = new TSDocConfiguration();
  parserConfiguration.clear(true);

  const defaultsConfigFile: TSDocConfigFile = TSDocConfigFile.loadFromParser(parserConfiguration);
  expect(defaultsConfigFile.hasErrors).toBe(false);

  // This is the default configuration created by the TSDocConfigFile constructor.
  expect(defaultsConfigFile.saveToObject()).toMatchInlineSnapshot(`
    Object {
      "$schema": "https://developer.microsoft.com/json-schemas/tsdoc/v0/tsdoc.schema.json",
      "noStandardTags": true,
      "reportUnsupportedHtmlElements": false,
    }
  `);

  const configFile: TSDocConfigFile = TSDocConfigFile.loadForFolder(path.join(__dirname, 'assets/p3'));
  expect(configFile.hasErrors).toBe(false);
  configFile.noStandardTags = true;
  configFile.configureParser(parserConfiguration);

  const mergedConfigFile: TSDocConfigFile = TSDocConfigFile.loadFromParser(parserConfiguration);

  // This is the result of merging p3/tsdoc.json, tsdoc-base1.json, tsdoc-base2.json, and
  // the TSDocConfiguration defaults.
  expect(mergedConfigFile.saveToObject()).toMatchInlineSnapshot(`
    Object {
      "$schema": "https://developer.microsoft.com/json-schemas/tsdoc/v0/tsdoc.schema.json",
      "noStandardTags": true,
      "reportUnsupportedHtmlElements": false,
      "supportForTags": Object {
        "@base1": true,
        "@base2": true,
      },
      "tagDefinitions": Array [
        Object {
          "syntaxKind": "modifier",
          "tagName": "@base1",
        },
        Object {
          "syntaxKind": "modifier",
          "tagName": "@base2",
        },
        Object {
          "syntaxKind": "modifier",
          "tagName": "@root",
        },
      ],
    }
  `);
});

test('Re-serialize p3 with defaults', () => {
  const parserConfiguration: TSDocConfiguration = new TSDocConfiguration();

  const defaultsConfigFile: TSDocConfigFile = TSDocConfigFile.loadFromParser(parserConfiguration);
  expect(defaultsConfigFile.hasErrors).toBe(false);

  // This is the default configuration created by the TSDocConfigFile constructor.
  expect(defaultsConfigFile.saveToObject()).toMatchInlineSnapshot(`
    Object {
      "$schema": "https://developer.microsoft.com/json-schemas/tsdoc/v0/tsdoc.schema.json",
      "noStandardTags": true,
      "reportUnsupportedHtmlElements": false,
      "tagDefinitions": Array [
        Object {
          "syntaxKind": "modifier",
          "tagName": "@alpha",
        },
        Object {
          "syntaxKind": "modifier",
          "tagName": "@beta",
        },
        Object {
          "syntaxKind": "block",
          "tagName": "@defaultValue",
        },
        Object {
          "allowMultiple": true,
          "syntaxKind": "block",
          "tagName": "@decorator",
        },
        Object {
          "syntaxKind": "block",
          "tagName": "@deprecated",
        },
        Object {
          "syntaxKind": "modifier",
          "tagName": "@eventProperty",
        },
        Object {
          "allowMultiple": true,
          "syntaxKind": "block",
          "tagName": "@example",
        },
        Object {
          "syntaxKind": "modifier",
          "tagName": "@experimental",
        },
        Object {
          "syntaxKind": "inline",
          "tagName": "@inheritDoc",
        },
        Object {
          "syntaxKind": "modifier",
          "tagName": "@internal",
        },
        Object {
          "syntaxKind": "inline",
          "tagName": "@label",
        },
        Object {
          "allowMultiple": true,
          "syntaxKind": "inline",
          "tagName": "@link",
        },
        Object {
          "syntaxKind": "modifier",
          "tagName": "@override",
        },
        Object {
          "syntaxKind": "modifier",
          "tagName": "@packageDocumentation",
        },
        Object {
          "allowMultiple": true,
          "syntaxKind": "block",
          "tagName": "@param",
        },
        Object {
          "syntaxKind": "block",
          "tagName": "@privateRemarks",
        },
        Object {
          "syntaxKind": "modifier",
          "tagName": "@public",
        },
        Object {
          "syntaxKind": "modifier",
          "tagName": "@readonly",
        },
        Object {
          "syntaxKind": "block",
          "tagName": "@remarks",
        },
        Object {
          "syntaxKind": "block",
          "tagName": "@returns",
        },
        Object {
          "syntaxKind": "modifier",
          "tagName": "@sealed",
        },
        Object {
          "syntaxKind": "block",
          "tagName": "@see",
        },
        Object {
          "allowMultiple": true,
          "syntaxKind": "block",
          "tagName": "@throws",
        },
        Object {
          "allowMultiple": true,
          "syntaxKind": "block",
          "tagName": "@typeParam",
        },
        Object {
          "syntaxKind": "modifier",
          "tagName": "@virtual",
        },
      ],
    }
  `);

  const configFile: TSDocConfigFile = TSDocConfigFile.loadForFolder(path.join(__dirname, 'assets/p3'));
  expect(configFile.hasErrors).toBe(false);
  configFile.configureParser(parserConfiguration);

  const mergedConfigFile: TSDocConfigFile = TSDocConfigFile.loadFromParser(parserConfiguration);

  // This is the result of merging p3/tsdoc.json, tsdoc-base1.json, tsdoc-base2.json, and
  // the TSDocConfiguration defaults.
  expect(mergedConfigFile.saveToObject()).toMatchInlineSnapshot(`
    Object {
      "$schema": "https://developer.microsoft.com/json-schemas/tsdoc/v0/tsdoc.schema.json",
      "noStandardTags": true,
      "reportUnsupportedHtmlElements": false,
      "supportForTags": Object {
        "@base1": true,
        "@base2": true,
      },
      "tagDefinitions": Array [
        Object {
          "syntaxKind": "modifier",
          "tagName": "@alpha",
        },
        Object {
          "syntaxKind": "modifier",
          "tagName": "@beta",
        },
        Object {
          "syntaxKind": "block",
          "tagName": "@defaultValue",
        },
        Object {
          "allowMultiple": true,
          "syntaxKind": "block",
          "tagName": "@decorator",
        },
        Object {
          "syntaxKind": "block",
          "tagName": "@deprecated",
        },
        Object {
          "syntaxKind": "modifier",
          "tagName": "@eventProperty",
        },
        Object {
          "allowMultiple": true,
          "syntaxKind": "block",
          "tagName": "@example",
        },
        Object {
          "syntaxKind": "modifier",
          "tagName": "@experimental",
        },
        Object {
          "syntaxKind": "inline",
          "tagName": "@inheritDoc",
        },
        Object {
          "syntaxKind": "modifier",
          "tagName": "@internal",
        },
        Object {
          "syntaxKind": "inline",
          "tagName": "@label",
        },
        Object {
          "allowMultiple": true,
          "syntaxKind": "inline",
          "tagName": "@link",
        },
        Object {
          "syntaxKind": "modifier",
          "tagName": "@override",
        },
        Object {
          "syntaxKind": "modifier",
          "tagName": "@packageDocumentation",
        },
        Object {
          "allowMultiple": true,
          "syntaxKind": "block",
          "tagName": "@param",
        },
        Object {
          "syntaxKind": "block",
          "tagName": "@privateRemarks",
        },
        Object {
          "syntaxKind": "modifier",
          "tagName": "@public",
        },
        Object {
          "syntaxKind": "modifier",
          "tagName": "@readonly",
        },
        Object {
          "syntaxKind": "block",
          "tagName": "@remarks",
        },
        Object {
          "syntaxKind": "block",
          "tagName": "@returns",
        },
        Object {
          "syntaxKind": "modifier",
          "tagName": "@sealed",
        },
        Object {
          "syntaxKind": "block",
          "tagName": "@see",
        },
        Object {
          "allowMultiple": true,
          "syntaxKind": "block",
          "tagName": "@throws",
        },
        Object {
          "allowMultiple": true,
          "syntaxKind": "block",
          "tagName": "@typeParam",
        },
        Object {
          "syntaxKind": "modifier",
          "tagName": "@virtual",
        },
        Object {
          "syntaxKind": "modifier",
          "tagName": "@base1",
        },
        Object {
          "syntaxKind": "modifier",
          "tagName": "@base2",
        },
        Object {
          "syntaxKind": "modifier",
          "tagName": "@root",
        },
      ],
    }
  `);
});

test('Test noStandardTags for p5', () => {
  const configFile: TSDocConfigFile = TSDocConfigFile.loadForFolder(path.join(__dirname, 'assets/p5'));
  expect(configFile.hasErrors).toBe(false);

  const configuration: TSDocConfiguration = new TSDocConfiguration();
  configFile.configureParser(configuration);

  // noStandardTags=true because tsdoc-base2.json overrides tsdoc-base1.json, and tsdoc.json is undefined
  expect(configuration.tagDefinitions.length).toEqual(0);
});

test('Test noStandardTags for p6', () => {
  const configFile: TSDocConfigFile = TSDocConfigFile.loadForFolder(path.join(__dirname, 'assets/p6'));
  expect(configFile.hasErrors).toBe(false);

  const configuration: TSDocConfiguration = new TSDocConfiguration();
  configFile.configureParser(configuration);

  // noStandardTags=false  because tsdoc.json  overrides tsdoc-base1.json
  expect(configuration.tagDefinitions.length).toBeGreaterThan(0);
});

test('Test load p7', () => {
  expect(testLoadingFolder('assets/p7')).toMatchInlineSnapshot(`
    Object {
      "extendsFiles": Array [],
      "extendsPaths": Array [],
      "fileNotFound": false,
      "filePath": "assets/p7/tsdoc.json",
      "messages": Array [],
      "noStandardTags": undefined,
      "reportUnsupportedHtmlElements": undefined,
      "supportForTags": Array [],
      "supportedHtmlElements": Array [
        "b",
        "u",
      ],
      "tagDefinitions": Array [],
      "tsdocSchema": "https://developer.microsoft.com/json-schemas/tsdoc/v0/tsdoc.schema.json",
    }
  `);
});

test('p7 reportUnsupportedHtmlElements defaults to true when supportedHtmlElements is specified', () => {
  const configFile: TSDocConfigFile = TSDocConfigFile.loadForFolder(path.join(__dirname, 'assets/p7'));
  const flattened = new TSDocConfiguration();
  configFile.updateParser(flattened);
  expect(flattened.validation.reportUnsupportedHtmlElements).toEqual(true);
});

test('Test re-serialize p7', () => {
  const configFile: TSDocConfigFile = TSDocConfigFile.loadForFolder(path.join(__dirname, 'assets/p7'));
  expect(configFile.saveToObject()).toMatchInlineSnapshot(`
    Object {
      "$schema": "https://developer.microsoft.com/json-schemas/tsdoc/v0/tsdoc.schema.json",
      "supportedHtmlElements": Array [
        "b",
        "u",
      ],
    }
  `);
});

test('Test load p8', () => {
  expect(testLoadingFolder('assets/p8')).toMatchInlineSnapshot(`
    Object {
      "extendsFiles": Array [
        Object {
          "extendsFiles": Array [],
          "extendsPaths": Array [],
          "fileNotFound": false,
          "filePath": "assets/p8/base1/tsdoc-base1.json",
          "messages": Array [],
          "noStandardTags": undefined,
          "reportUnsupportedHtmlElements": undefined,
          "supportForTags": Array [],
          "supportedHtmlElements": Array [
            "span",
            "p",
          ],
          "tagDefinitions": Array [],
          "tsdocSchema": "https://developer.microsoft.com/json-schemas/tsdoc/v0/tsdoc.schema.json",
        },
      ],
      "extendsPaths": Array [
        "./base1/tsdoc-base1.json",
      ],
      "fileNotFound": false,
      "filePath": "assets/p8/tsdoc.json",
      "messages": Array [],
      "noStandardTags": undefined,
      "reportUnsupportedHtmlElements": undefined,
      "supportForTags": Array [],
      "supportedHtmlElements": Array [],
      "tagDefinitions": Array [],
      "tsdocSchema": "https://developer.microsoft.com/json-schemas/tsdoc/v0/tsdoc.schema.json",
    }
  `);
});

test('p8 supportedHtmlElements are not inherited when an empty array is specified', () => {
  const configFile: TSDocConfigFile = TSDocConfigFile.loadForFolder(path.join(__dirname, 'assets/p8'));
  const flattened = new TSDocConfiguration();
  configFile.updateParser(flattened);
  expect(flattened.supportedHtmlElements).toEqual([]);
});

test('Test re-serialize p8', () => {
  const configFile: TSDocConfigFile = TSDocConfigFile.loadForFolder(path.join(__dirname, 'assets/p8'));
  expect(configFile.saveToObject()).toMatchInlineSnapshot(`
    Object {
      "$schema": "https://developer.microsoft.com/json-schemas/tsdoc/v0/tsdoc.schema.json",
      "supportedHtmlElements": Array [],
    }
  `);
});

test('Test load p9', () => {
  expect(testLoadingFolder('assets/p9')).toMatchInlineSnapshot(`
    Object {
      "extendsFiles": Array [
        Object {
          "extendsFiles": Array [],
          "extendsPaths": Array [],
          "fileNotFound": false,
          "filePath": "assets/p9/base1/tsdoc-base1.json",
          "messages": Array [],
          "noStandardTags": undefined,
          "reportUnsupportedHtmlElements": true,
          "supportForTags": Array [],
          "supportedHtmlElements": Array [
            "span",
            "p",
          ],
          "tagDefinitions": Array [],
          "tsdocSchema": "https://developer.microsoft.com/json-schemas/tsdoc/v0/tsdoc.schema.json",
        },
      ],
      "extendsPaths": Array [
        "./base1/tsdoc-base1.json",
      ],
      "fileNotFound": false,
      "filePath": "assets/p9/tsdoc.json",
      "messages": Array [],
      "noStandardTags": undefined,
      "reportUnsupportedHtmlElements": false,
      "supportForTags": Array [],
      "supportedHtmlElements": undefined,
      "tagDefinitions": Array [],
      "tsdocSchema": "https://developer.microsoft.com/json-schemas/tsdoc/v0/tsdoc.schema.json",
    }
  `);
});

test('p9 supportedHtmlElements are inherited', () => {
  const configFile: TSDocConfigFile = TSDocConfigFile.loadForFolder(path.join(__dirname, 'assets/p9'));
  const flattened = new TSDocConfiguration();
  configFile.updateParser(flattened);
  expect(flattened.supportedHtmlElements).toEqual(['span', 'p']);
});

test('p9 reportUnsupportedHtmlElements is overridden by "true"', () => {
  const configFile: TSDocConfigFile = TSDocConfigFile.loadForFolder(path.join(__dirname, 'assets/p9'));
  const flattened = new TSDocConfiguration();
  configFile.updateParser(flattened);
  expect(flattened.validation.reportUnsupportedHtmlElements).toEqual(false);
});

test('Test re-serialize p9', () => {
  const configFile: TSDocConfigFile = TSDocConfigFile.loadForFolder(path.join(__dirname, 'assets/p9'));
  expect(configFile.saveToObject()).toMatchInlineSnapshot(`
    Object {
      "$schema": "https://developer.microsoft.com/json-schemas/tsdoc/v0/tsdoc.schema.json",
      "reportUnsupportedHtmlElements": false,
    }
  `);
});

test('p10 reportUnsupportedHtmlElements is overridden by "false"', () => {
  const configFile: TSDocConfigFile = TSDocConfigFile.loadForFolder(path.join(__dirname, 'assets/p10'));
  const flattened = new TSDocConfiguration();
  configFile.updateParser(flattened);
  expect(flattened.validation.reportUnsupportedHtmlElements).toEqual(true);
});

test('p11 reportUnsupportedHtmlElements is handled correctly with multiple parent configs', () => {
  const configFile: TSDocConfigFile = TSDocConfigFile.loadForFolder(path.join(__dirname, 'assets/p11'));
  const flattened = new TSDocConfiguration();
  configFile.updateParser(flattened);
  expect(flattened.validation.reportUnsupportedHtmlElements).toEqual(true);
});

test('p12 reportUnsupportedHtmlElements can be set to false, even when "supportedHtmlElements" is present', () => {
  const configFile: TSDocConfigFile = TSDocConfigFile.loadForFolder(path.join(__dirname, 'assets/p12'));
  const flattened = new TSDocConfiguration();
  configFile.updateParser(flattened);
  expect(flattened.validation.reportUnsupportedHtmlElements).toEqual(false);
});

test('Test loadFromObject()', () => {
  const configuration: TSDocConfiguration = new TSDocConfiguration();
  configuration.clear(true);

  configuration.addTagDefinitions([
    new TSDocTagDefinition({ syntaxKind: TSDocTagSyntaxKind.ModifierTag, tagName: '@tag1' }),
    new TSDocTagDefinition({
      syntaxKind: TSDocTagSyntaxKind.BlockTag,
      tagName: '@tag2',
      allowMultiple: true
    }),
    new TSDocTagDefinition({
      syntaxKind: TSDocTagSyntaxKind.InlineTag,
      tagName: '@tag3',
      allowMultiple: true
    })
  ]);

  configuration.setSupportForTag(configuration.tagDefinitions[0], true);

  const configFile: TSDocConfigFile = TSDocConfigFile.loadFromParser(configuration);
  expect(configFile.hasErrors).toBe(false);
  const jsonObject: unknown = configFile.saveToObject();

  const configFile2: TSDocConfigFile = TSDocConfigFile.loadFromObject(jsonObject);
  expect(configFile2.hasErrors).toBe(false);
  const jsonObject2: unknown = configFile2.saveToObject();

  expect(jsonObject2).toMatchInlineSnapshot(`
    Object {
      "$schema": "https://developer.microsoft.com/json-schemas/tsdoc/v0/tsdoc.schema.json",
      "noStandardTags": true,
      "reportUnsupportedHtmlElements": false,
      "supportForTags": Object {
        "@tag1": true,
      },
      "tagDefinitions": Array [
        Object {
          "syntaxKind": "modifier",
          "tagName": "@tag1",
        },
        Object {
          "allowMultiple": true,
          "syntaxKind": "block",
          "tagName": "@tag2",
        },
        Object {
          "allowMultiple": true,
          "syntaxKind": "inline",
          "tagName": "@tag3",
        },
      ],
    }
  `);

  expect(jsonObject2).toStrictEqual(jsonObject);
});

test('Test loadFromObject() with extends', () => {
  const configuration: TSDocConfiguration = new TSDocConfiguration();
  configuration.clear(true);

  const configFile: TSDocConfigFile = TSDocConfigFile.loadFromParser(configuration);
  expect(configFile.hasErrors).toBe(false);
  const jsonObject: unknown = configFile.saveToObject();

  // eslint-disable-next-line
  (jsonObject as any)['extends'] = ['./some-file.json'];

  expect(() => {
    TSDocConfigFile.loadFromObject(jsonObject);
  }).toThrowError('The "extends" field cannot be used with TSDocConfigFile.loadFromObject()');
});
