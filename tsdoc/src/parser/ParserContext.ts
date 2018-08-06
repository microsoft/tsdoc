import { TextRange } from './TextRange';
import { Token } from './Token';
import { ParseError } from './ParseError';
import { DocComment } from '../nodes';

/**
 * An internal data structure that tracks all the state being built up by the various
 * parser stages.
 */
export class ParserContext {
  /**
   * The `sourceRange` indicates the start and end of the original input that was parsed.
   */
  public readonly sourceRange: TextRange;

  /**
   * The text range starting from the opening `/**` and ending with
   * the closing `*\/` delimiter.
   */
  public commentRange: TextRange = TextRange.empty;

  /**
   * The text ranges corresponding to the lines of content inside the comment.
   */
  public lines: TextRange[] = [];

  /**
   * A complete list of all tokens that were extracted from the input lines.
   */
  public tokens: Token[] = [];

  /**
   * The doc comment object that was constructed from parsing the tokens.
   */
  public readonly docComment: DocComment;

  /**
   * If any errors occurred during parsing, they are returned in this list.
   */
  public readonly parseErrors: ParseError[] = [];

  public constructor(sourceRange: TextRange) {
    this.sourceRange = sourceRange;
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
