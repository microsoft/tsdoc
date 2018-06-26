import { DocNode, DocNodeKind, IDocNodeParameters } from './DocNode';

/**
 * Constructor parameters for {@link DocHtmlTag}.
 */
export interface IDocHtmlTagParameters extends IDocNodeParameters {
}

/**
 * Represents a span of comment text that contains an HTML tag
 * conforming to CommonMark syntax rules.
 */
export class DocHtmlTag extends DocNode {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.HtmlTag;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocHtmlTagParameters) {
    super(parameters);
  }
}
