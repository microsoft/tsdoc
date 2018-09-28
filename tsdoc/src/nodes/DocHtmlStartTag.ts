import { DocNode, DocNodeKind, IDocNodeParameters } from './DocNode';
import { DocHtmlAttribute } from './DocHtmlAttribute';
import { DocParticle } from './DocParticle';
import { Excerpt } from '../parser/Excerpt';

/**
 * Constructor parameters for {@link DocHtmlStartTag}.
 */
export interface IDocHtmlStartTagParameters extends IDocNodeParameters {
  openingDelimiterExcerpt?: Excerpt;

  elementNameExcerpt?: Excerpt;
  elementName: string;
  spacingAfterElementName?: string;

  htmlAttributes: DocHtmlAttribute[];
  selfClosingTag: boolean;

  closingDelimiterExcerpt?: Excerpt;
}

/**
 * Represents an HTML start tag, which may or may not be self-closing.
 *
 * Example: `<a href="#" />`
 */
export class DocHtmlStartTag extends DocNode {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.HtmlStartTag;

  // The "<" delimiter
  private _openingDelimiterParticle: DocParticle | undefined;

  // The element name
  private _elementNameParticle: DocParticle | undefined;

  private _htmlAttributes: DocHtmlAttribute[] | undefined;

  private _selfClosingTag: boolean | undefined;

  // The ">" or "/>" delimiter
  private _closingDelimiterParticle: DocParticle | undefined;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocHtmlStartTagParameters) {
    super(parameters);
  }

  /**
   * The HTML element name.
   */
  public get elementName(): string {
    return this._elementNameParticle!.content;
  }

  /**
   * The HTML attributes belonging to this HTML element.
   */
  public get htmlAttributes(): ReadonlyArray<DocHtmlAttribute> {
    return this._htmlAttributes!;
  }

  /**
   * If true, then the HTML tag ends with "/>" instead of ">".
   */
  public get selfClosingTag(): boolean {
    return this._selfClosingTag!;
  }

  /**
   * Explicit whitespace that a renderer should insert after the HTML element name.
   * If undefined, then the renderer can use a formatting rule to generate appropriate spacing.
   */
  public get spacingAfterElementName(): string | undefined {
    return this._elementNameParticle!.spacingAfterContent;
  }

  /** @override */
  public updateParameters(parameters: IDocHtmlStartTagParameters): void {
    super.updateParameters(parameters);

    this._openingDelimiterParticle = new DocParticle({
      particleId: 'openingDelimiter',
      excerpt: parameters.openingDelimiterExcerpt,
      content: '<'
    });

    this._elementNameParticle = new DocParticle({
      particleId: 'elementName',
      excerpt: parameters.elementNameExcerpt,
      content: parameters.elementName,
      spacingAfterContent: parameters.spacingAfterElementName
    });

    this._htmlAttributes = parameters.htmlAttributes;

    this._selfClosingTag = parameters.selfClosingTag;

    this._closingDelimiterParticle = new DocParticle({
      particleId: 'closingDelimiter',
      excerpt: parameters.closingDelimiterExcerpt,
      content: parameters.selfClosingTag ? '/>' : '>'
    });
  }

  /**
   * {@inheritdoc}
   * @override
   */
  public getChildNodes(): ReadonlyArray<DocNode> {
    return [
      this._openingDelimiterParticle!,
      this._elementNameParticle!,
      ...this._htmlAttributes!,
      this._closingDelimiterParticle!
    ];
  }

}
