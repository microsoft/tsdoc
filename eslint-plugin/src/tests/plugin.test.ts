// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { RuleTester } from 'eslint';
import * as plugin from '../index';

const ruleTester: RuleTester = new RuleTester();
ruleTester.run('"tsdoc/syntax" rule', plugin.rules.syntax, {
  valid: [
    '/**\nA great function!\n */\nfunction foobar() {}\n',
    '/**\nA great class!\n */\nclass FooBar {}\n'
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
