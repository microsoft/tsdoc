// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { RuleTester } from 'eslint';
import * as plugin from '../index';

import * as parser from '@typescript-eslint/parser';

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
    // A member that already uses the `override` keyword and no `@override` tag is fine.
    {
      code: 'class FooBar {\n  /**\n   * A great method.\n   */\n  public override foo(): void {}\n}\n',
      options: [{ forbidOverrideTag: true }]
    },
    // Without the option enabled, `@override` tags are not reported.
    'class FooBar {\n  /**\n   * @override\n   */\n  foo(): void {}\n}\n'
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
    // `@override` on a method: the comment held only the tag, so it is removed entirely and the
    // `override` keyword is added.
    {
      code: 'class FooBar {\n  /**\n   * @override\n   */\n  foo(): void {}\n}\n',
      options: [{ forbidOverrideTag: true }],
      output: 'class FooBar {\n  override foo(): void {}\n}\n',
      errors: [
        {
          messageId: 'override-tag-not-allowed'
        }
      ]
    },
    // `@override` on a property with an accessibility modifier.
    {
      code: 'class FooBar {\n  /**\n   * @override\n   */\n  public foo: string;\n}\n',
      options: [{ forbidOverrideTag: true }],
      output: 'class FooBar {\n  public override foo: string;\n}\n',
      errors: [
        {
          messageId: 'override-tag-not-allowed'
        }
      ]
    },
    // `@override` on a static property.
    {
      code: 'class FooBar {\n  /**\n   * @override\n   */\n  static foo: string;\n}\n',
      options: [{ forbidOverrideTag: true }],
      output: 'class FooBar {\n  static override foo: string;\n}\n',
      errors: [
        {
          messageId: 'override-tag-not-allowed'
        }
      ]
    },
    // `override` must precede `readonly`, so it is inserted before it.
    {
      code: 'class FooBar {\n  /**\n   * @override\n   */\n  protected readonly foo: string;\n}\n',
      options: [{ forbidOverrideTag: true }],
      output: 'class FooBar {\n  protected override readonly foo: string;\n}\n',
      errors: [
        {
          messageId: 'override-tag-not-allowed'
        }
      ]
    },
    // A redundant `@override` tag next to an existing `override` keyword: remove the comment only.
    {
      code: 'class FooBar {\n  /**\n   * @override\n   */\n  override foo(): void {}\n}\n',
      options: [{ forbidOverrideTag: true }],
      output: 'class FooBar {\n  override foo(): void {}\n}\n',
      errors: [
        {
          messageId: 'override-tag-not-allowed'
        }
      ]
    },
    // A comment with other content keeps the comment; only the `@override` line is removed, without
    // leaving a trailing empty `*` line.
    {
      code: 'class FooBar {\n  /**\n   * A great method.\n   * @override\n   */\n  foo(): void {}\n}\n',
      options: [{ forbidOverrideTag: true }],
      output: 'class FooBar {\n  /**\n   * A great method.\n   */\n  override foo(): void {}\n}\n',
      errors: [
        {
          messageId: 'override-tag-not-allowed'
        }
      ]
    }
  ]
});
