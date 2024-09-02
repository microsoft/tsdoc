// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { TSDocParser, TextRange, TSDocConfiguration, type ParserContext } from '@microsoft/tsdoc';
import type { TSDocConfigFile } from '@microsoft/tsdoc-config';
import type { TSESLint, TSESTree } from '@typescript-eslint/utils';

const tsdocMessageIds: { [x: string]: string } = {};

const defaultTSDocConfiguration: TSDocConfiguration = new TSDocConfiguration();
defaultTSDocConfiguration.allTsdocMessageIds.forEach((messageId: string) => {
  tsdocMessageIds[messageId] = `${messageId}: {{unformattedText}}`;
});

import { Debug } from './Debug';
import { ConfigCache } from './ConfigCache';

import { configMessages, createRule } from './utils';

export const rule: TSESLint.AnyRuleModule = createRule({
  name: 'syntax',
  meta: {
    messages: {
      ...configMessages,
      ...tsdocMessageIds
    },
    type: 'problem',
    docs: {
      description: 'Validates that TypeScript documentation comments conform to the TSDoc standard',
      // This package is experimental
      recommended: false
    },
    schema: []
  },
  defaultOptions: [],
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const sourceFilePath: string = context.getFilename();
    Debug.log(`Linting: "${sourceFilePath}"`);

    const tsdocConfiguration: TSDocConfiguration = new TSDocConfiguration();

    try {
      const tsdocConfigFile: TSDocConfigFile = ConfigCache.getForSourceFile(sourceFilePath);
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

    const sourceCode: TSESLint.SourceCode = context.sourceCode;
    const checkCommentBlocks: (node: TSESTree.Program) => void = function (node: TSESTree.Program) {
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
});
