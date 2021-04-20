import * as path from 'path';

import { TSDocConfigFile } from '../TSDocConfigFile';

interface ISnapshot {
  _0_filePath: string;
  _1_fileNotFound: boolean;
  _2_hasErrors: boolean;
  _3_errorSummary: string;
  _4_log: string[];
  _5_extends: ISnapshot[];
}

// To make the unit tests deterministic, we need to replace all OS-dependent absolute paths
// with OS-independent paths that are relative to the unit test folder.
function makeStablePath(testPath: string): string {
  if (testPath.length === 0) {
    return '';
  }
  return '.../' + path.relative(__dirname, testPath).split('\\').join('/');
}

// Build a map from absolute path --> stable path, for each TSDocConfigFile.filePath value
function buildStablePathMap(stablePathMap: Map<string, string>, configFile: TSDocConfigFile): void {
  if (!stablePathMap.has(configFile.filePath)) {
    stablePathMap.set(configFile.filePath, makeStablePath(configFile.filePath));
  }
  for (const extendsFile of configFile.extendsFiles) {
    buildStablePathMap(stablePathMap, extendsFile);
  }
}

// Search and replace all absolute paths with the corresponding stable path.
// For example, "Found C:\A\B\C.txt in C:\A\D\E.txt" becomes "Found .../B/C.txt in .../D/E.txt".
function convertToStablePaths(text: string, stablePathMap: Map<string, string>): string {
  for (const pair of Array.from(stablePathMap.entries())) {
    text = text.split(pair[0]).join(pair[1]);
  }
  return text;
}

function createSnapshot(configFile: TSDocConfigFile, pathFixupMap: Map<string, string>): ISnapshot {
  return {
    _0_filePath: convertToStablePaths(configFile.filePath, pathFixupMap),
    _1_fileNotFound: configFile.fileNotFound,
    _2_hasErrors: configFile.hasErrors,
    _4_log: configFile.log.messages.map((x) => `[${x.messageId}] ${convertToStablePaths(x.text, pathFixupMap)}`),
    _5_extends: configFile.extendsFiles.map((x) => createSnapshot(x, pathFixupMap)),
    _3_errorSummary: convertToStablePaths(configFile.getErrorSummary(), pathFixupMap),
  };
}

function testLoadingFolder(assetPath: string): ISnapshot {
  const configFile: TSDocConfigFile = TSDocConfigFile.loadForFolder(path.join(__dirname, assetPath));

  const pathFixupMap: Map<string, string> = new Map();
  buildStablePathMap(pathFixupMap, configFile);

  return createSnapshot(configFile, pathFixupMap);
}

test('Load e1', () => {
  expect(testLoadingFolder('assets/e1')).toMatchInlineSnapshot(`
    Object {
      "_0_filePath": ".../assets/e1/tsdoc.json",
      "_1_fileNotFound": false,
      "_2_hasErrors": true,
      "_3_errorSummary": "Error encountered for .../assets/e1/tsdoc.json:
      Error loading config file: data should NOT have additional properties
    ",
      "_4_log": Array [
        "[tsdoc-config-schema-error] Error loading config file: data should NOT have additional properties",
      ],
      "_5_extends": Array [],
    }
  `);
});

test('Load e2', () => {
  expect(testLoadingFolder('assets/e2')).toMatchInlineSnapshot(`
    Object {
      "_0_filePath": ".../assets/e2/tsdoc.json",
      "_1_fileNotFound": false,
      "_2_hasErrors": true,
      "_3_errorSummary": "Error encountered for .../assets/e2/tsdoc.json:
      Error parsing JSON input: Unexpected token '\\\\n' at 3:12
      \\"invalid
              ^
    ",
      "_4_log": Array [
        "[tsdoc-config-invalid-json] Error parsing JSON input: Unexpected token '\\\\n' at 3:12
      \\"invalid
              ^",
      ],
      "_5_extends": Array [],
    }
  `);
});

test('Load e3', () => {
  expect(testLoadingFolder('assets/e3')).toMatchInlineSnapshot(`
    Object {
      "_0_filePath": ".../assets/e3/tsdoc.json",
      "_1_fileNotFound": false,
      "_2_hasErrors": true,
      "_3_errorSummary": "Error encountered for .../assets/e3/tsdoc.json:
      Unsupported JSON \\"$schema\\" value; expecting \\"https://developer.microsoft.com/json-schemas/tsdoc/v0/tsdoc.schema.json\\"
    ",
      "_4_log": Array [
        "[tsdoc-config-unsupported-schema] Unsupported JSON \\"$schema\\" value; expecting \\"https://developer.microsoft.com/json-schemas/tsdoc/v0/tsdoc.schema.json\\"",
      ],
      "_5_extends": Array [],
    }
  `);
});

test('Load e4', () => {
  expect(testLoadingFolder('assets/e4')).toMatchInlineSnapshot(`
    Object {
      "_0_filePath": ".../assets/e4/tsdoc.json",
      "_1_fileNotFound": false,
      "_2_hasErrors": true,
      "_3_errorSummary": "Error encountered for .../assets/e4/tsdoc.json:
      The \\"tagDefinitions\\" field specifies more than one tag with the name \\"@dupe\\"
    ",
      "_4_log": Array [
        "[tsdoc-config-duplicate-tag-name] The \\"tagDefinitions\\" field specifies more than one tag with the name \\"@dupe\\"",
      ],
      "_5_extends": Array [],
    }
  `);
});

test('Load e5', () => {
  expect(testLoadingFolder('assets/e5')).toMatchInlineSnapshot(`
    Object {
      "_0_filePath": ".../assets/e5/tsdoc.json",
      "_1_fileNotFound": false,
      "_2_hasErrors": true,
      "_3_errorSummary": "Error encountered for .../assets/e5/tsdoc-a.json:
      Circular reference encountered for \\"extends\\" field of \\".../assets/e5/tsdoc-b.json\\"

    Error encountered for .../assets/e5/tsdoc-c.json:
      Error loading config file: data should NOT have additional properties
    ",
      "_4_log": Array [],
      "_5_extends": Array [
        Object {
          "_0_filePath": ".../assets/e5/tsdoc-a.json",
          "_1_fileNotFound": false,
          "_2_hasErrors": true,
          "_3_errorSummary": "Error encountered for .../assets/e5/tsdoc-a.json:
      Circular reference encountered for \\"extends\\" field of \\".../assets/e5/tsdoc-b.json\\"

    Error encountered for .../assets/e5/tsdoc-c.json:
      Error loading config file: data should NOT have additional properties
    ",
          "_4_log": Array [],
          "_5_extends": Array [
            Object {
              "_0_filePath": ".../assets/e5/tsdoc-b.json",
              "_1_fileNotFound": false,
              "_2_hasErrors": true,
              "_3_errorSummary": "Error encountered for .../assets/e5/tsdoc-a.json:
      Circular reference encountered for \\"extends\\" field of \\".../assets/e5/tsdoc-b.json\\"
    ",
              "_4_log": Array [],
              "_5_extends": Array [
                Object {
                  "_0_filePath": ".../assets/e5/tsdoc-a.json",
                  "_1_fileNotFound": false,
                  "_2_hasErrors": true,
                  "_3_errorSummary": "Error encountered for .../assets/e5/tsdoc-a.json:
      Circular reference encountered for \\"extends\\" field of \\".../assets/e5/tsdoc-b.json\\"
    ",
                  "_4_log": Array [
                    "[tsdoc-config-cyclic-extends] Circular reference encountered for \\"extends\\" field of \\".../assets/e5/tsdoc-b.json\\"",
                  ],
                  "_5_extends": Array [],
                },
              ],
            },
            Object {
              "_0_filePath": ".../assets/e5/tsdoc-c.json",
              "_1_fileNotFound": false,
              "_2_hasErrors": true,
              "_3_errorSummary": "Error encountered for .../assets/e5/tsdoc-c.json:
      Error loading config file: data should NOT have additional properties
    ",
              "_4_log": Array [
                "[tsdoc-config-schema-error] Error loading config file: data should NOT have additional properties",
              ],
              "_5_extends": Array [],
            },
          ],
        },
      ],
    }
  `);
});
