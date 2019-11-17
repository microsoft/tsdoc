
import {
  TSDocParser,
  TextRange,
  TSDocConfiguration,
  StandardTags,
  TSDocTagDefinition,
  TSDocTagSyntaxKind,
  ParserContext
} from "@microsoft/tsdoc";
import {
  TSDocConfigFile
} from '@microsoft/tsdoc-config';
import * as eslint from "eslint";
import * as ESTree from "estree";

const tsdocMessageIds: {[x: string]: string} = {};

const defaultTSDocConfiguration: TSDocConfiguration = new TSDocConfiguration()
defaultTSDocConfiguration.allTsdocMessageIds.forEach((messageId: string) => {
  tsdocMessageIds[messageId] = `${messageId}: {{unformattedText}}`;
});

interface IPlugin {
  rules: {[x: string]: eslint.Rule.RuleModule};
}

const plugin: IPlugin = {
  rules: {
    // NOTE: The actual ESLint rule name will be "tsdoc/syntax".  It is calculated by deleting "eslint-plugin-"
    // from the NPM package name, and then appending this string.
    "syntax": {
      meta: {
        messages: tsdocMessageIds,
        type: "problem",
        docs: {
          description: "Validates that TypeScript documentation comments conform to the TSDoc standard",
          category: "Stylistic Issues",
          // This package is experimental
          recommended: false,
          url: "https://github.com/microsoft/tsdoc"
        }
      },
      create: (context: eslint.Rule.RuleContext) => {
        const tsdocConfiguration: TSDocConfiguration = new TSDocConfiguration();

        const sourceFilePath: string = context.getFilename();
        const tsdocConfigFile: TSDocConfigFile = TSDocConfigFile.loadForFolder(sourceFilePath);

        if (!tsdocConfigFile.fileNotFound) {
          tsdocConfigFile.configureParser(tsdocConfiguration);
        } else {
          // If we weren't able to find a tsdoc-config.json file, then by default we will use a lax configuration
          // that allows every standard tag regardless of standardization group.
          tsdocConfiguration.setSupportForTags(StandardTags.allDefinitions, true);

          // Also allow the three AEDoc tags.
          tsdocConfiguration.addTagDefinitions([
            new TSDocTagDefinition({
              tagName: '@betaDocumentation',
              syntaxKind: TSDocTagSyntaxKind.ModifierTag
            }),
            new TSDocTagDefinition({
              tagName: '@internalRemarks',
              syntaxKind: TSDocTagSyntaxKind.BlockTag
            }),
            new TSDocTagDefinition({
              tagName: '@preapproved',
              syntaxKind: TSDocTagSyntaxKind.ModifierTag
            })
          ], true);
        }

        const tsdocParser: TSDocParser = new TSDocParser(tsdocConfiguration);

        const sourceCode: eslint.SourceCode = context.getSourceCode();
        const checkCommentBlocks: (node: ESTree.Node) => void = function (node: ESTree.Node) {
          for (const comment of sourceCode.getAllComments()) {
            if (comment.type !== "Block") {
              continue;
            }
            if (!comment.range) {
              continue;
            }

            const textRange: TextRange = TextRange.fromStringRange(sourceCode.text, comment.range[0], comment.range[1]);

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
        }

        return {
          Program: checkCommentBlocks
        };
      }
    }
  }
}

export = plugin;
