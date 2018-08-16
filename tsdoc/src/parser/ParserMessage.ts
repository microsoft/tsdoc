import { TextRange, ITextLocation } from './TextRange';
import { TokenSequence } from './TokenSequence';
import { DocNode } from '../nodes/DocNode';

/**
 * Constructor parameters for {@link ParserMessage}.
 */
export interface IParserMessageParameters {
  messageText: string;
  textRange: TextRange;
  tokenSequence?: TokenSequence;
  docNode?: DocNode;
}

/**
 * Represents an error or warning that occurred during parsing.
 */
export class ParserMessage {
  /**
   * The message text.
   */
  public readonly text: string;

  /**
   * The message text without the default prefix that shows line/column information.
   */
  public readonly unformattedText: string;

  public readonly textRange: TextRange;

  public readonly tokenSequence: TokenSequence | undefined;

  public readonly docNode: DocNode | undefined;

  /**
   * Generates a line/column prefix.  Example with line=2 and column=5
   * and message="An error occurred":
   * ```
   * "(2,5): An error occurred"
   * ```
   */
  private static _formatMessageText(message: string, range: TextRange): string {
    if (!message) {
      message = 'An unknown error occurred';
    }

    if (range.pos !== 0 || range.end !== 0) {
      const location: ITextLocation = range.getLocation(range.pos);
      if (location.line) {
        return `(${location.line},${location.column}): ` + message;
      }
    }
    return message;
  }

  public constructor(parameters: IParserMessageParameters) {
    this.unformattedText = parameters.messageText;
    this.textRange = parameters.textRange;
    this.tokenSequence = parameters.tokenSequence;
    this.docNode = parameters.docNode;

    this.text = ParserMessage._formatMessageText(this.unformattedText, this.textRange);
  }

  public toString(): string {
    return this.text;
  }
}
