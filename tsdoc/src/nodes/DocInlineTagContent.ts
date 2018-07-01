import { DocNodeContainer, DocNodeKind, IDocNodeContainerParameters } from './DocNode';

/**
 * Constructor parameters for {@link DocInlineTagContent}.
 */
export interface IDocInlineTagContentParameters extends IDocNodeContainerParameters {
}

/**
 * Represents the content for a TSDoc inline tag.
 * @remarks
 * For example, if the inline tag is `{@link Guid.toString | the toString() method}`
 * then the tag content would be `Guid.toString | the toString() method`.
 */
export class DocInlineTagContent extends DocNodeContainer {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.InlineTagContent;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocInlineTagContentParameters) {
    super(parameters);
  }
}
