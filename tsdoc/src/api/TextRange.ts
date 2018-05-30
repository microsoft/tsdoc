
/**
 * Efficiently references a range of text from a string buffer.
 */
export class TextRange {
  public static readonly empty: TextRange = new TextRange(0, 0);

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

  public constructor(pos: number, end: number) {
    this.pos = pos;
    this.end = end;
  }

  /**
   * Returns the range from the associated string buffer.
   */
  public getText(associatedBuffer: string): string {
    return associatedBuffer.substring(this.pos, this.end);
  }

  public validateBounds(associatedBuffer: string): void {
    if (this.pos < 0) {
      throw new Error('TextRange.pos cannot be negative');
    }
    if (this.end < 0) {
      throw new Error('TextRange.end cannot be negative');
    }
    if (this.end < this.pos) {
      throw new Error('TextRange.end cannot be smaller than TextRange.pos');
    }
    if (this.pos > associatedBuffer.length) {
      throw new Error('TextRange.pos cannot exceed the associated text buffer length');
    }
    if (this.end > associatedBuffer.length) {
      throw new Error('TextRange.end cannot exceed the associated text buffer length');
    }
  }
}
