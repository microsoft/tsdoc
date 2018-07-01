import { DocNodeLeaf, DocNodeKind, IDocNodeLeafParameters } from './DocNode';

/**
 * Constructor parameters for {@link DocWord}.
 */
export interface IDocWordParameters extends IDocNodeLeafParameters {
}

/**
 * Represents a word.  For example, in `<custom-element attr="123"/>`
 * the substrings "custom-element" and "attr" are considered words.
 */
export class DocWord extends DocNodeLeaf {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.Word;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocWordParameters) {
    super(parameters);
  }
}
