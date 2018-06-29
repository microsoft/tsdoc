import { ParserContext } from './ParserContext';
import { Token, TokenKind, Tokenizer } from './Tokenizer';
import { DocNode } from './nodes/DocNode';
import { DocPlainText } from './nodes/DocPlainText';
import { DocHtmlTag } from './nodes/DocHtmlTag';
import { DocBackslashEscape } from './nodes/DocBackslashEscape';
import { DocError } from './nodes/DocError';

export class NodeParser {
  private _tokens: Token[] = [];
  // The index into the _tokens array, of the current token being processed.
  private _tokenIndex: number = 0;

  /**
   * The output list of nodes that was parsed from the input tokens.
   */
  private _nodes: DocNode[] = [];

  /**
   * When we are accumulating a DocPlainText node, these are the tokens.
   */
  private _accumulatedPlainText: Token[];

  public constructor(parserContext: ParserContext) {
    this._tokens = parserContext.tokens;
    this._accumulatedPlainText = [];
  }

  public parse(): DocNode[] {

    while (true) {
      // Extract the next token
      const token: Token = this._tokens[this._tokenIndex];

      if (token.kind === TokenKind.EndOfInput) {
        break;
      }

      const nextToken: Token = this._tokens[this._tokenIndex + 1];

      switch (token.kind) {
        case TokenKind.Backslash:
          this._pushAccumulatedPlainText();

          // In CommonMark, a backslash is only allowed before a punctuation
          // character.  In all other context, the backslash is interpreted as a
          // literal character.
          if (Tokenizer.isPunctuation(nextToken.kind)) {
            this._nodes.push(new DocBackslashEscape({
              tokens: [ token, nextToken ]
            }));
            this._tokenIndex += 2; // extract both tokens
          } else {
            this._nodes.push(new DocError({
              tokens: [ token ]
            }));
            ++this._tokenIndex; // extract only the error token
          }
          break;
        case TokenKind.LessThan:
          this._pushAccumulatedPlainText();
          this._parseHtmlElement();
          break;
        default:
          // If nobody recognized this token, then accumulate plain text
          this._accumulatedPlainText.push(token);
          ++this._tokenIndex; // extract token
          break;
      }
    }
    this._pushAccumulatedPlainText();

    return this._nodes;
  }

  private _parseHtmlElement(): void {
    for (let i: number = this._tokenIndex; i < this._tokens.length; ++i) {
      const scannedToken: Token = this._tokens[i];
      if (scannedToken.kind === TokenKind.GreaterThan) {
        // Found the matching ">"
        this._nodes.push(
          new DocHtmlTag({
            tokens: this._tokens.slice(this._tokenIndex, i)
          })
        );
        this._tokenIndex = i + 1;
        return;
      }
    }
    // Otherwise it's an error
    this._nodes.push(new DocError({
      tokens: [ this._tokens[this._tokenIndex] ]
    }));
    ++this._tokenIndex;
  }

  private _pushAccumulatedPlainText(): void {
    if (this._accumulatedPlainText.length > 0) {
      this._nodes.push(
        new DocPlainText(
          {
            tokens: this._accumulatedPlainText
          }
        )
      );
      this._accumulatedPlainText = [];
    }
  }
}
