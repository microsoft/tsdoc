import { TextRange } from './TextRange';
import { TextBuffer, ITextLocation } from '../internal/TextBuffer';

/**
 * An Error subclass used to report errors that occur while parsing an input.
 */
export class ParseError extends Error {
  public readonly range: TextRange;
  public readonly buffer: string;
  public readonly unformattedMessage: string;
  public readonly innerError: Error | undefined;

  /**
   * Generates a line/column prefix.  Example with line=2 and column=5
   * and message="An error occurred":
   * ```
   * "(2,5): An error occurred"
   * ```
   */
  private static _formatMessage(message: string, range: TextRange, buffer: string): string {
    if (!message) {
      message = 'An unknown error occurred';
    }

    if (range.pos !== 0 || range.end !== 0) {
      const location: ITextLocation = TextBuffer.getLocation(range.pos, buffer);
      if (location.line) {
        return `(${location.line},${location.column}): ` + message;
      }
    }
    return message;
  }

  public constructor(message: string, range: TextRange, buffer: string, innerError?: Error) {
    super(ParseError._formatMessage(message, range, buffer));

    // Boilerplate for extending a system class
    //
    // tslint:disable-next-line:max-line-length
    // https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    //
    // IMPORTANT: The prototype must also be set on any classes which extend this one
    (this as any).__proto__ = ParseError.prototype; // tslint:disable-line:no-any

    this.unformattedMessage = message;

    this.range = range;
    this.buffer = buffer;
    this.innerError = innerError;
  }
}
