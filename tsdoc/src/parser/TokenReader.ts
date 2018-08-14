import { Token, TokenKind } from './Token';
import { TokenSequence } from './TokenSequence';
import { ParserContext } from './ParserContext';

export class TokenReader {
  public readonly tokens: ReadonlyArray<Token>;

  private readonly _parserContext: ParserContext;
  private _rangeStartIndex: number;
  private _currentIndex: number;

  public constructor(parserContext: ParserContext) {
    this._parserContext = parserContext;
    this.tokens = parserContext.tokens;
    this._rangeStartIndex = 0;
    this._currentIndex = 0;
  }

  public extractQueue(): TokenSequence {
    if (this._rangeStartIndex === this._currentIndex) {
      // If this happens, it indicates a parser bug:
      throw new Error('Parser assertion failed: The queue should not be empty when extractQueue() is called');
    }

    const range: TokenSequence = new TokenSequence({
      parserContext: this._parserContext,
      pos: this._rangeStartIndex,
      end: this._currentIndex
    });

    this._rangeStartIndex = this._currentIndex;

    return range;
  }

  public isQueueEmpty(): boolean {
    return this._rangeStartIndex === this._currentIndex;
  }

  public assertQueueEmpty(): void {
    if (!this.isQueueEmpty()) {
      // If this happens, it indicates a parser bug:
      const range: TokenSequence = new TokenSequence({
        parserContext: this._parserContext,
        pos: this._rangeStartIndex,
        end: this._currentIndex
      });
      const tokenStrings: string[] = range.tokens.map(x => x.toString());
      throw new Error('Parser assertion failed: The queue should be empty, but it contains:\n'
        + JSON.stringify(tokenStrings));
    }
  }

  /**
   * Show the next token that will be returned by _readToken(), without
   * consuming anything.
   */
  public peekToken(): Token {
    return this.tokens[this._currentIndex];
  }

  /**
   * Show the TokenKind for the next token that will be returned by _readToken(), without
   * consuming anything.
   */
  public peekTokenKind(): TokenKind {
    return this.tokens[this._currentIndex].kind;
  }

  /**
   * Show the TokenKind for the token after the next token that will be returned by _readToken(),
   * without consuming anything.  In other words, look ahead two tokens.
   */
  public peekTokenAfterKind(): TokenKind {
    if (this._currentIndex + 1 >= this.tokens.length) {
      return TokenKind.None;
    }
    return this.tokens[this._currentIndex + 1].kind;
  }

  /**
   * Extract the next token from the input stream and return it.
   */
  public readToken(): Token {
    if (this._currentIndex >= this.tokens.length) {
      // If this happens, it's a parser bug
      throw new Error('Cannot read past end of stream');
    }
    const token: Token = this.tokens[this._currentIndex];
    if (token.kind === TokenKind.EndOfInput) {
      // We don't allow reading the EndOfInput token, because we want _peekToken()
      // to be always guaranteed to return a valid result.

      // If this happens, it's a parser bug
      throw new Error('The EndOfInput token cannot be read');
    }
    this._currentIndex++;
    return token;
  }

  /**
   * Returns the kind of the token immediately before the current token.
   */
  public peekPreviousTokenKind(): TokenKind {
    if (this._currentIndex === 0) {
      return TokenKind.None;
    }
    return this.tokens[this._currentIndex - 1].kind;
  }

  public createMarker(): number {
    return this._currentIndex;
  }

  public backtrackToMarker(marker: number): void {
    if (marker > this._currentIndex) {
      // If this happens, it's a parser bug
      throw new Error('The marker has expired');
    }

    this._currentIndex = marker;
    if (marker < this._rangeStartIndex) {
      this._rangeStartIndex = marker;
    }
  }
}
