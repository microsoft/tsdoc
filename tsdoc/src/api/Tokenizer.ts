import { TextRange } from './TextRange';

export enum TokenKind {
  PlainText,
  Newline,
  EndOfInput
}

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

interface ICharacter {
  value: string;
  index: number;
}

export class Tokenizer {
  /**
   * The array of doc comment lines being tokenized.
   * These ranges do not include doc comment delimiters such as "/*" or "*".
   */
  public readonly lines: TextRange[];

  // The TextRange.buffer shared for the lines, which are assumed to all share
  // a common buffer
  private _buffer: string;

  // Index into the lines array
  private _linesIndex: number;

  // This is a cached pointer to this.lines[this._linesIndex].
  private _currentLine: TextRange | undefined;

  // index into the TextRange's buffer
  private _bufferIndex: number;

  private _injectingNewline: boolean;

  // If we've reached the end of the input, this is the final Token object
  private _endToken: Token | undefined;

  private _peekedCharacter: ICharacter | undefined;

  public constructor(lines: TextRange[]) {
    this.lines = lines;
    this._linesIndex = 0;
    if (this.lines.length === 0) {
      this._buffer = '';
      this._currentLine = undefined;
      this._bufferIndex = 0;
      this._endToken = new Token(TokenKind.EndOfInput, TextRange.empty);
    } else {
      this._buffer = this.lines[0].buffer;
      this._currentLine = this.lines[0];
      this._bufferIndex = this._currentLine.pos;
      this._endToken = undefined;
    }
    this._injectingNewline = false;
    this._peekedCharacter = undefined;
  }

  public getToken(): Token {
    if (this._endToken) {
      return this._endToken;
    }

    const startCharacter: ICharacter = this._getCharacter();

    switch (startCharacter.value) {
      case '':
        return this._endToken!;
      case '\n':
        return new Token(TokenKind.Newline, TextRange.fromStringRange(
          this._buffer, startCharacter.index, startCharacter.index));
      default:
        this._skipUntil(['\n']);
        return new Token(TokenKind.PlainText, TextRange.fromStringRange(
          this._buffer, startCharacter.index, this._peekCharacter().index));
    }
  }

  private _skipUntil(endingCharacters: string[]): void {
    while (true) {
      const character: ICharacter = this._peekCharacter();

      if (character.value === '' || endingCharacters.indexOf(character.value) >= 0) {
        return;
      }
      this._getCharacter();
    }
  }

  /**
   * Extracts the next virtual character from the input lines.
   * After each line, a '\n' character is returned.
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
      return { value: '', index: this._endToken.range.pos };
    }
    if (!this._currentLine) {
      // Sanity check
      throw new Error('Tokenizer._currentLine should not be undeifned');
    }

    while (true) {
      if (this._bufferIndex < this._currentLine.end) {
        return {
          value: this._buffer[this._bufferIndex],
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
          this._currentLine.getNewRange(this._currentLine.end, this._currentLine.end));
        return { value: '', index: this._endToken.range.pos };
      }

      this._currentLine = this.lines[this._linesIndex];
      this._bufferIndex = this._currentLine.pos;
    }
  }

  /**
   * Similar to _getCharacter(), except it does not advance the input stream pointer.
   */
  private _peekCharacter(): ICharacter {
    if (this._peekedCharacter === undefined) {
      this._peekedCharacter = this._getCharacter();
    }
    return this._peekedCharacter;
  }
}
