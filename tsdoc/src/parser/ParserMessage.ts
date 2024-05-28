// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import type { TextRange, ITextLocation } from './TextRange';
import type { TokenSequence } from './TokenSequence';
import type { DocNode } from '../nodes/DocNode';
import type { TSDocMessageId } from './TSDocMessageId';

/**
 * Constructor parameters for {@link ParserMessage}.
 */
export interface IParserMessageParameters {
  messageId: TSDocMessageId;
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
   * A string that uniquely identifies the messages reported by the TSDoc parser.
   */
  public readonly messageId: TSDocMessageId;

  /**
   * The message text without the default prefix that shows line/column information.
   */
  public readonly unformattedText: string;

  public readonly textRange: TextRange;

  public readonly tokenSequence: TokenSequence | undefined;

  public readonly docNode: DocNode | undefined;

  private _text: string | undefined;

  public constructor(parameters: IParserMessageParameters) {
    this.messageId = parameters.messageId;
    this.unformattedText = parameters.messageText;
    this.textRange = parameters.textRange;
    this.tokenSequence = parameters.tokenSequence;
    this.docNode = parameters.docNode;
    this._text = undefined;
  }

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
      // NOTE: This currently a potentially expensive operation, since TSDoc currently doesn't
      // have a full newline analysis for the input buffer.
      const location: ITextLocation = range.getLocation(range.pos);
      if (location.line) {
        return `(${location.line},${location.column}): ` + message;
      }
    }
    return message;
  }

  /**
   * The message text.
   */
  public get text(): string {
    if (this._text === undefined) {
      // NOTE: This currently a potentially expensive operation, since TSDoc currently doesn't
      // have a full newline analysis for the input buffer.
      this._text = ParserMessage._formatMessageText(this.unformattedText, this.textRange);
    }
    return this._text;
  }

  public toString(): string {
    return this.text;
  }
}
