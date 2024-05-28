import { TSDocConfiguration } from '@microsoft/tsdoc';
import * as path from 'path';

import { TSDocConfigFile } from '../TSDocConfigFile';

interface ISnapshot {
  s0_filePath: string;
  s1_fileNotFound: boolean;
  s2_hasErrors: boolean;
  s3_errorSummary: string;
  s4_log: string[];
  s5_extends: ISnapshot[];
}

function replaceAll(text: string, search: string, replace: string): string {
  return text.split(search).join(replace);
}

// To make the unit tests deterministic, we need to replace all OS-dependent absolute paths
// with OS-independent paths that are relative to the unit test folder.
function makeStablePath(testPath: string): string {
  if (testPath.length === 0) {
    return '';
  }
  console.log('IN: ' + testPath);
  console.log('OUT: ' + replaceAll(path.relative(__dirname, testPath), '\\', '/'));
  return '.../' + replaceAll(path.relative(__dirname, testPath), '\\', '/');
}

// Build a map from absolute path --> stable path, for each TSDocConfigFile.filePath value
function buildStablePathMap(stablePathMap: Map<string, string>, configFile: TSDocConfigFile): void {
  for (const absolutePath of [configFile.filePath, path.dirname(configFile.filePath)]) {
    if (!stablePathMap.has(absolutePath)) {
      stablePathMap.set(absolutePath, makeStablePath(absolutePath));
    }
  }

  for (const extendsFile of configFile.extendsFiles) {
    buildStablePathMap(stablePathMap, extendsFile);
  }
}

// Search and replace all absolute paths with the corresponding stable path.
// For example, "Found C:\A\B\C.txt in C:\A\D\E.txt" becomes "Found .../B/C.txt in .../D/E.txt".
function convertToStablePaths(text: string, stablePathMap: Map<string, string>): string {
  // Sort the [key,value] pairs by key length from longest to shortest.
  // This ensures that a shorter path does not replace a subpath of a longer path.
  const pairs: [string, string][] = Array.from(stablePathMap.entries()).sort(
    (x, y) => y[0].length - x[0].length
  );
  for (const pair of pairs) {
    text = replaceAll(text, pair[0], pair[1]);
  }
  // Also convert any loose backslashes to slashes
  //text = replaceAll(text, '\\', '/');
  return text;
}

function createSnapshot(configFile: TSDocConfigFile, pathFixupMap: Map<string, string>): ISnapshot {
  return {
    s0_filePath: convertToStablePaths(configFile.filePath, pathFixupMap),
    s1_fileNotFound: configFile.fileNotFound,
    s2_hasErrors: configFile.hasErrors,
    s4_log: configFile.log.messages.map(
      (x) => `[${x.messageId}] ${convertToStablePaths(x.text, pathFixupMap)}`
    ),
    s5_extends: configFile.extendsFiles.map((x) => createSnapshot(x, pathFixupMap)),
    s3_errorSummary: convertToStablePaths(configFile.getErrorSummary(), pathFixupMap)
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
  "s0_filePath": ".../assets/e1/tsdoc.json",
  "s1_fileNotFound": false,
  "s2_hasErrors": true,
  "s3_errorSummary": "Error encountered for .../assets/e1/tsdoc.json:
  Error loading config file: data must NOT have additional properties
",
  "s4_log": Array [
    "[tsdoc-config-schema-error] Error loading config file: data must NOT have additional properties",
  ],
  "s5_extends": Array [],
}
`);
});

test('Load e2', () => {
  expect(testLoadingFolder('assets/e2')).toMatchInlineSnapshot(`
    Object {
      "s0_filePath": ".../assets/e2/tsdoc.json",
      "s1_fileNotFound": false,
      "s2_hasErrors": true,
      "s3_errorSummary": "Error encountered for .../assets/e2/tsdoc.json:
      Error parsing JSON input: Unexpected token '\\\\n' at 3:12
      \\"invalid
              ^
    ",
      "s4_log": Array [
        "[tsdoc-config-invalid-json] Error parsing JSON input: Unexpected token '\\\\n' at 3:12
      \\"invalid
              ^",
      ],
      "s5_extends": Array [],
    }
  `);
});

test('Load e3', () => {
  expect(testLoadingFolder('assets/e3')).toMatchInlineSnapshot(`
    Object {
      "s0_filePath": ".../assets/e3/tsdoc.json",
      "s1_fileNotFound": false,
      "s2_hasErrors": true,
      "s3_errorSummary": "Error encountered for .../assets/e3/tsdoc.json:
      Unsupported JSON \\"$schema\\" value; expecting \\"https://developer.microsoft.com/json-schemas/tsdoc/v0/tsdoc.schema.json\\"
    ",
      "s4_log": Array [
        "[tsdoc-config-unsupported-schema] Unsupported JSON \\"$schema\\" value; expecting \\"https://developer.microsoft.com/json-schemas/tsdoc/v0/tsdoc.schema.json\\"",
      ],
      "s5_extends": Array [],
    }
  `);
});

test('Load e4', () => {
  expect(testLoadingFolder('assets/e4')).toMatchInlineSnapshot(`
    Object {
      "s0_filePath": ".../assets/e4/tsdoc.json",
      "s1_fileNotFound": false,
      "s2_hasErrors": true,
      "s3_errorSummary": "Error encountered for .../assets/e4/tsdoc.json:
      The \\"tagDefinitions\\" field specifies more than one tag with the name \\"@dupe\\"
    ",
      "s4_log": Array [
        "[tsdoc-config-duplicate-tag-name] The \\"tagDefinitions\\" field specifies more than one tag with the name \\"@dupe\\"",
      ],
      "s5_extends": Array [],
    }
  `);
});

test('Load e5', () => {
  expect(testLoadingFolder('assets/e5')).toMatchInlineSnapshot(`
Object {
  "s0_filePath": ".../assets/e5/tsdoc.json",
  "s1_fileNotFound": false,
  "s2_hasErrors": true,
  "s3_errorSummary": "Error encountered for .../assets/e5/tsdoc-a.json:
  Circular reference encountered for \\"extends\\" field of \\".../assets/e5/tsdoc-b.json\\"

Error encountered for .../assets/e5/tsdoc-c.json:
  Error loading config file: data must NOT have additional properties
",
  "s4_log": Array [],
  "s5_extends": Array [
    Object {
      "s0_filePath": ".../assets/e5/tsdoc-a.json",
      "s1_fileNotFound": false,
      "s2_hasErrors": true,
      "s3_errorSummary": "Error encountered for .../assets/e5/tsdoc-a.json:
  Circular reference encountered for \\"extends\\" field of \\".../assets/e5/tsdoc-b.json\\"

Error encountered for .../assets/e5/tsdoc-c.json:
  Error loading config file: data must NOT have additional properties
",
      "s4_log": Array [],
      "s5_extends": Array [
        Object {
          "s0_filePath": ".../assets/e5/tsdoc-b.json",
          "s1_fileNotFound": false,
          "s2_hasErrors": true,
          "s3_errorSummary": "Error encountered for .../assets/e5/tsdoc-a.json:
  Circular reference encountered for \\"extends\\" field of \\".../assets/e5/tsdoc-b.json\\"
",
          "s4_log": Array [],
          "s5_extends": Array [
            Object {
              "s0_filePath": ".../assets/e5/tsdoc-a.json",
              "s1_fileNotFound": false,
              "s2_hasErrors": true,
              "s3_errorSummary": "Error encountered for .../assets/e5/tsdoc-a.json:
  Circular reference encountered for \\"extends\\" field of \\".../assets/e5/tsdoc-b.json\\"
",
              "s4_log": Array [
                "[tsdoc-config-cyclic-extends] Circular reference encountered for \\"extends\\" field of \\".../assets/e5/tsdoc-b.json\\"",
              ],
              "s5_extends": Array [],
            },
          ],
        },
        Object {
          "s0_filePath": ".../assets/e5/tsdoc-c.json",
          "s1_fileNotFound": false,
          "s2_hasErrors": true,
          "s3_errorSummary": "Error encountered for .../assets/e5/tsdoc-c.json:
  Error loading config file: data must NOT have additional properties
",
          "s4_log": Array [
            "[tsdoc-config-schema-error] Error loading config file: data must NOT have additional properties",
          ],
          "s5_extends": Array [],
        },
      ],
    },
  ],
}
`);
});

test('Load e6', () => {
  expect(testLoadingFolder('assets/e6')).toMatchInlineSnapshot(`
    Object {
      "s0_filePath": ".../assets/e6/tsdoc.json",
      "s1_fileNotFound": false,
      "s2_hasErrors": true,
      "s3_errorSummary": "Error encountered for .../assets/e6/tsdoc.json:
      Unable to resolve \\"extends\\" reference to \\"@rushstack/nonexistent-package/tsdoc.json\\": Cannot find module '@rushstack/nonexistent-package/tsdoc.json' from '.../assets/e6'
    ",
      "s4_log": Array [
        "[tsdoc-config-unresolved-extends] Unable to resolve \\"extends\\" reference to \\"@rushstack/nonexistent-package/tsdoc.json\\": Cannot find module '@rushstack/nonexistent-package/tsdoc.json' from '.../assets/e6'",
      ],
      "s5_extends": Array [],
    }
  `);
});

test('Load e7', () => {
  const configFile: TSDocConfigFile = TSDocConfigFile.loadForFolder(path.join(__dirname, 'assets/e7'));

  const pathFixupMap: Map<string, string> = new Map();
  buildStablePathMap(pathFixupMap, configFile);

  expect(createSnapshot(configFile, pathFixupMap)).toMatchInlineSnapshot(`
    Object {
      "s0_filePath": ".../assets/e7/tsdoc.json",
      "s1_fileNotFound": false,
      "s2_hasErrors": false,
      "s3_errorSummary": "No errors.",
      "s4_log": Array [],
      "s5_extends": Array [],
    }
  `);

  // The "tsdoc-config-undefined-tag" error is NOT detected by TSDocConfigFile.loadForFolder()
  expect(configFile.hasErrors).toBe(false);

  const configuration: TSDocConfiguration = new TSDocConfiguration();
  configFile.configureParser(configuration);

  expect(createSnapshot(configFile, pathFixupMap)).toMatchInlineSnapshot(`
    Object {
      "s0_filePath": ".../assets/e7/tsdoc.json",
      "s1_fileNotFound": false,
      "s2_hasErrors": true,
      "s3_errorSummary": "Error encountered for .../assets/e7/tsdoc.json:
      The \\"supportForTags\\" field refers to an undefined tag \\"@nonExistentTag\\".
    ",
      "s4_log": Array [
        "[tsdoc-config-undefined-tag] The \\"supportForTags\\" field refers to an undefined tag \\"@nonExistentTag\\".",
      ],
      "s5_extends": Array [],
    }
  `);

  // The "tsdoc-config-undefined-tag" error IS detected by TSDocConfigFile.configureParser()
  expect(configFile.hasErrors).toBe(true);
});
