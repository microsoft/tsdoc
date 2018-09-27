import { DocNode, DocNodeLeaf } from '../../nodes';
import { TokenSequence } from '../TokenSequence';
import { ParserContext } from '../ParserContext';
import { TokenKind, Token } from '../Token';

interface ITokenAssociation {
  docNode: DocNode;
  tokenSequence: TokenSequence;
}

export class TokenCoverageChecker {
  private readonly _parserContext: ParserContext;
  private readonly _tokenAssocations: (ITokenAssociation | undefined)[];

  public constructor(parserContext: ParserContext) {
    this._parserContext = parserContext;
    this._tokenAssocations = [];
    this._tokenAssocations.length = parserContext.tokens.length;
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
    if (node instanceof DocNodeLeaf) {
      if (node.excerpt) {
        if (node.excerpt.content) {
          this._addSequence(node.excerpt.content, node);
        }
        if (node.excerpt.spacingAfterContent) {
          this._addSequence(node.excerpt.spacingAfterContent, node);
        }
      }
    }

    for (const childNode of node.getChildNodes()) {
      this._addNodeTree(childNode);
    }
  }

  private _addSequence(tokenSequence: TokenSequence, docNode: DocNode): void {
    const newTokenAssociation: ITokenAssociation = { docNode, tokenSequence };

    for (let i: number = tokenSequence.startIndex; i < tokenSequence.endIndex; ++i) {
      const tokenAssociation: ITokenAssociation | undefined = this._tokenAssocations[i];
      if (tokenAssociation) {
        throw new Error(`Overlapping content encountered between`
          + ` ${this._formatTokenAssociation(tokenAssociation)} and`
          + ` ${this._formatTokenAssociation(newTokenAssociation)}`);
      }

      this._tokenAssocations[i] = newTokenAssociation;
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

      const tokenAssociation: ITokenAssociation | undefined = this._tokenAssocations[i];

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

  private _reportGap(gap: TokenSequence, tokenAssociationBeforeGap: ITokenAssociation | undefined,
    tokenAssociationAfterGap: ITokenAssociation | undefined): never {
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
