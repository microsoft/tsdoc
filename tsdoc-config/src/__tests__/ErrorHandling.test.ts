import * as path from 'path';

import { TSDocConfigFile } from '../TSDocConfigFile';

function testLoadingFolder(assetPath: string): unknown {
  const configFile: TSDocConfigFile = TSDocConfigFile.loadForFolder(path.join(__dirname, assetPath));

  return {
    fileNotFound: configFile.fileNotFound,
    hasErrors: configFile.hasErrors,
    log: configFile.log.messages.map((x) => `[${x.messageId}] ${x.text}`),
  };
}

test('Load e1', () => {
  expect(testLoadingFolder('assets/e1')).toMatchInlineSnapshot(`
    Object {
      "fileNotFound": false,
      "hasErrors": true,
      "log": Array [
        "[tsdoc-config-schema-error] Error loading config file: data should NOT have additional properties",
      ],
    }
  `);
});

test('Load e2', () => {
  expect(testLoadingFolder('assets/e2')).toMatchInlineSnapshot(`
    Object {
      "fileNotFound": true,
      "hasErrors": false,
      "log": Array [
        "[tsdoc-config-invalid-json] Error parsing JSON input: Unexpected token '\\\\n' at 3:12
      \\"invalid
              ^",
      ],
    }
  `);
});

test('Load e3', () => {
  expect(testLoadingFolder('assets/e3')).toMatchInlineSnapshot(`
    Object {
      "fileNotFound": false,
      "hasErrors": true,
      "log": Array [
        "[tsdoc-config-unsupported-schema] Unsupported JSON \\"$schema\\" value; expecting \\"https://developer.microsoft.com/json-schemas/tsdoc/v0/tsdoc.schema.json\\"",
      ],
    }
  `);
});

test('Load e4', () => {
  expect(testLoadingFolder('assets/e4')).toMatchInlineSnapshot(`
    Object {
      "fileNotFound": false,
      "hasErrors": true,
      "log": Array [
        "[tsdoc-config-duplicate-tag-name] The \\"tagDefinitions\\" field specifies more than one tag with the name \\"@dupe\\"",
      ],
    }
  `);
});
