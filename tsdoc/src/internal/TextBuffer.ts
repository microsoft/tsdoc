
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
 * Operations relating to a string that acts as a text buffer
 */
export class TextBuffer {
  /**
   * Calculates the line and column number for the specified offset into the buffer.
   *
   * @remarks
   * This is a potentially expensive operation.
   *
   * @param offset - an integer offset
   * @param buffer - the buffer
   */
  public static getLocation(offset: number, buffer: string): ITextLocation {
    let line: number = 1;
    let column: number = 1;

    let index: number = 0;

    if (offset >= 0 && offset < buffer.length) {
      while (index < offset) {
        const c: string = buffer[index];
        ++index;

        if (c === '\r') {
          continue;
        }

        if (buffer[index] === '\n') {
          ++line;
          column = 1;
          continue;
        }

        ++column;
      }

      return { line: line, column: column };
    }

    // No match
    return { line: 0, column: 0 };
  }
}
