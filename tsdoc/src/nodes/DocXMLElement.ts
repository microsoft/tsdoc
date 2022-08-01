import { TokenSequence } from '../parser/TokenSequence';
import { DocExcerpt, ExcerptKind } from './DocExcerpt';
import { DocHtmlAttribute } from './DocHtmlAttribute';
import { DocNode, DocNodeKind, IDocNodeParameters, IDocNodeParsedParameters } from './DocNode';
import { DocNodeContainer } from './DocNodeContainer';

/**
 * Constructor parameters for {@link DocXMLElement}.
 */
export interface IDocXMLElementParsedParameters extends IDocNodeParsedParameters {
  startTagOpeningDelimiterExcerpt?: TokenSequence;
  startTagClosingDelimiterExcerpt?: TokenSequence;

  endTagOpeningExcerpt?: TokenSequence;
  endTagClosingExcerpt?: TokenSequence;

  nameExcerpt: TokenSequence;
  spacingAfterNameExcerpt?: TokenSequence;

  htmlAttributes: DocHtmlAttribute[];
  selfClosingTag: boolean;
}

/**
 * Constructor parameters for {@link DocXMLElement}.
 */
export interface IDocXMLElementParameters extends IDocNodeParameters {
  name: string;
  spacingAfterName?: string;

  htmlAttributes?: DocHtmlAttribute[];

  startTagParameters: IDocXMLElementParsedParameters;
}

export class DocXMLElement extends DocNodeContainer {
  private readonly _htmlAttributes: DocHtmlAttribute[] = [];

  private _name: string | undefined;
  private readonly _nameExcerpt: DocExcerpt | undefined;

  private _spacingAfterName: string | undefined;
  private readonly _spacingAfterNameExcerpt: DocExcerpt | undefined;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocXMLElementParameters | IDocXMLElementParsedParameters) {
    super(parameters);

    if (DocNode.isParsedParameters(parameters)) {
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
  }

  public get htmlAttributes(): DocHtmlAttribute[] {
    return this._htmlAttributes || [];
  }

  public get kind(): string {
    return DocNodeKind.XMLElement;
  }
}
