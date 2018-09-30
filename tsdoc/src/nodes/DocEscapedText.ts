import { DocNodeKind } from './DocNode';
import { DocNodeLeaf, IDocNodeLeafParameters } from './DocNodeLeaf';

/**
 * Constructor parameters for {@link DocEscapedText}.
 */
export interface IDocEscapedTextParameters extends IDocNodeLeafParameters {
  escapeStyle: EscapeStyle;
  text: string;
}

/**
 * The style of escaping to be used with DocEscapedText.
 */
export enum EscapeStyle {
  /**
   * Use a backslash symbol to escape the character.
   */
  CommonMarkBackslash
}

/**
 * Represents a text character that should be escaped as a TSDoc symbol.
 * @remarks
 * Note that renders will normally apply appropriate escaping when rendering
 * DocPlainText in a format such as HTML or TSDoc.  The DocEscapedText node
 * forces a specific escaping that may not be the default.
 */
export class DocEscapedText extends DocNodeLeaf {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.EscapedText;

  private _escapeStyle: EscapeStyle | undefined;  // never undefined after updateParameters()
  private _text: string | undefined;              // never undefined after updateParameters()

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocEscapedTextParameters) {
    super(parameters);
  }

  /**
   * The style of escaping to be performed.
   */
  public get escapeStyle(): EscapeStyle {
    return this._escapeStyle!;
  }

  /**
   * The text content to be escaped.
   */
  public get text(): string {
    return this._text!;
  }

  /** @override */
  public updateParameters(parameters: IDocEscapedTextParameters): void {
    super.updateParameters(parameters);

    this._escapeStyle = parameters.escapeStyle;
    this._text = parameters.text;
  }
}
