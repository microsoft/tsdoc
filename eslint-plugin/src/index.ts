
import { ParserMessageLog, TSDocParser } from "@microsoft/tsdoc";
import { allTsdocMessageIds } from "@microsoft/tsdoc/lib/parser/TSDocMessageId";
import * as eslint from "eslint";
import * as ESTree from "estree";

const messageIds: {[x: string]: string} = {};

allTsdocMessageIds.forEach((messageId: string) => {
  messageIds[messageId] = `${messageId}: {{ unformattedText }}`;
});

interface IPlugin {
    rules: {[x: string]: eslint.Rule.RuleModule};
}

const plugin: IPlugin = {
  rules: {
    "syntax": {
      meta: {
        messages: messageIds,
        type: "problem",
        docs: {
          description: "Validates tsdoc comments",
          category: "Typescript",
          recommended: false,
          url: "https://github.com/microsoft/tsdoc"
        }
      },
      create: (context: eslint.Rule.RuleContext) => {
        const tsDocParser: TSDocParser = new TSDocParser();
        const sourceCode: eslint.SourceCode = context.getSourceCode();
        const checkCommentBlocks: (node: ESTree.Node) => void = function (node: ESTree.Node) {
          const commentToken: eslint.AST.Token | null = sourceCode.getJSDocComment(node);
          if (commentToken) {
            const commentString: string = "/*" + commentToken.value + "*/";
            const results: ParserMessageLog = tsDocParser.parseString(commentString).log;
            for (const message of results.messages) {
              context.report({
                loc: commentToken.loc,
                messageId: message.messageId,
                data: {
                  unformattedText: message.unformattedText
                }
              });
            }
          }
        }

        return {
          ClassDeclaration: checkCommentBlocks,
          FunctionDeclaration: checkCommentBlocks
        };
      }
    }
  }
}

export = plugin;
