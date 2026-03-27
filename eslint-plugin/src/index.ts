// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { ESLintUtils, type TSESLint } from '@typescript-eslint/utils';
import type * as eslint from 'eslint';

import { TSDocParser, TextRange, TSDocConfiguration, type ParserContext } from '@microsoft/tsdoc';
import type { TSDocConfigFile } from '@microsoft/tsdoc-config';

import { Debug } from './Debug';
import { ConfigCache } from './ConfigCache';
import recommended from './configs/recommended';

const tsdocMessageIds: { [x: string]: string } = {};

const defaultTSDocConfiguration: TSDocConfiguration = new TSDocConfiguration();
defaultTSDocConfiguration.allTsdocMessageIds.forEach((messageId: string) => {
  tsdocMessageIds[messageId] = `${messageId}: {{unformattedText}}`;
});

interface IPlugin {
  rules: { [x: string]: eslint.Rule.RuleModule };
  configs: { [x: string]: eslint.Linter.Config };
}

function getRootDirectoryFromContext(context: TSESLint.RuleContext<string, unknown[]>): string | undefined {
  let rootDirectory: string | undefined;
  try {
    // First attempt to get the root directory from the tsconfig baseUrl, then the program current directory
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const program: any = (context.sourceCode?.parserServices ?? ESLintUtils.getParserServices(context))
      .program;
    rootDirectory = program?.getCompilerOptions().baseUrl ?? program?.getCurrentDirectory();
  } catch {
    // Ignore the error if we cannot retrieve a TS program
  }

  // Fall back to the parserOptions.tsconfigRootDir if available, otherwise the eslint working directory
  if (!rootDirectory) {
    rootDirectory = context.parserOptions?.tsconfigRootDir ?? context.cwd ?? context.getCwd?.();
  }

  return rootDirectory;
}

const plugin: IPlugin = {
  rules: {
    // NOTE: The actual ESLint rule name will be "tsdoc/syntax".  It is calculated by deleting "eslint-plugin-"
    // from the NPM package name, and then appending this string.
    syntax: {
      meta: {
        messages: {
          'error-loading-config-file': 'Error loading TSDoc config file:\n{{details}}',
          'error-applying-config': 'Error applying TSDoc configuration: {{details}}',
          ...tsdocMessageIds
        },
        type: 'problem',
        docs: {
          description: 'Validates that TypeScript documentation comments conform to the TSDoc standard',
          category: 'Stylistic Issues',
          // This package is experimental
          recommended: false,
          url: 'https://tsdoc.org/pages/packages/eslint-plugin-tsdoc'
        }
      },
      create: (context: eslint.Rule.RuleContext) => {
        const sourceFilePath: string = context.filename;
        // If eslint is configured with @typescript-eslint/parser, there is a parser option
        // to explicitly specify where the tsconfig file is. Use that if available.
        const tsConfigDir: string | undefined = getRootDirectoryFromContext(
          context as unknown as TSESLint.RuleContext<string, unknown[]>
        );
