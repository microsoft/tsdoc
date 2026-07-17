// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { RuleTester } from 'eslint';
import * as plugin from '../index';

const parser = require('@typescript-eslint/parser');

const ruleTester: RuleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: 'module'
    }
  }
});

ruleTester.run('"tsdoc/syntax" rule', plugin.rules.syntax, {
  valid: [
    '/**\nA great function!\n */\nfunction foobar() {}\n',
    '/**\nA great class!\n */\nclass FooBar {}\n',
    '/** @jsx h */',
    {
      code: '/**\n * A great method.\n */\nclass FooBar {\n  public override foo(): void {}\n}\n',
      options: [{ forbidOverrideTag: true }]
    }
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
    },
    {
      code: '/**\n * @override\n */\nclass FooBar {\n  foo(): void {}\n}\n',
      options: [{ forbidOverrideTag: true }],
      output: '/**\n * \n */\nclass FooBar {\n  override foo(): void {}\n}\n',
      errors: [
        {
          messageId: 'override-tag-not-allowed'
        }
      ]
    },
    {
      code: '/**\n * @override\n */\nclass FooBar {\n  public foo: string;\n}\n',
      options: [{ forbidOverrideTag: true }],
      output: '/**\n * \n */\nclass FooBar {\n  public override foo: string;\n}\n',
      errors: [
        {
          messageId: 'override-tag-not-allowed'
        }
      ]
    }
  ]
});
