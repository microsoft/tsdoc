/**
 * An interface for a builder object that allows a large text string to be constructed incrementally by appending
 * small chunks.
 *
 * @remarks
 *
 * {@link StringBuilder} is the default implementation of this contract.
 */
export interface IStringBuilder {
  /**
   * Append the specified text to the buffer.
   */
  append(text: string): void;

  /**
   * Renders the text as a string.
   */
  getText(): string;
}

/**
 * This class allows a large text string to be constructed incrementally by appending small chunks.  The final
 * string can be obtained by calling StringBuilder.toString().
 *
 * @remarks
 * A naive approach might use the `+=` operator to append strings:  This would have the downside of copying
 * the entire string each time a chunk is appended, resulting in `O(n^2)` bytes of memory being allocated
 * (and later freed by the garbage  collector), and many of the allocations could be very large objects.
 * StringBuilder avoids this overhead by accumulating the chunks in an array, and efficiently joining them
 * when `getText()` is finally called.
 */
export class StringBuilder implements IStringBuilder {
  private _chunks: string[];

  constructor() {
    this._chunks = [];
  }

  /** {@inheritdoc IStringBuilder.append} */
  public append(text: string): void {
    this._chunks.push(text);
  }

  /** {@inheritdoc IStringBuilder.getText} */
  public getText(): string {
    if (this._chunks.length === 0) {
      return '';
    }

    if (this._chunks.length > 1) {
      const joined: string = this._chunks.join('');
      this._chunks.length = 1;
      this._chunks[0] = joined;
    }

    return this._chunks[0];
  }

  /**
   * A shorthand for `StringBuilder.getText()`.
   *
   * @remarks
   *
   * The `getText()` method is preferred in TypeScript, since the type system allows `Object.toString()` to be called
   * for many objects that do not provide a useful implementation.
   */
  public toString(): string {
    return this.getText();
  }
}
