import { TextRange } from './TextRange';
import { Token } from './Token';
import { DocComment } from '../nodes';
import { TSDocConfiguration } from './TSDocConfiguration';
import { ParserMessageLog } from './ParserMessageLog';

/**
 * An internal data structure that tracks all the state being built up by the various
 * parser stages.
 */
export class ParserContext {
  /**
   * The configuration that was provided for the TSDocParser.
   */
  public readonly configuration: TSDocConfiguration;

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
   * The parsed doc comment object.  This is the primary output of the parser.
   */
  public readonly docComment: DocComment;

  /**
   * A queryable log that reports warnings and error messages that occurred during parsing.
   */
  public readonly log: ParserMessageLog;

  public constructor(configuration: TSDocConfiguration, sourceRange: TextRange) {
    this.configuration = configuration;
    this.sourceRange = sourceRange;

    this.docComment = new DocComment({ configuration: this.configuration });

    this.log = new ParserMessageLog();
  }
}
