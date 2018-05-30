/**
 * Text coordinates represented as a line number and column number.
 *
 * @remarks
 * The first character in a file is considered to be in column 1 of line 1.
 * The location with column 0 and line 0 is used to represent an empty, unspecified,
 * or unknown location.
 */
export interface ITextLocation {
  line: number;
  column: number;
}

/**
 * Efficiently references a range of text from a string buffer.
 */
export class TextRange {
  /**
   * Used to represent an empty or unknown range.
   */
  public static readonly empty: TextRange = new TextRange('', 0, 0);

  /**
   * The starting index into the associated text buffer.
   */
  public readonly pos: number;

  /**
   * The (non-inclusive) ending index for the associated text buffer.
   * For example if the string is called `text`, then the range would correspond
   * to `text.substring(pos, end)`.
   */
  public readonly end: number;

  /**
   * The string buffer that the `pos` and `end` indexes refer to.
   */
  public readonly buffer: string;

  /**
   * Constructs a TextRange that corresponds to an entire string object.
   */
  public static fromString(buffer: string): TextRange {
    return new TextRange(buffer, 0, buffer.length);
  }

  /**
   * Constructs a TextRange that corresponds to an entire string object.
   */
  public static fromStringRange(buffer: string, pos: number, end: number): TextRange {
    return new TextRange(buffer, pos, end);
  }

  /**
   * Constructs a TextRange that corresponds to a different range of an existing buffer.
   */
  public getNewRange(pos: number, end: number): TextRange {
    return new TextRange(this.buffer, pos, end);
  }

  /**
   * Returns the range from the associated string buffer.
   */
  public toString(): string {
    return this.buffer.substring(this.pos, this.end);
  }

  /**
   * Calculates the line and column number for the specified offset into the buffer.
   *
   * @remarks
   * This is a potentially expensive operation.
   *
   * @param index - an integer offset
   * @param buffer - the buffer
   */
  public getLocation(index: number): ITextLocation {
    // TODO: Consider caching or optimizing this somehow
    let line: number = 0;
    let column: number = 0;

    if (index < 0 || index > this.buffer.length) {
      // No match
      return { line, column };
    }

    let currentIndex: number = 0;

    let pendingNewline: boolean = true;

    while (currentIndex <= index) {
      const current: string = this.buffer[currentIndex];
      ++currentIndex;

      // CR
      if (current === '\r') {
        // Ignore '\r' and assume it will always have an accompanying '\n'
        continue;
      }

      const newLine: boolean = pendingNewline;
      pendingNewline = false;

      if (current === '\n') {
        // We consider the '\n' itself to appear on the next column.
        // The following character starts the new line.
        pendingNewline = true;
        ++column;
      } else {
        // Otherwise assume it's a printing character
        ++column;
      }

      if (newLine) {
        ++line;
        column = 1;
      }
    }

    return { line, column };
  }

  private constructor(buffer: string, pos: number, end: number) {
    this.buffer = buffer;
    this.pos = pos;
    this.end = end;
    this._validateBounds();
  }

  private _validateBounds(): TextRange {
    if (this.pos < 0) {
      throw new Error('TextRange.pos cannot be negative');
    }
    if (this.end < 0) {
      throw new Error('TextRange.end cannot be negative');
    }
    if (this.end < this.pos) {
      throw new Error('TextRange.end cannot be smaller than TextRange.pos');
    }
    if (this.pos > this.buffer.length) {
      throw new Error('TextRange.pos cannot exceed the associated text buffer length');
    }
    if (this.end > this.buffer.length) {
      throw new Error('TextRange.end cannot exceed the associated text buffer length');
    }

    return this;
  }
}
