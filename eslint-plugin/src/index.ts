// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import type * as eslint from 'eslint';
import type * as ESTree from 'estree';
import {
  TSDocParser,
  TextRange,
  TSDocConfiguration,
  type ParserContext,
  DocNodeKind,
  DocLinkTag,
  DocDeclarationReference,
  type DocSection
} from '@microsoft/tsdoc';
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

function createTSDocParser(context: eslint.Rule.RuleContext): TSDocParser {
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

  return new TSDocParser(tsdocConfiguration);
}

function* parseTSDocComments(
  tsdocParser: TSDocParser,
  sourceCode: eslint.SourceCode
): Generator<ParserContext, void> {
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

    yield tsdocParser.parseRange(textRange);
  }
}

function findVariable(scope: eslint.Scope.Scope, identifier: string): eslint.Scope.Variable | undefined {
  const variable: eslint.Scope.Variable | undefined = scope.set.get(identifier);
  if (variable) {
    return variable;
  }
  for (const child of scope.childScopes) {
    const result: eslint.Scope.Variable | undefined = findVariable(child, identifier);
    if (result) {
      return result;
    }
  }
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
        const tsdocParser: TSDocParser = createTSDocParser(context);
        const sourceCode: eslint.SourceCode = context.getSourceCode();
        const checkCommentBlocks: (node: ESTree.Node) => void = function (node: ESTree.Node) {
          for (const parserContext of parseTSDocComments(tsdocParser, sourceCode)) {
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
    },
    'no-undefined-types': {
      meta: {
        messages: {
          'error-loading-config-file': 'Error loading TSDoc config file:\n{{details}}',
          'error-applying-config': 'Error applying TSDoc configuration: {{details}}',
          'error-undefined-reference': 'A TSDoc-comment referenced "{{identifier}}" which is not defined'
        },
        type: 'problem',
        docs: {
          description: 'Validates that TypeScript documentation comments reference only defined types',
          // This package is experimental
          recommended: false,
          url: 'https://tsdoc.org/pages/packages/eslint-plugin-tsdoc'
        }
      },
      create: (context: eslint.Rule.RuleContext) => {
        const tsdocParser: TSDocParser = createTSDocParser(context);
        const sourceCode: eslint.SourceCode = context.sourceCode;
        const checkCommentBlocks: (node: ESTree.Node) => void = function (node: ESTree.Node) {
          // TODO: Figure out a way to get the scope of the node which the comment is referencing instead
          const scope: eslint.Scope.Scope = context.sourceCode.getScope(node);

          // TODO: Pass a list of comments to `parseTSDocComments` instead of `sourceCode`
          for (const parserContext of parseTSDocComments(tsdocParser, sourceCode)) {
            function markOrReportIdentifier(identifier: string): void {
              const variable: eslint.Scope.Variable | undefined = findVariable(scope, identifier);
              if (variable) {
                sourceCode.markVariableAsUsed(identifier, node);
              } else {
                context.report({
                  loc: {
                    // TODO: Narrow this further
                    start: sourceCode.getLocFromIndex(parserContext.commentRange.pos),
                    end: sourceCode.getLocFromIndex(parserContext.commentRange.end)
                  },
                  messageId: 'error-undefined-reference',
                  data: {
                    identifier
                  }
                });
              }
            }

            function visitDeclarationReference(reference: DocDeclarationReference): void {
              for (const memberReferences of reference.memberReferences) {
                // TODO: Support memberReferences.memberSymbol
                if (!memberReferences.memberIdentifier) {
                  console.warn('Symbols in links are not supported');
                  continue;
                }
                const { identifier } = memberReferences.memberIdentifier;
                markOrReportIdentifier(identifier);
              }
            }

            const { docComment } = parserContext;

            const sections: DocSection[] = [docComment.summarySection];

            for (const block of [
              docComment.remarksBlock,
              docComment.privateRemarks,
              docComment.deprecatedBlock,
              ...docComment.params,
              ...docComment.typeParams,
              docComment.returnsBlock
            ]) {
              if (block) {
                sections.push(block.content);
              }
            }

            for (const section of sections) {
              // Find links in the summary
              for (const childOfSection of section.nodes) {
                if (childOfSection.kind !== DocNodeKind.Paragraph) {
                  console.warn(
                    'Expected all direct children of summary sections to be paragraphs, got ' +
                      childOfSection.kind
                  );
                  continue;
                }
                for (const childOfParagraph of childOfSection.getChildNodes()) {
                  if (!(childOfParagraph instanceof DocLinkTag)) {
                    continue;
                  }
                  const { codeDestination } = childOfParagraph;
                  if (!(codeDestination instanceof DocDeclarationReference)) {
                    continue;
                  }
                  visitDeclarationReference(codeDestination);
                }
              }
            }

            if (docComment.inheritDocTag && docComment.inheritDocTag.declarationReference) {
              visitDeclarationReference(docComment.inheritDocTag.declarationReference);
            }
          }
        };

        return {
          // TODO: Make this more granular, to resolve identifiers relative to the scope of the node which the comment is referencing to
          Program: checkCommentBlocks
        };
      }
    }
  }
};

export = plugin;
