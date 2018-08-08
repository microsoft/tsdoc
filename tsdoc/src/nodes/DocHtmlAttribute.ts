import { DocNode, DocNodeKind, IDocNodeParameters } from './DocNode';

/**
 * Constructor parameters for {@link DocHtmlAttribute}.
 */
export interface IDocHtmlAttributeParameters extends IDocNodeParameters {
  attributeName: string;
  spacingAfterAttributeName: string | undefined;
  attributeValue: string;
  spacingBeforeAttributeValue: string | undefined;
  spacingAfterAttributeValue: string | undefined;
}

/**
 * Represents an HTML attribute inside a DocHtmlStartTag or DocHtmlEndTag.
 *
 * Example: `href="#"` inside `<a href="#" />`
 */
export class DocHtmlAttribute extends DocNode {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.HtmlAttribute;

  /**
   * The HTML attribute name.
   */
  public readonly attributeName: string;

  /**
   * Explicit whitespace that a renderer should insert after the HTML attribute name.
   * If undefined, then the renderer can use a formatting rule to generate appropriate spacing.
   */
  public readonly spacingAfterAttributeName: string | undefined;

  /**
   * The HTML attribute value.
   */
  public readonly attributeValue: string;

  /**
   * Explicit whitespace that a renderer should insert after the "=".
   * If undefined, then the renderer can use a formatting rule to generate appropriate spacing.
   */
  public readonly spacingBeforeAttributeValue: string | undefined;

  /**
   * Explicit whitespace that a renderer should insert after the HTML attribute name.
   * If undefined, then the renderer can use a formatting rule to generate appropriate spacing.
   */
  public readonly spacingAfterAttributeValue: string | undefined;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocHtmlAttributeParameters) {
    super(parameters);
    this.attributeName = parameters.attributeName;
    DocNode.validateSpacing(parameters.spacingAfterAttributeName, 'spacingAfterAttributeName');
    this.spacingAfterAttributeName = parameters.spacingAfterAttributeName;
    this.attributeValue = parameters.attributeValue;
    DocNode.validateSpacing(parameters.spacingBeforeAttributeValue, 'spacingBeforeAttributeValue');
    this.spacingBeforeAttributeValue = parameters.spacingBeforeAttributeValue;
    DocNode.validateSpacing(parameters.spacingAfterAttributeName, 'spacingAfterAttributeValue');
    this.spacingAfterAttributeValue = parameters.spacingAfterAttributeValue;
  }
}
