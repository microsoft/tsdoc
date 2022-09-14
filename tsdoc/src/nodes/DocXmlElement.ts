import { StringBuilder } from '../emitters/StringBuilder';
import { TSDocEmitter } from '../emitters/TSDocEmitter';
import { TokenSequence } from '../parser/TokenSequence';
import { DocExcerpt, ExcerptKind } from './DocExcerpt';
import { DocXmlAttribute } from './DocXmlAttribute';
import { DocNode, DocNodeKind, IDocNodeParameters, IDocNodeParsedParameters } from './DocNode';
import { DocNodeContainer } from './DocNodeContainer';
import { StringChecks } from '../parser/StringChecks';

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

  startTagNameExcerpt?: TokenSequence;
  endTagNameExcerpt?: TokenSequence;

  xmlAttributes: DocXmlAttribute[];
  isEmptyElement?: boolean;

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
  isEmptyElement?: boolean;
}

export class DocXmlElement extends DocNodeContainer {
  private readonly _xmlAttributes: DocXmlAttribute[] = [];
  private readonly _xmlAttributesByName: Map<string, DocXmlAttribute> = new Map();

  private _name: string | undefined;
  private readonly _nameExcerpt: DocExcerpt | undefined;

  private readonly _startTagNameExcerpt: DocExcerpt | undefined;
  private readonly _endTagNameExcerpt: DocExcerpt | undefined;

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

  private _isEmptyElement: boolean;

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
        excerptKind: ExcerptKind.XmlElement_Name,
        content: parameters.nameExcerpt
      });
      if (parameters.startTagNameExcerpt) {
        this._startTagNameExcerpt = new DocExcerpt({
          configuration: this.configuration,
          excerptKind: ExcerptKind.XmlStartTag_Name,
          content: parameters.startTagNameExcerpt
        });
      }
      if (parameters.endTagNameExcerpt) {
        this._endTagNameExcerpt = new DocExcerpt({
          configuration: this.configuration,
          excerptKind: ExcerptKind.XmlEndTag_Name,
          content: parameters.endTagNameExcerpt
        });
      }
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

    for (const xmlAttribute of parameters.xmlAttributes ?? []) {
      this._xmlAttributes.push(xmlAttribute);
      this._xmlAttributesByName.set(xmlAttribute.name, xmlAttribute);
    }

    this._isEmptyElement = !!parameters.isEmptyElement;
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
   * Attempts to find an XML attribute with the specified name.
   * @param name - The name of the XML attribute to get.
   * @returns The XML attribute with the specified name, or `undefined` if no such attribute with the given name exists.
   */
  public tryGetXmlAttribute(name: string): DocXmlAttribute | undefined {
    const explanation: string | undefined = StringChecks.explainIfInvalidXmlName(name);
    if (explanation) {
      throw new Error(`${JSON.stringify(name)} is not a valid name: ${explanation}`);
    }

    return this._xmlAttributesByName.get(name);
  }

  /**
   * If true, then the XML start tag ends with `/>` instead of `>`,
   * and there is no end tag.
   *
   * @remarks
   * The XML spec refers to `<example/>` as an "empty-element tag".  The CommonMark spec
   * considers it to be a start tag that denotes an "empty element."  HTML5 uses the term "void elements",
   * but this tends to refer to standard tags such as `<br/>` which must always be empty elements
   * according to the spec.
   */
  public get isEmptyElement(): boolean {
    return this._isEmptyElement;
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
    // NOTE: Here we're assuming that the TSDoc representation for a tag is also a valid XML expression.
    const stringBuilder: StringBuilder = new StringBuilder();
    const emitter: TSDocEmitter = new TSDocEmitter();
    emitter.renderXmlElement(stringBuilder, this);
    return stringBuilder.toString();
  }

  /** @override */
  protected onGetChildNodes(): ReadonlyArray<DocNode | undefined> {
    return [
      this._startTagOpeningDelimiterExcerpt,
      this._nameExcerpt,
      this._spacingAfterNameExcerpt,
      this._startTagClosingDelimiterExcerpt,
      ...this.xmlAttributes,
      ...this.nodes,
      this._endTagOpeningDelimiterExcerpt,
      this._endTagNameExcerpt,
      this._endTagClosingDelimiterExcerpt
    ];
  }
}
