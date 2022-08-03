import { DocNode, DocNodeKind, IDocNodeParameters, IDocNodeParsedParameters } from './DocNode';
import { TokenSequence } from '../parser/TokenSequence';
import { DocExcerpt, ExcerptKind } from './DocExcerpt';

/**
 * Constructor parameters for {@link DocXmlAttribute}.
 */
export interface IDocXmlAttributeParameters extends IDocNodeParameters {
  name: string;
  spacingAfterName?: string;
  spacingAfterEquals?: string;
  value: string;
  spacingAfterValue?: string;
}

/**
 * Constructor parameters for {@link DocXmlAttribute}.
 */
export interface IDocXmlAttributeParsedParameters extends IDocNodeParsedParameters {
  nameExcerpt: TokenSequence;
  spacingAfterNameExcerpt?: TokenSequence;

  equalsExcerpt: TokenSequence;
  spacingAfterEqualsExcerpt?: TokenSequence;

  valueExcerpt: TokenSequence;
  spacingAfterValueExcerpt?: TokenSequence;
}

/**
 * Represents an HTML attribute inside a DocHtmlStartTag or DocHtmlEndTag.
 *
 * Example: `href="#"` inside `<a href="#" />`
 */
export class DocXmlAttribute extends DocNode {
  // The attribute name
  private _name: string | undefined;
  private readonly _nameExcerpt: DocExcerpt | undefined;

  private _spacingAfterName: string | undefined;
  private readonly _spacingAfterNameExcerpt: DocExcerpt | undefined;

  // The "=" delimiter
  private readonly _equalsExcerpt: DocExcerpt | undefined;

  private _spacingAfterEquals: string | undefined;
  private readonly _spacingAfterEqualsExcerpt: DocExcerpt | undefined;

  // The attribute value including quotation marks
  private _value: string | undefined;
  private readonly _valueExcerpt: DocExcerpt | undefined;

  private _spacingAfterValue: string | undefined;
  private readonly _spacingAfterValueExcerpt: DocExcerpt | undefined;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocXmlAttributeParameters | IDocXmlAttributeParsedParameters) {
    super(parameters);

    if (DocNode.isParsedParameters(parameters)) {
      this._nameExcerpt = new DocExcerpt({
        configuration: this.configuration,
        excerptKind: ExcerptKind.XmlAttribute_Name,
        content: parameters.nameExcerpt
      });
      if (parameters.spacingAfterNameExcerpt) {
        this._spacingAfterNameExcerpt = new DocExcerpt({
          configuration: this.configuration,
          excerptKind: ExcerptKind.Spacing,
          content: parameters.spacingAfterNameExcerpt
        });
      }

      this._equalsExcerpt = new DocExcerpt({
        configuration: this.configuration,
        excerptKind: ExcerptKind.XmlAttribute_Equals,
        content: parameters.equalsExcerpt
      });
      if (parameters.spacingAfterEqualsExcerpt) {
        this._spacingAfterEqualsExcerpt = new DocExcerpt({
          configuration: this.configuration,
          excerptKind: ExcerptKind.Spacing,
          content: parameters.spacingAfterEqualsExcerpt
        });
      }

      this._valueExcerpt = new DocExcerpt({
        configuration: this.configuration,
        excerptKind: ExcerptKind.XmlAttribute_Value,
        content: parameters.valueExcerpt
      });
      if (parameters.spacingAfterValueExcerpt) {
        this._spacingAfterValueExcerpt = new DocExcerpt({
          configuration: this.configuration,
          excerptKind: ExcerptKind.Spacing,
          content: parameters.spacingAfterValueExcerpt
        });
      }
    } else {
      this._name = parameters.name;
      this._spacingAfterName = parameters.spacingAfterName;

      this._spacingAfterEquals = parameters.spacingAfterEquals;

      this._value = parameters.value;
      this._spacingAfterValue = parameters.spacingAfterValue;
    }
  }

  /** @override */
  public get kind(): DocNodeKind | string {
    return DocNodeKind.XmlAttribute;
  }

  /**
   * The HTML attribute name.
   */
  public get name(): string {
    if (this._name === undefined) {
      this._name = this._nameExcerpt!.content.toString();
    }
    return this._name;
  }

  /**
   * Explicit whitespace that a renderer should insert after the HTML attribute name.
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
   * Explicit whitespace that a renderer should insert after the "=".
   * If undefined, then the renderer can use a formatting rule to generate appropriate spacing.
   */
  public get spacingAfterEquals(): string | undefined {
    if (this._spacingAfterEquals === undefined) {
      if (this._spacingAfterEqualsExcerpt !== undefined) {
        this._spacingAfterEquals = this._spacingAfterEqualsExcerpt.content.toString();
      }
    }
    return this._spacingAfterEquals;
  }

  /**
   * The HTML attribute value.
   */
  public get value(): string {
    if (this._value === undefined) {
      this._value = this._valueExcerpt!.content.toString();
    }
    return this._value;
  }

  /**
   * Explicit whitespace that a renderer should insert after the HTML attribute name.
   * If undefined, then the renderer can use a formatting rule to generate appropriate spacing.
   */
  public get spacingAfterValue(): string | undefined {
    if (this._spacingAfterValue === undefined) {
      if (this._spacingAfterValueExcerpt !== undefined) {
        this._spacingAfterValue = this._spacingAfterValueExcerpt.content.toString();
      }
    }
    return this._spacingAfterValue;
  }

  /** @override */
  protected onGetChildNodes(): ReadonlyArray<DocNode | undefined> {
    return [
      this._nameExcerpt,
      this._spacingAfterNameExcerpt,
      this._equalsExcerpt,
      this._spacingAfterEqualsExcerpt,
      this._valueExcerpt,
      this._spacingAfterValueExcerpt
    ];
  }
}
