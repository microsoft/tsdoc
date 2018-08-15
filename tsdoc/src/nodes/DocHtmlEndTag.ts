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
  private readonly _openingDelimiterParticle: DocParticle;

  // The element name
  private readonly _elementNameParticle: DocParticle;

  // The  ">" delimiter
  private readonly _closingDelimiterParticle: DocParticle;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocHtmlEndTagParameters) {
    super(parameters);

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
   * The HTML element name.
   */
  public get elementName(): string {
    return this._elementNameParticle.content;
  }

  /**
   * {@inheritdoc}
   * @override
   */
  public getChildNodes(): ReadonlyArray<DocNode> {
    return [
      this._openingDelimiterParticle,
      this._elementNameParticle,
      this._closingDelimiterParticle
    ];
  }

}
