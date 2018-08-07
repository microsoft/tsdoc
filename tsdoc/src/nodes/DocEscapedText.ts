import { DocNode, DocNodeKind, IDocNodeParameters } from './DocNode';

/**
 * Constructor parameters for {@link DocEscapedText}.
 */
export interface IDocEscapedTextParameters extends IDocNodeParameters {
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
export class DocEscapedText extends DocNode {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.EscapedText;

  /**
   * The style of escaping to be performed.
   */
  public readonly escapeStyle: EscapeStyle;

  /**
   * The text content to be escaped.
   */
  public readonly text: string;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocEscapedTextParameters) {
    super(parameters);
    this.escapeStyle = parameters.escapeStyle;
    this.text = parameters.text;
  }
}
