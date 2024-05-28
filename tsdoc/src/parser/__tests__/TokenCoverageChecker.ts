// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { type DocNode, DocExcerpt } from '../../nodes';
import { TokenSequence } from '../TokenSequence';
import type { ParserContext } from '../ParserContext';
import { TokenKind, type Token } from '../Token';

interface ITokenAssociation {
  docNode: DocNode;
  tokenSequence: TokenSequence;
}

/**
 * The TokenCoverageChecker performs two diagnostics to detect parser bugs:
 * 1. It checks for two DocNode objects whose excerpt contains overlapping tokens.
 *    By design, a single character from the input stream should be associated with
 *    at most one TokenSequence.
 * 2. It checks for gaps, i.e. input tokens that were not associated with any DocNode
 *    (that is reachable from the final DocCommon node tree).  In some cases this is
 *    okay.  For example, if `@public` appears twice inside a comment, the second
 *    redundant instance is ignored.  But in general we want to track the gaps in the
 *    unit test snapshots to ensure in general that every input character is associated
 *    with an excerpt for a DocNode.
 */
export class TokenCoverageChecker {
  private readonly _parserContext: ParserContext;
  private readonly _tokenAssociations: (ITokenAssociation | undefined)[];

  public constructor(parserContext: ParserContext) {
    this._parserContext = parserContext;
    this._tokenAssociations = [];
    this._tokenAssociations.length = parserContext.tokens.length;
  }

  public getGaps(rootNode: DocNode): TokenSequence[] {
    this._addNodeTree(rootNode);
    return this._checkForGaps(false);
  }

  public reportGaps(rootNode: DocNode): void {
    this._addNodeTree(rootNode);
    this._checkForGaps(true);
  }

  private _addNodeTree(node: DocNode): void {
    if (node instanceof DocExcerpt) {
      this._addSequence(node.content, node);
    }

    for (const childNode of node.getChildNodes()) {
      this._addNodeTree(childNode);
    }
  }

  private _addSequence(tokenSequence: TokenSequence, docNode: DocNode): void {
    const newTokenAssociation: ITokenAssociation = { docNode, tokenSequence };

    for (let i: number = tokenSequence.startIndex; i < tokenSequence.endIndex; ++i) {
      const tokenAssociation: ITokenAssociation | undefined = this._tokenAssociations[i];
      if (tokenAssociation) {
        throw new Error(
          `Overlapping content encountered between` +
            ` ${this._formatTokenAssociation(tokenAssociation)} and` +
            ` ${this._formatTokenAssociation(newTokenAssociation)}`
        );
      }

      this._tokenAssociations[i] = newTokenAssociation;
    }
  }

  private _checkForGaps(reportGaps: boolean): TokenSequence[] {
    const gaps: TokenSequence[] = [];

    let gapStartIndex: number | undefined = undefined;
    let tokenAssociationBeforeGap: ITokenAssociation | undefined = undefined;

    const tokens: Token[] = this._parserContext.tokens;
    if (tokens[tokens.length - 1].kind !== TokenKind.EndOfInput) {
      throw new Error('Missing EndOfInput token');
    }

    for (let i: number = 0; i < this._parserContext.tokens.length - 1; ++i) {
      const tokenAssociation: ITokenAssociation | undefined = this._tokenAssociations[i];

      if (gapStartIndex === undefined) {
        // No gap found yet

        if (tokenAssociation) {
          tokenAssociationBeforeGap = tokenAssociation;
        } else {
          // We found the start of a gap
          gapStartIndex = i;
        }
      } else {
        // Is this the end of the gap?
        if (tokenAssociation) {
          const gap: TokenSequence = new TokenSequence({
            parserContext: this._parserContext,
            startIndex: gapStartIndex,
            endIndex: i
          });
          if (reportGaps) {
            this._reportGap(gap, tokenAssociationBeforeGap, tokenAssociation);
          }
          gaps.push(gap);

          gapStartIndex = undefined;
          tokenAssociationBeforeGap = undefined;
        }
      }
    }

    if (gapStartIndex) {
      const gap: TokenSequence = new TokenSequence({
        parserContext: this._parserContext,
        startIndex: gapStartIndex,
        endIndex: this._parserContext.tokens.length
      });
      if (reportGaps) {
        this._reportGap(gap, tokenAssociationBeforeGap, undefined);
      }
      gaps.push(gap);
    }

    return gaps;
  }

  private _reportGap(
    gap: TokenSequence,
    tokenAssociationBeforeGap: ITokenAssociation | undefined,
    tokenAssociationAfterGap: ITokenAssociation | undefined
  ): never {
    let message: string = 'Gap encountered';

    if (tokenAssociationBeforeGap) {
      message += ' before ' + this._formatTokenAssociation(tokenAssociationBeforeGap);
    }

    if (tokenAssociationAfterGap) {
      message += ' after ' + this._formatTokenAssociation(tokenAssociationAfterGap);
    }

    message += ': ' + JSON.stringify(gap.toString());
    throw new Error(message);
  }

  private _formatTokenAssociation(tokenAssociation: ITokenAssociation): string {
    return `${tokenAssociation.docNode.kind} (${JSON.stringify(tokenAssociation.tokenSequence.toString())})`;
  }
}
