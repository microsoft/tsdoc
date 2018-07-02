import { DocNodeKind, IDocNodeContainerParameters, DocNodeContainer } from './DocNode';
import { TextRange } from '../parser/TextRange';
import { DocInlineTagContent } from './DocInlineTagContent';

/**
 * Constructor parameters for {@link DocInlineTag}.
 */
export interface IDocInlineTagParameters extends IDocNodeContainerParameters {
  tagName: TextRange;
  tagContent: DocInlineTagContent;
}

/**
 * Represents a TSDoc inline tag such as `{@inheritdoc}` or `{@link}`.
 */
export class DocInlineTag extends DocNodeContainer {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.InlineTag;

  /**
   * The tag name text.  For example, if the inline tag is
   * `{@link Guid.toString | the toString() method}`
   * then the tag name would be "link".
   */
  public readonly tagName: TextRange;

  /**
   * The content.
   */
  public readonly tagContent: DocInlineTagContent;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocInlineTagParameters) {
    super(parameters);

    this.tagName = parameters.tagName;
    this.tagContent = parameters.tagContent;
  }
}
