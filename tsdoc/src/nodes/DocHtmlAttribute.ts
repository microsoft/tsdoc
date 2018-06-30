import { DocNodeContainer, DocNodeKind, IDocNodeContainerParameters } from './DocNode';

/**
 * Constructor parameters for {@link DocHtmlAttribute}.
 */
export interface IDocHtmlAttributeParameters extends IDocNodeContainerParameters {
}

/**
 * Represents an HTML attribute inside a DocHtmlStartTag or DocHtmlEndTag.
 *
 * Example: `href="#"` inside `<a href="#" />`
 */
export class DocHtmlAttribute extends DocNodeContainer {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.HtmlAttribute;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocHtmlAttributeParameters) {
    super(parameters);
  }
}
