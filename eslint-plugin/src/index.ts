// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { ESLintUtils, type TSESLint } from '@typescript-eslint/utils';

import type * as eslint from 'eslint';
import { TSDocParser, TextRange, TSDocConfiguration, type ParserContext } from '@microsoft/tsdoc';
import type { TSDocConfigFile } from '@microsoft/tsdoc-config';

import { Debug } from './Debug';
import { ConfigCache } from './ConfigCache';

const tsdocMessageIds: { [x: string]: string } = {};

const defaultTSDocConfiguration: TSDocConfiguration = new TSDocConfiguration();
defaultTSDocConfiguration.allTsdocMessageIds.forEach((messageId: string) => {
  tsdocMessageIds[messageId] = `${messageId}: {{unformattedText}}`;
});

interface IPlugin {
  rules: { [x: string]: eslint.Rule.RuleModule };
}

function getRootDirectoryFromContext(context: TSESLint.RuleContext<string, unknown[]>): string | undefined {
  let rootDirectory: string | undefined;
  try {
    // First attempt to get the root directory from the tsconfig baseUrl, then the program current directory
    const program = (context.sourceCode?.parserServices ?? ESLintUtils.getParserServices(context)).program;
    rootDirectory = program?.getCompilerOptions().baseUrl ?? program?.getCurrentDirectory();
  } catch {
    // Ignore the error if we cannot retrieve a TS program
  }

  // Fall back to the parserOptions.tsconfigRootDir if available, otherwise the eslint working directory
  if (!rootDirectory) {
    rootDirectory = context.parserOptions?.tsconfigRootDir ?? context.getCwd?.();
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
        Debug.log(`Linting: "${sourceFilePath}"`);

        const tsdocConfiguration: TSDocConfiguration = new TSDocConfiguration();

        try {
          const tsdocConfigFile: TSDocConfigFile = ConfigCache.getForSourceFile(sourceFilePath, tsConfigDir);
          if (!tsdocConfigFile.fileNotFound) {
            if (tsdocConfigFile.hasErrors) {
              context.report({
                loc: { line: 1, column: 1 },
                messageId: 'error-loading-config-file',
                data: {
                  details: tsdocConfigFile.getErrorSummary()
                }
              });
            }

            try {
              tsdocConfigFile.configureParser(tsdocConfiguration);
            } catch (e) {
              context.report({
                loc: { line: 1, column: 1 },
                messageId: 'error-applying-config',
                data: {
                  details: e.message
                }
              });
            }
          }
        } catch (e) {
          context.report({
            loc: { line: 1, column: 1 },
            messageId: 'error-loading-config-file',
            data: {
              details: `Unexpected exception: ${e.message}`
            }
          });
        }

        const tsdocParser: TSDocParser = new TSDocParser(tsdocConfiguration);

        const sourceCode: eslint.SourceCode = context.getSourceCode();
        const checkCommentBlocks: () => void = function () {
          for (const comment of sourceCode.getAllComments()) {
            if (comment.type !== 'Block') {
              continue;
            }
            if (!comment.range) {
              continue;
            }

            const textRange: TextRange = TextRange.fromStringRange(
              sourceCode.text,
              comment.range[0],
              comment.range[1]
            );

            // Smallest comment is "/***/"
            if (textRange.length < 5) {
              continue;
            }
            // Make sure it starts with "/**"
            if (textRange.buffer[textRange.pos + 2] !== '*') {
              continue;
            }

            const parserContext: ParserContext = tsdocParser.parseRange(textRange);
            for (const message of parserContext.log.messages) {
              context.report({
                loc: {
                  start: sourceCode.getLocFromIndex(message.textRange.pos),
                  end: sourceCode.getLocFromIndex(message.textRange.end)
                },
                messageId: message.messageId,
                data: {
                  unformattedText: message.unformattedText
                }
              });
            }
          }
        };

        return {
          Program: checkCommentBlocks
        };
      }
    }
  }
};

export = plugin;
