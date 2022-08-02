import { TokenSequence } from '../parser/TokenSequence';
import { DocExcerpt, ExcerptKind } from './DocExcerpt';
import { DocHtmlAttribute } from './DocHtmlAttribute';
import { DocNode, DocNodeKind, IDocNodeParameters, IDocNodeParsedParameters } from './DocNode';
import { DocNodeContainer } from './DocNodeContainer';

/**
 * Constructor parameters for {@link DocXmlElement}.
 */
export interface IDocXmlElementParsedParameters extends IDocNodeParsedParameters {
  startTagOpeningDelimiterExcerpt: TokenSequence;
  startTagClosingDelimiterExcerpt: TokenSequence;

  spacingAfterStartTagNameExcerpt?: TokenSequence;
  spacingAfterEndTagNameExcerpt?: TokenSequence;

  spacingBetweenStartTagAndChildExcerpt?: TokenSequence;

  childNodes: DocNode[];

  endTagOpeningExcerpt?: TokenSequence;
  endTagClosingExcerpt?: TokenSequence;

  nameExcerpt: TokenSequence;
  spacingAfterNameExcerpt?: TokenSequence;

  htmlAttributes: DocHtmlAttribute[];
  selfClosingTag?: boolean;
}

/**
 * Constructor parameters for {@link DocXmlElement}.
 */
export interface IDocXmlElementParameters extends IDocNodeParameters {
  name: string;
  spacingAfterName?: string;

  htmlAttributes?: DocHtmlAttribute[];

  startTagParameters: IDocXmlElementParsedParameters;
  selfClosingTag?: boolean;
}

export class DocXmlElement extends DocNodeContainer {
  private readonly _htmlAttributes: DocHtmlAttribute[] = [];

  private _name: string | undefined;
  private readonly _nameExcerpt: DocExcerpt | undefined;

  private _spacingAfterName: string | undefined;
  private readonly _spacingAfterNameExcerpt: DocExcerpt | undefined;
  private _selfClosingTag: boolean;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocXmlElementParameters | IDocXmlElementParsedParameters) {
    super(parameters);

    if (DocNode.isParsedParameters(parameters)) {
      this.appendNodes(parameters.childNodes);
      this._nameExcerpt = new DocExcerpt({
        configuration: this.configuration,
        excerptKind: ExcerptKind.HtmlStartTag_Name,
        content: parameters.nameExcerpt
      });
      if (parameters.spacingAfterNameExcerpt) {
        this._spacingAfterNameExcerpt = new DocExcerpt({
          configuration: this.configuration,
          excerptKind: ExcerptKind.Spacing,
          content: parameters.spacingAfterNameExcerpt
        });
      }
    } else {
      this._name = parameters.name;
      this._spacingAfterName = parameters.spacingAfterName;
    }

    this._htmlAttributes = [];
    if (parameters.htmlAttributes) {
      this._htmlAttributes.push(...parameters.htmlAttributes);
    }

    this._selfClosingTag = !!parameters.selfClosingTag;
  }

  public get kind(): string {
    return DocNodeKind.XmlElement;
  }

  /**
   * The XML element name.
   */
  public get name(): string {
    if (this._name === undefined) {
      this._name = this._nameExcerpt!.content.toString();
    }
    return this._name;
  }

  /**
   * The XML attributes belonging to this XML element.
   */
  public get htmlAttributes(): ReadonlyArray<DocHtmlAttribute> {
    return this._htmlAttributes;
  }

  /**
   * If true, then the XML start tag ends with `/>` instead of `>`.
   */
  public get selfClosingTag(): boolean {
    return this._selfClosingTag;
  }

  /**
   * Explicit whitespace that a renderer should insert after the XML element name.
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
}
