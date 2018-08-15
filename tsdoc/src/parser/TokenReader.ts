import { Token, TokenKind } from './Token';
import { TokenSequence } from './TokenSequence';
import { ParserContext } from './ParserContext';

/**
 * Manages a stream of tokens that are read by the parser.
 *
 * @remarks
 * Use TokenReader.readToken() to read a token and advance the stream pointer.
 * Use TokenReader.peekToken() to preview the next token.
 * Use TokeNreader.createMarker() and backtrackToMarker() to rewind to an earlier point.
 * Whenever readToken() is called, the token is added to an accumulated TokenSequence
 * that can be extracted by calling extractAccumulatedSequence().
 */
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

  /**
   * Extracts and returns the TokenSequence that was accumulated so far by calls to readToken().
   * The next call to readToken() will start a new accumulated sequence.
   */
  public extractAccumulatedSequence(): TokenSequence {
    if (this._rangeStartIndex === this._currentIndex) {
      // If this happens, it indicates a parser bug:
      throw new Error('Parser assertion failed: The queue should not be empty when'
        + ' extractAccumulatedSequence() is called');
    }

    const sequence: TokenSequence = new TokenSequence({
      parserContext: this._parserContext,
      startIndex: this._rangeStartIndex,
      endIndex: this._currentIndex
    });

    this._rangeStartIndex = this._currentIndex;

    return sequence;
  }

  /**
   * Returns true if the accumulated sequence has any tokens yet.  This will be false
   * when the TokenReader starts, and it will be false immediately after a call
   * to extractAccumulatedSequence().  Otherwise, it will become true whenever readToken()
   * is called.
   */
  public isAccumulatedSequenceEmpty(): boolean {
    return this._rangeStartIndex === this._currentIndex;
  }

  /**
   * Like extractAccumulatedSequence(), but returns undefined if nothing has been
   * accumulated yet.
   */
  public tryExtractAccumulatedSequence(): TokenSequence | undefined {
    if (this.isAccumulatedSequenceEmpty()) {
      return undefined;
    }
    return this.extractAccumulatedSequence();
  }

  /**
   * Asserts that isAccumulatedSequenceEmpty() should return false.  If not, an exception
   * is throw indicating a parser bug.
   */
  public assertAccumulatedSequenceIsEmpty(): void {
    if (!this.isAccumulatedSequenceEmpty()) {
      // If this happens, it indicates a parser bug:
      const sequence: TokenSequence = new TokenSequence({
        parserContext: this._parserContext,
        startIndex: this._rangeStartIndex,
        endIndex: this._currentIndex
      });
      const tokenStrings: string[] = sequence.tokens.map(x => x.toString());
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
   * The token will also be appended to the accumulated sequence, which can
   * later be accessed via extractAccumulatedSequence().
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

  /**
   * Remembers the current position in the stream.
   */
  public createMarker(): number {
    return this._currentIndex;
  }

  /**
   * Rewinds the stream pointer to a previous position in the stream.
   */
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
