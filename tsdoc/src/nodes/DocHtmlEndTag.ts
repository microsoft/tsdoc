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
  /** {@inheritDoc} */
  public readonly kind: DocNodeKind = DocNodeKind.HtmlEndTag;

  // The "</" delimiter
  private _openingDelimiterParticle: DocParticle | undefined;  // never undefined after updateParameters()

  // The element name
  private _elementNameParticle: DocParticle | undefined;       // never undefined after updateParameters()

  // The  ">" delimiter
  private _closingDelimiterParticle: DocParticle | undefined;  // never undefined after updateParameters()

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
      particleId: 'openingDelimiter',
      excerpt: parameters.openingDelimiterExcerpt,
      content: '</'
    });

    this._elementNameParticle = new DocParticle({
      particleId: 'elementName',
      excerpt: parameters.elementNameExcerpt,
      content: parameters.elementName
    });

    this._closingDelimiterParticle = new DocParticle({
      particleId: 'closingDelimiter',
      excerpt: parameters.closingDelimiterExcerpt,
      content: '>'
    });
  }

  /**
   * {@inheritDoc}
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
