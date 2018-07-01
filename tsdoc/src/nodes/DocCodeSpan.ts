import { DocNodeKind, IDocNodeContainerParameters, DocNodeContainer } from './DocNode';

/**
 * Constructor parameters for {@link DocCodeSpan}.
 */
export interface IDocCodeSpanParameters extends IDocNodeContainerParameters {
}

/**
 * Represents code span, i.e. computer code surrounded by backtick characters.
 */
export class DocCodeSpan extends DocNodeContainer {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.CodeSpan;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocCodeSpanParameters) {
    super(parameters);
  }
}
