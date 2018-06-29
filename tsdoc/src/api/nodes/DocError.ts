import { DocNode, DocNodeKind, IDocNodeParameters } from './DocNode';

/**
 * Constructor parameters for {@link DocError}.
 */
export interface IDocErrorParameters extends IDocNodeParameters {
}

/**
 * Represents a span of comment text that contained invalid markup.
 * The characters should be rendered as plain text.
 */
export class DocError extends DocNode {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.Error;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocErrorParameters) {
    super(parameters);
  }
}
