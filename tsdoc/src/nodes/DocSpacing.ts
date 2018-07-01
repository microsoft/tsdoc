import { DocNodeLeaf, DocNodeKind, IDocNodeLeafParameters } from './DocNode';

/**
 * Constructor parameters for {@link DocSpacing}.
 */
export interface IDocSpacingParameters extends IDocNodeLeafParameters {
}

/**
 * Represents whitespace found in the input.
 */
export class DocSpacing extends DocNodeLeaf {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.Spacing;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocSpacingParameters) {
    super(parameters);
  }
}
