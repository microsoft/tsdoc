import { DocNodeLeaf, DocNodeKind, IDocNodeLeafParameters } from './DocNode';

/**
 * Constructor parameters for {@link DocHtmlString}.
 */
export interface IDocHtmlStringParameters extends IDocNodeLeafParameters {
}

/**
 * A quoted string inside a DocHtmlAttribute node.
 *
 * Example: `"#"` inside `<a href="#" />`
 */
export class DocHtmlString extends DocNodeLeaf {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.HtmlString;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocHtmlStringParameters) {
    super(parameters);
  }
}
