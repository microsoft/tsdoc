import { DocNodeLeaf, DocNodeKind, IDocNodeLeafParameters } from './DocNode';

/**
 * Constructor parameters for {@link DocDelimiter}.
 */
export interface IDocDelimiterParameters extends IDocNodeLeafParameters {
}

/**
 * Represents some characters that are used as a delimiter for the surrounding
 * context.  For example, in `<a href="#" />` the delimiters are `<`, `=`, and `/>`.
 */
export class DocDelimiter extends DocNodeLeaf {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.Delimiter;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocDelimiterParameters) {
    super(parameters);
  }
}
