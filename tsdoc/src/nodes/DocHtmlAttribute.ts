import { DocNode, DocNodeKind, IDocNodeParameters } from './DocNode';
import { DocParticle } from './DocParticle';
import { Excerpt } from '../parser/Excerpt';

/**
 * Constructor parameters for {@link DocHtmlAttribute}.
 */
export interface IDocHtmlAttributeParameters extends IDocNodeParameters {
  attributeNameExcerpt?: Excerpt;
  attributeName: string;
  spacingAfterAttributeName: string | undefined;

  equalsExcerpt?: Excerpt;
  spacingAfterEquals: string | undefined;

  attributeValueExcerpt?: Excerpt;
  attributeValue: string;
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

  // The attribute name
  private _attributeNameParticle: DocParticle | undefined;  // never undefined after updateParameters()

  // The "=" delimiter
  private _equalsParticle: DocParticle | undefined;         // never undefined after updateParameters()

  // The attribute value including quotation marks
  private _attributeValueParticle: DocParticle | undefined; // never undefined after updateParameters()

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocHtmlAttributeParameters) {
    super(parameters);
  }

  /**
   * The HTML attribute name.
   */
  public get attributeName(): string {
    return this._attributeNameParticle!.content;
  }

  /**
   * Explicit whitespace that a renderer should insert after the HTML attribute name.
   * If undefined, then the renderer can use a formatting rule to generate appropriate spacing.
   */
  public get spacingAfterAttributeName(): string | undefined {
    return this._attributeNameParticle!.spacingAfterContent;
  }

  /**
   * Explicit whitespace that a renderer should insert after the "=".
   * If undefined, then the renderer can use a formatting rule to generate appropriate spacing.
   */
  public get spacingAfterEquals(): string | undefined {
    return this._equalsParticle!.spacingAfterContent;
  }

  /**
   * The HTML attribute value.
   */
  public get attributeValue(): string {
    return this._attributeValueParticle!.content;
  }

  /**
   * Explicit whitespace that a renderer should insert after the HTML attribute name.
   * If undefined, then the renderer can use a formatting rule to generate appropriate spacing.
   */
  public get spacingAfterAttributeValue(): string | undefined {
    return this._attributeValueParticle!.spacingAfterContent;
  }

  /** @override */
  public updateParameters(parameters: IDocHtmlAttributeParameters): void {
    super.updateParameters(parameters);

    this._attributeNameParticle = new DocParticle({
      particleId: 'attributeName',
      excerpt: parameters.attributeNameExcerpt,
      content: parameters.attributeName,
      spacingAfterContent: parameters.spacingAfterAttributeName
    });

    this._equalsParticle = new DocParticle({
      particleId: 'equals',
      excerpt: parameters.equalsExcerpt,
      content: '=',
      spacingAfterContent: parameters.spacingAfterEquals
    });

    this._attributeValueParticle = new DocParticle({
      particleId: 'attributeValue',
      excerpt: parameters.attributeValueExcerpt,
      content: parameters.attributeValue,
      spacingAfterContent: parameters.spacingAfterAttributeValue
    });
  }

  /**
   * {@inheritdoc}
   * @override
   */
  public getChildNodes(): ReadonlyArray<DocNode> {
    return [ this._attributeNameParticle!, this._equalsParticle!, this._attributeValueParticle! ];
  }
}
