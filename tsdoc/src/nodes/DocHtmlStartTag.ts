import { DocNode, DocNodeKind, IDocNodeParameters, IDocNodeParsedParameters } from './DocNode';
import { DocHtmlAttribute } from './DocHtmlAttribute';
import { TokenSequence } from '../parser/TokenSequence';
import { DocExcerpt, ExcerptKind } from './DocExcerpt';

/**
 * Constructor parameters for {@link DocHtmlStartTag}.
 */
export interface IDocHtmlStartTagParameters extends IDocNodeParameters {
  name: string;
  spacingAfterName?: string;

  htmlAttributes: DocHtmlAttribute[];
  selfClosingTag: boolean;
}

/**
 * Constructor parameters for {@link DocHtmlStartTag}.
 */
export interface IDocHtmlStartTagParsedParameters extends IDocNodeParsedParameters {
  openingDelimiterExcerpt: TokenSequence;

  nameExcerpt: TokenSequence;
  spacingAfterNameExcerpt?: TokenSequence;

  htmlAttributes: DocHtmlAttribute[];
  selfClosingTag: boolean;

  closingDelimiterExcerpt: TokenSequence;
}

/**
 * Represents an HTML start tag, which may or may not be self-closing.
 *
 * Example: `<a href="#" />`
 */
export class DocHtmlStartTag extends DocNode {
  /** {@inheritDoc} */
  public readonly kind: DocNodeKind = DocNodeKind.HtmlStartTag;

  // The "<" delimiter
  private readonly _openingDelimiterExcerpt: DocExcerpt | undefined;

  // The element name
  private _name: string | undefined;
  private readonly _nameExcerpt: DocExcerpt | undefined;

  private _spacingAfterName: string | undefined;
  private readonly _spacingAfterNameExcerpt: DocExcerpt | undefined;

  private readonly _htmlAttributes: DocHtmlAttribute[];

  private readonly _selfClosingTag: boolean;

  // The ">" or "/>" delimiter
  private readonly _closingDelimiterExcerpt: DocExcerpt | undefined;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocHtmlStartTagParameters | IDocHtmlStartTagParsedParameters) {
    super(parameters);

    if (DocNode.isParsedParameters(parameters)) {
      this._openingDelimiterExcerpt = new DocExcerpt({
        excerptKind: ExcerptKind.HtmlStartTag_OpeningDelimiter,
        content: parameters.openingDelimiterExcerpt
      });

      this._nameExcerpt = new DocExcerpt({
        excerptKind: ExcerptKind.HtmlStartTag_Name,
        content: parameters.nameExcerpt
      });
      if (parameters.spacingAfterNameExcerpt) {
        this._spacingAfterNameExcerpt = new DocExcerpt({
          excerptKind: ExcerptKind.Spacing,
          content: parameters.spacingAfterNameExcerpt
        });
      }

      this._closingDelimiterExcerpt = new DocExcerpt({
        excerptKind: ExcerptKind.HtmlStartTag_ClosingDelimiter,
        content: parameters.closingDelimiterExcerpt
      });
    } else {
      this._name = parameters.name;
      this._spacingAfterName = parameters.spacingAfterName;
    }

    this._htmlAttributes = [];
    this._htmlAttributes.push(...parameters.htmlAttributes);

    this._selfClosingTag = parameters.selfClosingTag;
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

  /**
   * The HTML attributes belonging to this HTML element.
   */
  public get htmlAttributes(): ReadonlyArray<DocHtmlAttribute> {
    return this._htmlAttributes;
  }

  /**
   * If true, then the HTML tag ends with "/>" instead of ">".
   */
  public get selfClosingTag(): boolean {
    return this._selfClosingTag;
  }

  /**
   * Explicit whitespace that a renderer should insert after the HTML element name.
   * If undefined, then the renderer can use a formatting rule to generate appropriate spacing.
   */
  public get spacingAfterName(): string | undefined {
    if (this._spacingAfterName === undefined) {
      if (this._spacingAfterNameExcerpt !== undefined) {
        this._spacingAfterName = this._spacingAfterNameExcerpt.content.toString();
      }
    }

    return this._spacingAfterName;
  }

  /** @override */
  protected onGetChildNodes(): ReadonlyArray<DocNode | undefined> {
    return [
      this._openingDelimiterExcerpt,
      this._nameExcerpt,
      this._spacingAfterNameExcerpt,
      ...this._htmlAttributes,
      this._closingDelimiterExcerpt
    ];
  }

}
