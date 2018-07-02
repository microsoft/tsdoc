import { DocNodeContainer, DocNodeKind, IDocNodeContainerParameters } from './DocNode';

/**
 * Constructor parameters for {@link DocHtmlEndTag}.
 */
export interface IDocHtmlEndTagParameters extends IDocNodeContainerParameters {
}

/**
 * Represents an HTML end tag.  Example: `</a>`
 */
export class DocHtmlEndTag extends DocNodeContainer {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.HtmlEndTag;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocHtmlEndTagParameters) {
    super(parameters);
  }
}
