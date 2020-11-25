import * as eslint from 'eslint';
import * as ESTree from 'estree';
import { TSDocParser, TextRange, TSDocConfiguration, ParserContext } from '@microsoft/tsdoc';
import { TSDocConfigFile } from '@microsoft/tsdoc-config';

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
          url: 'https://github.com/microsoft/tsdoc/blob/master/eslint-plugin/README.md'
        }
      },
      create: (context: eslint.Rule.RuleContext) => {
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

        const sourceCode: eslint.SourceCode = context.getSourceCode();
        const checkCommentBlocks: (node: ESTree.Node) => void = function (node: ESTree.Node) {
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
