// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import type { TSESLint } from '@typescript-eslint/utils';

import { rule as syntaxRule } from './SyntaxRule';

interface IPlugin {
  rules: { [x: string]: TSESLint.AnyRuleModule };
}

const plugin: IPlugin = {
  rules: {
    // NOTE: The actual ESLint rule name will be "tsdoc/syntax".  It is calculated by deleting "eslint-plugin-"
    // from the NPM package name, and then appending this string.
    syntax: syntaxRule
  }
};

export = plugin;
