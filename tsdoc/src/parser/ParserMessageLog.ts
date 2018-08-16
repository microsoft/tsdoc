import { ParserMessage } from './ParserMessage';
import { TextRange } from './TextRange';
import { TokenSequence } from './TokenSequence';
import { DocNode } from '../nodes/DocNode';

/**
 * Used to report errors and warnings that occurred during parsing.
 */
export class ParserMessageLog {
  private _messages: ParserMessage[] = [];

  /**
   * The unfiltered list of all messages.
   */
  public get messages(): ReadonlyArray<ParserMessage> {
    return this._messages;
  }

  /**
   * Append a message to the log.
   */
  public addMessage(parserMessage: ParserMessage): void {
    this._messages.push(parserMessage);
  }

  /**
   * Append a message associated with a TextRange.
   */
  public addMessageForTextRange(messageText: string, textRange: TextRange): void {
    this.addMessage(new ParserMessage({
      messageText,
      textRange
    }));
  }

  /**
   * Append a message associated with a TokenSequence.
   */
  public addMessageForTokenSequence(messageText: string, tokenSequence: TokenSequence, docNode?: DocNode): void {
    this.addMessage(new ParserMessage({
      messageText,
      textRange: tokenSequence.parserContext.tokens[tokenSequence.startIndex].range,
      tokenSequence,
      docNode
    }));
  }
}
