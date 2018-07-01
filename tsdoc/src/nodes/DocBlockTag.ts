import { DocNodeLeaf, DocNodeKind, IDocNodeLeafParameters } from './DocNode';
import { TextRange } from '../parser/TextRange';

/**
 * Constructor parameters for {@link DocBlockTag}.
 */
export interface IDocBlockTagParameters extends IDocNodeLeafParameters {
  tagName: TextRange;
}

/**
 * Represents a TSDoc block tag such as "\@param" or "\@public".
 */
export class DocBlockTag extends DocNodeLeaf {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.BlockTag;

  /**
   * The tag name text.  For example, if the block tag is "\@eventProperty"
   * then the tag name would be "eventProperty".
   */
  public readonly tagName: TextRange;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocBlockTagParameters) {
    super(parameters);

    this.tagName = parameters.tagName;
  }
}
