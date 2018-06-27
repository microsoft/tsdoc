import { TextRange } from './TextRange';

/**
 * Distinguishes different types of Token objects.
 */
export enum TokenKind {
  /**
   * A token representing a sequence of plain text with no special meaning.
   */
  PlainText,
  /**
   * A token representing a virtual newline.  The Token.range will be an empty range,
   * because the actual newline character may be noncontiguous or nonexistent.
   */
  Newline,
  /**
   * A token representing the end of the input.
   */
  EndOfInput
}

/**
 * Represents a contiguous range of characters extracted from one of the doc comment lines
 * being processed by the Tokenizer.  There is a token representing a newline, but otherwise
 * a single token cannot span multiple lines.
 */
export class Token {
  public readonly kind: TokenKind;
  public readonly range: TextRange;

  public constructor(kind: TokenKind, range: TextRange) {
    this.kind = kind;
    this.range = range;
  }

  public toString(): string {
    return this.range.toString();
  }
}

/**
 * The ICharacter structure uses an empty string to represent the end of the input.
 */
const EOI_CHARACTER: string = '';

/**
 * This helps the Tokenizer keep track of indexes needed to accurately calculated Token.range,
 * given that the buffer index can skip characters when advancing to the next line inside
 * a documentation comment.
 */
interface ICharacter {
  /**
   * Either EOI_CHARACTER (an empty string) to indicate that the end of the input has been reached,
   * or else a string of length one representing a single character extracted from the input buffer.
   */
  value: string;

  /**
   * The buffer index of the character.  This is an index into Tokenizer._buffer.
   */
  index: number;
}

export class Tokenizer {
  /**
   * The array of doc comment lines being tokenized.
   * These ranges do not include doc comment delimiters such as "/*" or "*".
   */
  public readonly lines: TextRange[];

  // Index into the lines array
  private _linesIndex: number;

  // index into the TextRange's buffer
  private _bufferIndex: number;

  private _injectingNewline: boolean;

  // If we've reached the end of the input, this is the final Token object
  private _endToken: Token | undefined;

  private _peekedCharacter: ICharacter | undefined;

  // To improve performance, this is a cached storage of this.lines[this._linesIndex].
  private _cachedCurrentLine: TextRange | undefined;

  // To improve performance, this is a cached storage of TextRange.buffer for the Tokenizer.lines items.
  // The lines are assumed to all come from a common buffer.
  private readonly _cachedBuffer: string;

  public constructor(lines: TextRange[]) {
    this.lines = lines;
    this._linesIndex = 0;
    if (this.lines.length === 0) {
      this._cachedBuffer = '';
      this._cachedCurrentLine = undefined;
      this._bufferIndex = 0;
      this._endToken = new Token(TokenKind.EndOfInput, TextRange.empty);
    } else {
      this._cachedBuffer = this.lines[0].buffer;
      this._cachedCurrentLine = this.lines[0];
      this._bufferIndex = this._cachedCurrentLine.pos;
      this._endToken = undefined;
    }
    this._injectingNewline = false;
    this._peekedCharacter = undefined;
  }

  /**
   * Extracts and returns the next token from the input stream.
   * @remarks
   * When the end of the input is reached, getToken() will (repeatedly) return
   * the TokenKind.EndOfInput token.
   */
  public getToken(): Token {
    if (this._endToken) {
      return this._endToken;
    }

    const startCharacter: ICharacter = this._getCharacter();

    switch (startCharacter.value) {
      case EOI_CHARACTER:
        return this._endToken!;
      case '\n':
        return new Token(TokenKind.Newline, TextRange.fromStringRange(
          this._cachedBuffer, startCharacter.index, startCharacter.index));
      default:
        this._skipUntil(['\n']);
        return new Token(TokenKind.PlainText, TextRange.fromStringRange(
          this._cachedBuffer, startCharacter.index, this._peekCharacter().index));
    }
  }

  /**
   * Advances the stream pointer until one of the specified ending characters is reached,
   * or until the end of the input is reached.
   */
  private _skipUntil(endingCharacters: string[]): void {
    while (true) {
      const character: ICharacter = this._peekCharacter();

      if (character.value === EOI_CHARACTER) {
        return;
      }
      if (endingCharacters.indexOf(character.value) >= 0) {
        return;
      }
      this._getCharacter();
    }
  }

  /**
   * Extracts and returns the next character from the input lines.
   * After each input line is processed, a virtual newline character is returned.
   * When the end of the input is reached, an empty string is returned.
   * The length of the returned string will always be 0 or 1.
   */
  private _getCharacter(): ICharacter {
    if (this._peekedCharacter !== undefined) {
      const character: ICharacter = this._peekedCharacter;
      this._peekedCharacter = undefined;
      return character;
    }

    if (this._endToken) {
      // already reached the end of the input
      return { value: EOI_CHARACTER, index: this._endToken.range.pos };
    }
    if (!this._cachedCurrentLine) {
      // Sanity check
      throw new Error('Tokenizer._currentLine should not be undeifned');
    }

    while (true) {
      if (this._bufferIndex < this._cachedCurrentLine.end) {
        return {
          value: this._cachedBuffer[this._bufferIndex],
          index: this._bufferIndex++
        };
      }

      // When we reach the logical end of line, we inject a "\n" character (since the
      // real EOL may be disembodied by the doc comment delimiters).
      // Since we don't want to move _bufferIndex, we need a little bit of extra state.
      if (!this._injectingNewline) {
        this._injectingNewline = true;
        return {
          value: '\n',
          index: this._bufferIndex
        };
      }
      this._injectingNewline = false;

      // Advance to the next line
      ++this._linesIndex;
      if (this._linesIndex >= this.lines.length) {
        // We advanced past the final line
        this._endToken = new Token(TokenKind.EndOfInput,
          this._cachedCurrentLine.getNewRange(this._cachedCurrentLine.end, this._cachedCurrentLine.end));
        return { value: EOI_CHARACTER, index: this._endToken.range.pos };
      }

      this._cachedCurrentLine = this.lines[this._linesIndex];
      this._bufferIndex = this._cachedCurrentLine.pos;
    }
  }

  /**
   * Similar to _getCharacter(), except it does not advance the (conceptual) input stream pointer.
   */
  private _peekCharacter(): ICharacter {
    if (this._peekedCharacter === undefined) {
      this._peekedCharacter = this._getCharacter();
    }
    return this._peekedCharacter;
  }
}
