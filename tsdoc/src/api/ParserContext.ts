import { TextRange } from './TextRange';
import { Token } from './Tokenizer';
import { ParseError } from './ParseError';

export class ParserContext {
  /**
   * The input text
   */
  public sourceRange: TextRange;

  /**
   * The range from the opening comment delimiter ("/**" to the closing comment delimiter.
   */
  public commentRange: TextRange;

  /**
   * The line ranges inside the doc comment.
   */
  public lines: TextRange[];

  /**
   * The list of tokens extracted from the lines.
   */
  public tokens: Token[];

  public parseErrors: ParseError[];

  public constructor(range: TextRange) {
    this.sourceRange = range;
    this.commentRange = TextRange.empty;
    this.lines = [];
    this.tokens = [];
    this.parseErrors = [];
  }

  public addError(range: TextRange, message: string, pos: number, end?: number): void {
    if (!end) {
      if (pos + 1 <= range.buffer.length) {
        end = pos + 1;
      } else {
        end = pos;
      }
    }
    this.parseErrors.push(
      new ParseError(message, range.getNewRange(pos, end))
    );
  }
}
