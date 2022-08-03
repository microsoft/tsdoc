import { StringBuilder } from '../emitters/StringBuilder';
import { TSDocEmitter } from '../emitters/TSDocEmitter';
import { TokenSequence } from '../parser/TokenSequence';
import { DocExcerpt, ExcerptKind } from './DocExcerpt';
import { DocXmlAttribute } from './DocXmlAttribute';
import { DocNode, DocNodeKind, IDocNodeParameters, IDocNodeParsedParameters } from './DocNode';
import { DocNodeContainer } from './DocNodeContainer';

/**
 * Constructor parameters for {@link DocXmlElement}.
 */
export interface IDocXmlElementParsedParameters extends IDocNodeParsedParameters {
  startTagOpeningDelimiterExcerpt: TokenSequence;
  startTagClosingDelimiterExcerpt: TokenSequence;

  endTagOpeningDelimiterExcerpt?: TokenSequence;
  endTagClosingDelimiterExcerpt?: TokenSequence;

  spacingAfterStartTagNameExcerpt?: TokenSequence;
  spacingAfterEndTagExcerpt?: TokenSequence;

  spacingBetweenStartTagAndChildExcerpt?: TokenSequence;

  childNodes: DocNode[];

  endTagOpeningExcerpt?: TokenSequence;
  endTagClosingExcerpt?: TokenSequence;

  nameExcerpt: TokenSequence;
  spacingAfterNameExcerpt?: TokenSequence;

  xmlAttributes: DocXmlAttribute[];
  selfClosingTag?: boolean;

  spacingAfterElementExcerpt?: TokenSequence;
}

/**
 * Constructor parameters for {@link DocXmlElement}.
 */
export interface IDocXmlElementParameters extends IDocNodeParameters {
  name: string;
  spacingAfterName?: string;

  xmlAttributes?: DocXmlAttribute[];

  startTagParameters: IDocXmlElementParsedParameters;
  selfClosingTag?: boolean;
}

export class DocXmlElement extends DocNodeContainer {
  private readonly _xmlAttributes: DocXmlAttribute[] = [];

  private _name: string | undefined;
  private readonly _nameExcerpt: DocExcerpt | undefined;

  private _startTagOpeningDelimiter: string | undefined;
  private readonly _startTagOpeningDelimiterExcerpt: DocExcerpt | undefined;

  private _startTagClosingDelimiter: string | undefined;
  private readonly _startTagClosingDelimiterExcerpt: DocExcerpt | undefined;

  private _endTagOpeningDelimiter: string | undefined;
  private readonly _endTagOpeningDelimiterExcerpt: DocExcerpt | undefined;

  private _endTagClosingDelimiter: string | undefined;
  private readonly _endTagClosingDelimiterExcerpt: DocExcerpt | undefined;

  private _spacingAfterName: string | undefined;
  private readonly _spacingAfterNameExcerpt: DocExcerpt | undefined;

  private _spacingBetweenStartTagAndChildren: string | undefined;
  private readonly _spacingBetweenStartTagAndChildrenExcerpt: DocExcerpt | undefined;

  private _selfClosingTag: boolean;

  private _spacingAfterEndTag: string | undefined;
  private readonly _spacingAfterEndTagExcerpt: DocExcerpt | undefined;

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
        excerptKind: ExcerptKind.XmlStartTag_Name,
        content: parameters.nameExcerpt
      });
      if (parameters.spacingAfterNameExcerpt) {
        this._spacingAfterNameExcerpt = new DocExcerpt({
          configuration: this.configuration,
          excerptKind: ExcerptKind.Spacing,
          content: parameters.spacingAfterNameExcerpt
        });
      }
      if (parameters.startTagOpeningDelimiterExcerpt) {
        this._startTagOpeningDelimiterExcerpt = new DocExcerpt({
          configuration: this.configuration,
          excerptKind: ExcerptKind.XmlStartTag_OpeningDelimiter,
          content: parameters.startTagOpeningDelimiterExcerpt
        });
      }
      if (parameters.startTagClosingDelimiterExcerpt) {
        this._startTagClosingDelimiterExcerpt = new DocExcerpt({
          configuration: this.configuration,
          excerptKind: ExcerptKind.XmlStartTag_ClosingDelimiter,
          content: parameters.startTagClosingDelimiterExcerpt
        });
      }
      if (parameters.endTagOpeningDelimiterExcerpt) {
        this._endTagOpeningDelimiterExcerpt = new DocExcerpt({
          configuration: this.configuration,
          excerptKind: ExcerptKind.XmlEndTag_OpeningDelimiter,
          content: parameters.endTagOpeningDelimiterExcerpt
        });
      }
      if (parameters.endTagClosingDelimiterExcerpt) {
        this._endTagClosingDelimiterExcerpt = new DocExcerpt({
          configuration: this.configuration,
          excerptKind: ExcerptKind.XmlEndTag_ClosingDelimiter,
          content: parameters.endTagClosingDelimiterExcerpt
        });
      }
      if (parameters.spacingBetweenStartTagAndChildExcerpt) {
        this._spacingBetweenStartTagAndChildrenExcerpt = new DocExcerpt({
          configuration: this.configuration,
          excerptKind: ExcerptKind.Spacing,
          content: parameters.spacingBetweenStartTagAndChildExcerpt
        });
      }
      if (parameters.spacingAfterEndTagExcerpt) {
        this._spacingAfterEndTagExcerpt = new DocExcerpt({
          configuration: this.configuration,
          excerptKind: ExcerptKind.Spacing,
          content: parameters.spacingAfterEndTagExcerpt
        });
      }
    } else {
      this._name = parameters.name;
      this._spacingAfterName = parameters.spacingAfterName;
    }

    this._xmlAttributes = [];
    if (parameters.xmlAttributes) {
      this._xmlAttributes.push(...parameters.xmlAttributes);
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
  public get xmlAttributes(): ReadonlyArray<DocXmlAttribute> {
    return this._xmlAttributes;
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

  /**
   * The spacing between the start tag closing delimiter and the first child's opening delimiter.
   */
  public get spacingBetweenStartTagAndChildren(): string | undefined {
    if (this._spacingBetweenStartTagAndChildren === undefined) {
      if (this._spacingBetweenStartTagAndChildrenExcerpt !== undefined) {
        this._spacingBetweenStartTagAndChildren = this._spacingBetweenStartTagAndChildrenExcerpt.content.toString();
      }
    }

    return this._spacingBetweenStartTagAndChildren;
  }

  /**
   * The spacing after the full XML element
   */
  public get spacingAfterEndTag(): string | undefined {
    if (this._spacingAfterEndTag === undefined) {
      if (this._spacingAfterEndTagExcerpt !== undefined) {
        this._spacingAfterEndTag = this._spacingAfterEndTagExcerpt.content.toString();
      }
    }

    return this._spacingAfterEndTag;
  }

  /**
   * The start tag opening delimiter.
   */
  public get startTagOpeningDelimiter(): string | undefined {
    if (this._startTagOpeningDelimiter === undefined) {
      if (this._startTagOpeningDelimiterExcerpt !== undefined) {
        this._startTagOpeningDelimiter = this._startTagOpeningDelimiterExcerpt.content.toString();
      }
    }

    return this._startTagOpeningDelimiter;
  }

  /**
   * The start tag closing delimiter.
   */
  public get startTagClosingDelimiter(): string | undefined {
    if (this._startTagClosingDelimiter === undefined) {
      if (this._startTagClosingDelimiterExcerpt !== undefined) {
        this._startTagClosingDelimiter = this._startTagClosingDelimiterExcerpt.content.toString();
      }
    }

    return this._startTagClosingDelimiter;
  }

  /**
   * The end tag opening delimiter. This is not present when the XML element is self-closing.
   */
  public get endTagOpeningDelimiter(): string | undefined {
    if (this._endTagOpeningDelimiter === undefined) {
      if (this._endTagOpeningDelimiterExcerpt !== undefined) {
        this._endTagOpeningDelimiter = this._endTagOpeningDelimiterExcerpt.content.toString();
      }
    }

    return this._endTagOpeningDelimiter;
  }

  /**
   * The end tag closing delimiter. This is not present when the XML element is self-closing.
   */
  public get endTagClosingDelimiter(): string | undefined {
    if (this._endTagClosingDelimiter === undefined) {
      if (this._endTagClosingDelimiterExcerpt !== undefined) {
        this._endTagClosingDelimiter = this._endTagClosingDelimiterExcerpt.content.toString();
      }
    }

    return this._endTagClosingDelimiter;
  }

  public emitAsXml(): string {
    // NOTE: Here we're assuming that the TSDoc representation for a tag is also a valid HTML expression.
    const stringBuilder: StringBuilder = new StringBuilder();
    const emitter: TSDocEmitter = new TSDocEmitter();
    emitter.renderXmlElement(stringBuilder, this);
    return stringBuilder.toString();
  }
}
