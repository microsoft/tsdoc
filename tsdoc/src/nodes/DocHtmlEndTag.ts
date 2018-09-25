import { DocNode, DocNodeKind, IDocNodeParameters } from './DocNode';
import { Excerpt } from '../parser/Excerpt';
import { DocParticle } from './DocParticle';

/**
 * Constructor parameters for {@link DocHtmlEndTag}.
 */
export interface IDocHtmlEndTagParameters extends IDocNodeParameters {
  openingDelimiterExcerpt?: Excerpt;

  elementNameExcerpt?: Excerpt;
  elementName: string;

  closingDelimiterExcerpt?: Excerpt;
}

/**
 * Represents an HTML end tag.  Example: `</a>`
 */
export class DocHtmlEndTag extends DocNode {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.HtmlEndTag;

  // The "</" delimiter
  private _openingDelimiterParticle: DocParticle | undefined;

  // The element name
  private _elementNameParticle: DocParticle | undefined;

  // The  ">" delimiter
  private _closingDelimiterParticle: DocParticle | undefined;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocHtmlEndTagParameters) {
    super(parameters);
  }

  /**
   * The HTML element name.
   */
  public get elementName(): string {
    return this._elementNameParticle!.content;
  }

  /** @override */
  public updateParameters(parameters: IDocHtmlEndTagParameters): void {
    super.updateParameters(parameters);

    this._openingDelimiterParticle = new DocParticle({
      excerpt: parameters.openingDelimiterExcerpt,
      content: '</'
    });

    this._elementNameParticle = new DocParticle({
      excerpt: parameters.elementNameExcerpt,
      content: parameters.elementName
    });

    this._closingDelimiterParticle = new DocParticle({
      excerpt: parameters.closingDelimiterExcerpt,
      content: '>'
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
      this._closingDelimiterParticle!
    ];
  }

}
