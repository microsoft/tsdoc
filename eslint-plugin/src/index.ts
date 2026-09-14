// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { ESLintUtils, type TSESLint } from '@typescript-eslint/utils';
import type * as eslint from 'eslint';

import {
  TSDocParser,
  TextRange,
  TSDocConfiguration,
  StandardTags,
  type ParserContext,
  type DocBlockTag
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

// The comment token type produced by `SourceCode.getAllComments()`.  Derived from the ESLint
// types so it stays consistent with the `@types/estree` version they were built against.
type TDocComment = ReturnType<eslint.SourceCode['getAllComments']>[number];

// A class member (method or property) that may carry an `@override` doc tag and/or a TypeScript
// `override` modifier.  `override` is a TypeScript-ESTree extension not present in the ESTree types.
type TClassMemberNode = (
  | (eslint.Rule.Node & { type: 'MethodDefinition' })
  | (eslint.Rule.Node & { type: 'PropertyDefinition' })
) & { override?: boolean };

// Rewrites a doc comment's source text with the `@override` modifier tag removed.  Returns the new
// comment text, or `undefined` when the comment would be left with nothing but its framing (in which
// case the caller should remove the entire comment).  The tag range is relative to `commentText`.
function rewriteCommentWithoutOverrideTag(
  commentText: string,
  tagStart: number,
  tagEnd: number
): string | undefined {
  // Drop the tag along with any horizontal whitespace immediately surrounding it, so we don't leave
  // a dangling space (e.g. `* @override` becomes `*`).
  let start: number = tagStart;
  let end: number = tagEnd;
  while (start > 0 && (commentText[start - 1] === ' ' || commentText[start - 1] === '\t')) {
    --start;
  }

  while (end < commentText.length && (commentText[end] === ' ' || commentText[end] === '\t')) {
    ++end;
  }

  const lines: string[] = (commentText.slice(0, start) + commentText.slice(end)).split('\n');

  // Drop now-empty comment lines (whitespace and an optional `*`) that trail before the closing `*/`.
  while (lines.length > 1 && /^\s*\*?\s*$/.test(lines[lines.length - 2])) {
    lines.splice(lines.length - 2, 1);
  }

  const cleaned: string = lines.join('\n');

  // If only the `/**` ... `*/` framing remains, signal that the whole comment should be removed.
  const remainingContent: string = cleaned
    .replace(/^\/\*\*?/, '')
    .replace(/\*\/\s*$/, '')
    .replace(/^[ \t]*\*/gm, '')
    .trim();

  return remainingContent.length === 0 ? undefined : cleaned;
}

// Returns the node or token that the TypeScript `override` keyword should be inserted before.
// `override` must follow accessibility (e.g. `public`) and `static` modifiers, but precede
// `readonly`/`abstract`, so we walk backwards past those starting from the member's key.
function getOverrideInsertionTarget(
  node: TClassMemberNode,
  sourceCode: eslint.SourceCode
): TClassMemberNode['key'] | eslint.AST.Token {
  let target: TClassMemberNode['key'] | eslint.AST.Token = node.key;
  let token: eslint.AST.Token | null = sourceCode.getTokenBefore(target);
  while (token && (token.value === 'readonly' || token.value === 'abstract')) {
    target = token;
    token = sourceCode.getTokenBefore(token);
  }

  return target;
}

const plugin: IPlugin = {
  rules: {
    // NOTE: The actual ESLint rule name will be "tsdoc/syntax".  It is calculated by deleting "eslint-plugin-"
    // from the NPM package name, and then appending this string.
    syntax: {
      meta: {
        schema: [
          {
            type: 'object',
            properties: {
              forbidOverrideTag: {
                type: 'boolean'
              }
            },
            additionalProperties: false
          }
        ],
        messages: {
          'error-loading-config-file': 'Error loading TSDoc config file:\n{{details}}',
          'error-applying-config': 'Error applying TSDoc configuration: {{details}}',
          'override-tag-not-allowed':
            'Do not use the @override TSDoc tag; use the TypeScript override keyword instead.',
          ...tsdocMessageIds
        },
        fixable: 'code',
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
        const {
          options: [{ forbidOverrideTag = false } = {}],
          filename: sourceFilePath
        } = context;

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

        const sourceCode: eslint.SourceCode = context.sourceCode ?? context.getSourceCode();

        // Finds the class member (method or property) documented by a doc comment, or undefined
        // if the comment does not immediately precede a supported member.
        function getDocumentedClassMember(comment: TDocComment): TClassMemberNode | undefined {
          const tokenAfter: eslint.AST.Token | null = sourceCode.getTokenAfter(comment);
          if (!tokenAfter) {
            return undefined;
          }

          // `getNodeByRangeIndex` is typed as returning a bare ESTree node, but at runtime the
          // parent links are populated, so we treat the result as a Rule.Node for the walk.
          let node: eslint.Rule.Node | null = sourceCode.getNodeByRangeIndex(
            tokenAfter.range[0]
          ) as eslint.Rule.Node | null;
          while (node) {
            if (node.type === 'MethodDefinition' || node.type === 'PropertyDefinition') {
              return node;
            }

            node = node.parent;
          }

          return undefined;
        }

        function reportOverrideTag(comment: TDocComment, parserContext: ParserContext): void {
          const node: TClassMemberNode | undefined = getDocumentedClassMember(comment);
          if (!node || !comment.range) {
            return;
          }

          const overrideTag: DocBlockTag | undefined = parserContext.docComment.modifierTagSet.tryGetTag(
            StandardTags.override
          );
          if (!overrideTag) {
            return;
          }

          const [commentStart, commentEnd] = comment.range;
          const { pos, end } = overrideTag.getTokenSequence().getContainingTextRange();
          const newCommentText: string | undefined = rewriteCommentWithoutOverrideTag(
            sourceCode.text.slice(commentStart, commentEnd),
            pos - commentStart,
            end - commentStart
          );

          context.report({
            node,
            messageId: 'override-tag-not-allowed',
            fix: (fixer: eslint.Rule.RuleFixer) => {
              const fixes: eslint.Rule.Fix[] = [];
              if (newCommentText === undefined) {
                // The comment held nothing but `@override`, so remove it along with the whitespace
                // up to the member declaration.
                const memberToken: eslint.AST.Token | null = sourceCode.getTokenAfter(comment);
                fixes.push(
                  fixer.removeRange([commentStart, memberToken ? memberToken.range[0] : commentEnd])
                );
              } else {
                fixes.push(fixer.replaceTextRange([commentStart, commentEnd], newCommentText));
              }

              if (!node.override) {
                fixes.push(fixer.insertTextBefore(getOverrideInsertionTarget(node, sourceCode), 'override '));
              }

              return fixes;
            }
          });
        }

        function checkCommentBlocks(): void {
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

            // Parse the comment once and reuse the result for both syntax validation and the
            // optional `@override` modifier check.
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

            if (forbidOverrideTag && parserContext.docComment.modifierTagSet.isOverride()) {
              reportOverrideTag(comment, parserContext);
            }
          }
        }

        return {
          Program: checkCommentBlocks
        };
      }
    }
  }
};

export = plugin;
