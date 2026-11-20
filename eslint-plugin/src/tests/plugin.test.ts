// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { RuleTester } from 'eslint';
import type * as eslint from 'eslint';
import * as os from 'node:os';
import * as path from 'node:path';
import * as plugin from '../index';

const ruleTester: RuleTester = new RuleTester();
ruleTester.run('"tsdoc/syntax" rule', plugin.rules.syntax, {
  valid: [
    '/**\nA great function!\n */\nfunction foobar() {}\n',
    '/**\nA great class!\n */\nclass FooBar {}\n',
    '/** @jsx h */'
  ],
  invalid: [
    {
      code: '/**\n * This `is wrong\n */\nfunction foobar() {}\n',
      errors: [
        {
          messageId: 'tsdoc-code-span-missing-delimiter'
        }
      ]
    },
    {
      code: '/**\n * This `is wrong\n */\nclass FooBar {}\n',
      errors: [
        {
          messageId: 'tsdoc-code-span-missing-delimiter'
        }
      ]
    }
  ]
});

interface ITestReportDescriptor {
  messageId?: string;
}

// A SourceCode stub exposing only the members that the "tsdoc/syntax" rule reads.
function createSourceCode(code: string): eslint.SourceCode {
  const commentEndIndex: number = code.indexOf('*/') + 2;
  return {
    text: code,
    getAllComments: () => [{ type: 'Block', range: [0, commentEndIndex] }],
    getLocFromIndex: (index: number) => {
      const lines: string[] = code.slice(0, index).split('\n');
      return { line: lines.length, column: lines[lines.length - 1].length };
    }
  } as unknown as eslint.SourceCode;
}

function runRule(context: eslint.Rule.RuleContext): void {
  const listeners: eslint.Rule.RuleListener = plugin.rules.syntax.create(context);
  (listeners.Program as () => void)();
}

test('"tsdoc/syntax" rule supports a method-only ESLint 7 style rule context', () => {
  const code: string = '/**\n * A great function!\n */\nfunction foobar() {}\n';
  const sourceFileFolder: string = os.tmpdir();
  const sourceFilePath: string = path.join(sourceFileFolder, 'method-only-context.ts');
  const reportedMessageIds: (string | undefined)[] = [];

  // ESLint 7 provides getFilename(), getSourceCode(), and getCwd(), but does not
  // define the filename, sourceCode, and cwd properties.
  const context: eslint.Rule.RuleContext = {
    getFilename: () => sourceFilePath,
    getSourceCode: () => createSourceCode(code),
    getCwd: () => sourceFileFolder,
    parserOptions: {},
    report: (descriptor: ITestReportDescriptor) => {
      reportedMessageIds.push(descriptor.messageId);
    }
  } as unknown as eslint.Rule.RuleContext;

  runRule(context);

  expect(reportedMessageIds).toEqual([]);
});

test('"tsdoc/syntax" rule reports TSDoc errors with a method-only ESLint 7 style rule context', () => {
  const code: string = '/**\n * This `is wrong\n */\nfunction foobar() {}\n';
  const sourceFileFolder: string = os.tmpdir();
  const sourceFilePath: string = path.join(sourceFileFolder, 'method-only-context.ts');
  const reportedMessageIds: (string | undefined)[] = [];

  const context: eslint.Rule.RuleContext = {
    getFilename: () => sourceFilePath,
    getSourceCode: () => createSourceCode(code),
    getCwd: () => sourceFileFolder,
    parserOptions: {},
    report: (descriptor: ITestReportDescriptor) => {
      reportedMessageIds.push(descriptor.messageId);
    }
  } as unknown as eslint.Rule.RuleContext;

  runRule(context);

  expect(reportedMessageIds).toEqual(['tsdoc-code-span-missing-delimiter']);
});

test('"tsdoc/syntax" rule supports a property-only rule context', () => {
  const code: string = '/**\n * A great function!\n */\nfunction foobar() {}\n';
  const sourceFileFolder: string = os.tmpdir();
  const sourceFilePath: string = path.join(sourceFileFolder, 'property-only-context.ts');
  const reportedMessageIds: (string | undefined)[] = [];

  // Newer ESLint versions expose the filename, sourceCode, and cwd properties and
  // may drop the deprecated getFilename(), getSourceCode(), and getCwd() methods.
  const context: eslint.Rule.RuleContext = {
    filename: sourceFilePath,
    sourceCode: createSourceCode(code),
    cwd: sourceFileFolder,
    parserOptions: {},
    report: (descriptor: ITestReportDescriptor) => {
      reportedMessageIds.push(descriptor.messageId);
    }
  } as unknown as eslint.Rule.RuleContext;

  runRule(context);

  expect(reportedMessageIds).toEqual([]);
});
