import { ParserContext } from './ParserContext';
import { TokenSequence } from './TokenSequence';

export interface IExcerptParameters {
  prefix: TokenSequence;
  suffix?: TokenSequence;
  separator?: TokenSequence;
}

/**
 * When a DocNode is constructed by parsing input text, the Excerpt object is used to
 * annotate each node with the associated tokens that were parsed.  This is useful
 * e.g. for highlighting the corresponding input characters to indicate a refactoring
 * match or error location.
 *
 * @remarks
 * The excerpt is separated into three token sequences: the "prefix" (which is the main textual
 * content for the node), the "suffix" (which captures a closing delimiter which sometimes
 * appears after child nodes), and the "separator" which captures whitespace separating
 * child nodes.
 *
 * For example, suppose the TSDoc parser processes this input: `<a href="#" target="_top">`
 * The parent node will be DocHtmlStartTag with prefix=`<a ` and suffix=`>` with no separator.
 * There will be two child nodes of type DocHtmlAttribute.  The first one will have
 * prefix=`href="#"`, no suffix (since it has no children) and separator=` `.
 */
export class Excerpt {
  /**
   * The ParserContext object from the parser invocation that processed the input.
   */
  public readonly parserContext: ParserContext;

  /**
   * The main textual content for the associated node.
   */
  public readonly prefix: TokenSequence;

  /**
   * An optional suffix that captures any delimiters that might appear after the
   * child nodes.  If there are no child nodes, this is always an empty list.
   */
  public readonly suffix: TokenSequence;

  /**
   * Captures any whitespace that may separate this node from a sibling that follows it.
   * The tokens will always be of type Spacing or Newline.
   */
  public readonly separator: TokenSequence;

  public constructor(parameters: IExcerptParameters) {
    this.parserContext = parameters.prefix.parserContext;
    this.prefix = parameters.prefix;
    this.suffix = parameters.suffix || TokenSequence.createEmpty(this.parserContext);
    this.separator = parameters.separator || TokenSequence.createEmpty(this.parserContext);
  }
}
