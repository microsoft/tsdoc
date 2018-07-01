import { DocNodeLeaf, DocNodeKind, IDocNodeLeafParameters } from './DocNode';

/**
 * Constructor parameters for {@link DocNewline}.
 */
export interface IDocNewlineParameters extends IDocNodeLeafParameters {
}

/**
 * Represents a newline in the original doc comment.  The newline node has
 * a special role when rendering the AST: It is the place where parent
 * containers such as DocComment may inject a line prefix.
 */
export class DocNewline extends DocNodeLeaf {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.Newline;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocNewlineParameters) {
    super(parameters);
  }
}
