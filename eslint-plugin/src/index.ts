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

interface ISyntaxRuleOptions {
  forbidOverrideTag?: boolean;
}

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

interface ICommentLike {
  type: string;
  range: [number, number];
}

interface INodeWithKey {
  range: [number, number];
  key: {
    range: [number, number];
  };
}

function isSupportedOverrideNode(node: unknown): boolean {
  return (
    typeof node === 'object' &&
    node !== null &&
    'type' in node &&
    (node.type === 'MethodDefinition' || node.type === 'PropertyDefinition')
  );
}

function getLeadingDocComment(node: unknown, sourceCode: eslint.SourceCode): ICommentLike | undefined {
  const comments: ICommentLike[] = sourceCode.getCommentsBefore(node as never) as ICommentLike[];
  for (let i: number = comments.length - 1; i >= 0; --i) {
    const comment: ICommentLike = comments[i];
    if (comment.type !== 'Block') {
      continue;
    }

    const commentText: string = sourceCode.text.slice(comment.range[0], comment.range[1]);
    if (commentText.startsWith('/**')) {
      return comment;
    }
  }

  return undefined;
}

function hasOverrideTag(commentText: string): boolean {
  return /(^|\n)\s*\*?\s*@override\b/m.test(commentText);
}

function hasOverrideKeyword(node: unknown): boolean {
  return (
    typeof node === 'object' &&
    node !== null &&
    'override' in node &&
    Boolean((node as { override?: boolean }).override)
  );
}

function getOverrideInsertionOffset(node: unknown, sourceCode: eslint.SourceCode): number {
  if (typeof node !== 'object' || node === null || !('range' in node) || !('key' in node)) {
    return -1;
  }

  const nodeWithKey: INodeWithKey = node as INodeWithKey;
  const nodeText: string = sourceCode.text.slice(nodeWithKey.range[0], nodeWithKey.range[1]);
  const keyStart: number = nodeWithKey.key.range[0] - nodeWithKey.range[0];
  const prefixText: string = nodeText.slice(0, keyStart);
  const nodeData: { accessibility?: string; static?: boolean } = node as {
    accessibility?: string;
    static?: boolean;
  };

  if (nodeData.static) {
    const staticMatch: RegExpMatchArray | null = prefixText.match(/\bstatic\b/);
    if (staticMatch && staticMatch.index !== undefined) {
      const offsetAfterStatic: number = staticMatch.index + 'static'.length;
      const whitespaceMatch: RegExpMatchArray | null = prefixText.slice(offsetAfterStatic).match(/^\s*/);
      const whitespaceLength: number = whitespaceMatch ? whitespaceMatch[0].length : 0;
      return nodeWithKey.range[0] + offsetAfterStatic + whitespaceLength;
    }
  }

  if (nodeData.accessibility) {
    const accessibilityText: string = nodeData.accessibility;
    const accessibilityIndex: number = prefixText.lastIndexOf(accessibilityText);
    if (accessibilityIndex >= 0) {
      const offsetAfterAccessibility: number = accessibilityIndex + accessibilityText.length;
      const whitespaceMatch: RegExpMatchArray | null = prefixText
        .slice(offsetAfterAccessibility)
        .match(/^\s*/);
      const whitespaceLength: number = whitespaceMatch ? whitespaceMatch[0].length : 0;
      return nodeWithKey.range[0] + offsetAfterAccessibility + whitespaceLength;
    }
  }

  return nodeWithKey.key.range[0];
}

function removeOverrideTag(commentText: string): string {
  return commentText
    .split(/\r?\n/)
    .map((line: string) => {
      const updatedLine: string = line.replace(/@override\b/g, '');
      if (updatedLine.trim().length > 0) {
        return updatedLine;
      }

      const commentPrefixMatch: RegExpMatchArray | null = line.match(/^(\s*\*)(.*)$/);
      return commentPrefixMatch ? commentPrefixMatch[1] : '';
    })
    .join('\n');
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
        const options: ISyntaxRuleOptions | undefined = context.options[0] as ISyntaxRuleOptions | undefined;
        const forbidOverrideTag: boolean = options?.forbidOverrideTag ?? false;
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

        const sourceCode: eslint.SourceCode = context.sourceCode ?? context.getSourceCode();
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        function checkOverrideTags(node: any): void {
          if (!forbidOverrideTag || !isSupportedOverrideNode(node)) {
            return;
          }

          const docComment: ICommentLike | undefined = getLeadingDocComment(node, sourceCode);
          if (!docComment) {
            return;
          }

          const commentText: string = sourceCode.text.slice(docComment.range[0], docComment.range[1]);
          if (!hasOverrideTag(commentText)) {
            return;
          }

          if (hasOverrideKeyword(node)) {
            return;
          }

          const overrideInsertionOffset: number = getOverrideInsertionOffset(node, sourceCode);
          if (overrideInsertionOffset < 0) {
            return;
          }

          context.report({
            node,
            messageId: 'override-tag-not-allowed',
            fix: (fixer: eslint.Rule.RuleFixer) => {
              const commentRange: [number, number] = [docComment.range[0], docComment.range[1]];
              return [
                fixer.replaceTextRange(commentRange, removeOverrideTag(commentText)),
                fixer.insertTextAfterRange([overrideInsertionOffset, overrideInsertionOffset], 'override ')
              ];
            }
          });
        }

        return {
          Program: checkCommentBlocks,
          MethodDefinition: checkOverrideTags,
          PropertyDefinition: checkOverrideTags
        } as unknown as eslint.Rule.RuleListener;
      }
    }
  }
};

export = plugin;
