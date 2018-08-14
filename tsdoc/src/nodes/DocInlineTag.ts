import { DocNodeKind, IDocNodeParameters, DocNode } from './DocNode';

/**
 * Constructor parameters for {@link DocInlineTag}.
 */
export interface IDocInlineTagParameters extends IDocNodeParameters {
  tagName: string;
  tagContent: string;
}

/**
 * Represents a TSDoc inline tag such as `{@inheritdoc}` or `{@link}`.
 */
export class DocInlineTag extends DocNode {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.InlineTag;

  /**
   * The TSDoc tag name.
   * For example, if the inline tag is `{@link Guid.toString | the toString() method}`
   * then the tag name would be "link".
   */
  public readonly tagName: string;

  /**
   * The tag content.
   * For example, if the inline tag is `{@link Guid.toString | the toString() method}`
   * then the tag content would be `Guid.toString | the toString() method`.
   */
  public readonly tagContent: string;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocInlineTagParameters) {
    super(parameters);

    DocNode.validateTSDocTagName(parameters.tagName);
    this.tagName = parameters.tagName;
    this.tagContent = parameters.tagContent;
  }
}
