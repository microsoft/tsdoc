import { DocNodeKind, IDocNodeParsedParameters, DocNode } from './DocNode';
import { DocExcerpt, ExcerptId } from './DocExcerpt';
import { TokenSequence } from '../parser/TokenSequence';

/**
 * Constructor parameters for {@link DocEscapedText}.
 */
export interface IDocEscapedTextParsedParameters extends IDocNodeParsedParameters {
  escapeStyle: EscapeStyle;
  encodedTextExcerpt: TokenSequence;
  decodedText: string;
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
  /** {@inheritDoc} */
  public readonly kind: DocNodeKind = DocNodeKind.EscapedText;

  private readonly _escapeStyle: EscapeStyle;

  private _encodedText: string | undefined;
  private readonly _encodedTextExcerpt: DocExcerpt;

  private readonly _decodedText: string;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocEscapedTextParsedParameters) {
    super(parameters);

    this._escapeStyle = parameters.escapeStyle;

    this._encodedTextExcerpt = new DocExcerpt({
      excerptId: ExcerptId.EscapedText,
      content: parameters.encodedTextExcerpt
    });

    this._decodedText = parameters.decodedText;
  }

  /**
   * The style of escaping to be performed.
   */
  public get escapeStyle(): EscapeStyle {
    return this._escapeStyle;
  }

  /**
   * The text sequence including escapes.
   */
  public get encodedText(): string {
    if (this._encodedText === undefined) {
      this._encodedText = this._encodedTextExcerpt.content.toString();
    }
    return this._encodedText;
  }

  /**
   * The text without escaping.
   */
  public get decodedText(): string {
    return this._decodedText;
  }

  /** @override */
  protected onGetChildNodes(): ReadonlyArray<DocNode | undefined> {
    return [
      this._encodedTextExcerpt
    ];
  }
}
