import { DocNode, DocNodeKind, IDocNodeParameters, IDocNodeParsedParameters } from './DocNode';
import { TokenSequence } from '../parser/TokenSequence';
import { DocExcerpt, ExcerptId } from './DocExcerpt';

/**
 * Constructor parameters for {@link DocHtmlEndTag}.
 */
export interface IDocHtmlEndTagParameters extends IDocNodeParameters {
  name: string;
}

/**
 * Constructor parameters for {@link DocHtmlEndTag}.
 */
export interface IDocHtmlEndTagParsedParameters extends IDocNodeParsedParameters {
  openingDelimiterExcerpt: TokenSequence;

  nameExcerpt: TokenSequence;
  spacingAfterNameExcerpt?: TokenSequence;

  closingDelimiterExcerpt: TokenSequence;
}

/**
 * Represents an HTML end tag.  Example: `</a>`
 */
export class DocHtmlEndTag extends DocNode {
  /** {@inheritDoc} */
  public readonly kind: DocNodeKind = DocNodeKind.HtmlEndTag;

  // The "</" delimiter and padding
  private readonly _openingDelimiterExcerpt: DocExcerpt | undefined;

  // The element name
  private _name: string | undefined;
  private readonly _nameExcerpt: DocExcerpt | undefined;
  private readonly _spacingAfterNameExcerpt: DocExcerpt | undefined;

  // The  ">" delimiter and padding
  private readonly _closingDelimiterExcerpt: DocExcerpt | undefined;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocHtmlEndTagParameters | IDocHtmlEndTagParsedParameters) {
    super(parameters);

    if (DocNode.isParsedParameters(parameters)) {
      this._openingDelimiterExcerpt = new DocExcerpt({
        excerptId: ExcerptId.HtmlEndTag_OpeningDelimiter,
        content: parameters.openingDelimiterExcerpt
      });
      this._nameExcerpt = new DocExcerpt({
        excerptId: ExcerptId.HtmlEndTag_Name,
        content: parameters.nameExcerpt
      });

      if (parameters.spacingAfterNameExcerpt) {
        this._spacingAfterNameExcerpt = new DocExcerpt({
          excerptId: ExcerptId.Spacing,
          content: parameters.spacingAfterNameExcerpt
        });
      }

      this._closingDelimiterExcerpt = new DocExcerpt({
        excerptId: ExcerptId.HtmlEndTag_ClosingDelimiter,
        content: parameters.closingDelimiterExcerpt
      });
    } else {
      this._name = parameters.name;
    }
  }

  /**
   * The HTML element name.
   */
  public get name(): string {
    if (this._name === undefined) {
      this._name = this._nameExcerpt!.content.toString();
    }
    return this._name;
  }

  /** @override */
  protected onGetChildNodes(): ReadonlyArray<DocNode | undefined> {
    return [
      this._openingDelimiterExcerpt,
      this._nameExcerpt,
      this._spacingAfterNameExcerpt,
      this._closingDelimiterExcerpt
    ];
  }

}
