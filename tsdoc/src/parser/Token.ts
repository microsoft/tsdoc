import { TextRange } from './TextRange';

/**
 * Distinguishes different types of Token objects.
 */
export enum TokenKind {
  /**
   * A token representing the end of the input.  The Token.range will be an empty range
   * at the end of the provided input.
   */
  EndOfInput,

  /**
   * A token representing a virtual newline.
   * The Token.range will be an empty range, because the actual newline character may
   * be noncontiguous due to the doc comment delimiter trimming.
   */
  Newline,

  /**
   * A token representing one or more spaces and tabs (but not newlines or end of input).
   */
  Spacing,

  /**
   * A token representing one or more ASCII letters and numbers.
   */
  AsciiWord,

  /**
   * A single ASCII character that behaves like punctuation, e.g. doesn't need whitespace
   * around it when adjacent to a letter.  The Token.range will always be a string of length 1.
   */
  OtherPunctuation,

  /**
   * A token representing a sequence of non-ASCII printable characters that are not punctuation.
   */
  Other,

  /**
   * The backslash character `\`.
   * The Token.range will always be a string of length 1.
   */
  Backslash,

  /**
   * The less-than character `<`.
   * The Token.range will always be a string of length 1.
   */
  LessThan,

  /**
   * The greater-than character `>`.
   * The Token.range will always be a string of length 1.
   */
  GreaterThan,

  /**
   * The equals character `=`.
   * The Token.range will always be a string of length 1.
   */
  Equals,

  /**
   * The single-quote character `'`.
   * The Token.range will always be a string of length 1.
   */
  SingleQuote,

  /**
   * The double-quote character `"`.
   * The Token.range will always be a string of length 1.
   */
  DoubleQuote,

  /**
   * The slash character `/`.
   * The Token.range will always be a string of length 1.
   */
  Slash
}

/**
 * Represents a contiguous range of characters extracted from one of the doc comment lines
 * being processed by the Tokenizer.  There is a token representing a newline, but otherwise
 * a single token cannot span multiple lines.
 */
export class Token {
  /**
   * The kind of token
   */
  public readonly kind: TokenKind;
  /**
   * The contiguous input range corresponding to the token.  This range will never
   * contain a newline character.
   */
  public readonly range: TextRange;

  /**
   * The doc comment "line" that this Token was extracted from.
   */
  public readonly line: TextRange;

  public constructor(kind: TokenKind, range: TextRange, line: TextRange) {
    this.kind = kind;
    this.range = range;
    this.line = line;
  }

  public toString(): string {
    return this.range.toString();
  }
}
