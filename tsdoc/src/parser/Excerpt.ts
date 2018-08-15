import { ParserContext } from './ParserContext';
import { TokenSequence } from './TokenSequence';

export interface IExcerptParameters {
  content: TokenSequence;
  spacingAfterContent?: TokenSequence;
}

/**
 * When a DocNode is constructed by parsing input text, the Excerpt object is used to
 * annotate each node with the associated tokens that were parsed.  This is useful
 * e.g. for highlighting the corresponding input characters to indicate a refactoring
 * match or error location.
 *
 * @remarks
 * The excerpt is separated into two token sequences: The "content" sequence is
 * the main textual content for the node.  The "spacingAfterContent" optionally captures
 * following whitespace, in cases where that whitespace is not interesting.
 * (For example, it is not used with DocPlainText since spacing is part of the normal
 * plain text content.)
 */
export class Excerpt {
  /**
   * The ParserContext object from the parser invocation that processed the input.
   */
  public readonly parserContext: ParserContext;

  /**
   * The main textual content for the associated node.
   */
  public readonly content: TokenSequence;

  /**
   * Captures any whitespace that may separate this node from a sibling that follows it.
   * The tokens will always be of type Spacing or Newline.
   */
  public readonly spacingAfterContent: TokenSequence;

  public constructor(parameters: IExcerptParameters) {
    this.parserContext = parameters.content.parserContext;
    this.content = parameters.content;
    this.spacingAfterContent = parameters.spacingAfterContent || TokenSequence.createEmpty(this.parserContext);
  }
}
