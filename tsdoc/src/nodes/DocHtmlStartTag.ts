import { DocNodeContainer, DocNodeKind, IDocNodeContainerParameters } from './DocNode';

/**
 * Constructor parameters for {@link DocHtmlStartTag}.
 */
export interface IDocHtmlStartTagParameters extends IDocNodeContainerParameters {
  selfClosingTag: boolean;
}

/**
 * Represents an HTML start tag, which may or may not be self-closing.
 *
 * Example: `<a href="#" />`
 */
export class DocHtmlStartTag extends DocNodeContainer {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.HtmlStartTag;

  /**
   * If true, then the HTML tag ends with "/>" instead of ">".
   */
  public readonly selfClosingTag: boolean;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocHtmlStartTagParameters) {
    super(parameters);
    this.selfClosingTag = parameters.selfClosingTag;
  }
}
