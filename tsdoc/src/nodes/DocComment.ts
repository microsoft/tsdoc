import { DocNodeContainer, DocNodeKind, IDocNodeContainerParameters } from './DocNode';
import { ParserContext } from '../parser/ParserContext';

/**
 * Constructor parameters for {@link DocComment}.
 */
export interface IDocCommentParameters extends IDocNodeContainerParameters {
  parserContext: ParserContext;
}

/**
 * Represents an entire parsed documentation comment.  This is typically the
 * root of the expression tree returned by the parser.
 */
export class DocComment extends DocNodeContainer {

  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.Comment;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocCommentParameters) {
    super(parameters);
  }
}
