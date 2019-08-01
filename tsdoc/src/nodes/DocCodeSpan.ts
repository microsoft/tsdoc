import { DocNodeKind, IDocNodeParameters, DocNode, IDocNodeParsedParameters } from './DocNode';
import { TokenSequence } from '../parser/TokenSequence';
import { DocExcerpt, ExcerptKind } from './DocExcerpt';

/**
 * Constructor parameters for {@link DocCodeSpan}.
 */
export interface IDocCodeSpanParameters extends IDocNodeParameters {
  code: string;
}

/**
 * Constructor parameters for {@link DocCodeSpan}.
 */
export interface IDocCodeSpanParsedParameters extends IDocNodeParsedParameters {
  openingDelimiterExcerpt: TokenSequence;

  codeExcerpt: TokenSequence;

  closingDelimiterExcerpt: TokenSequence;
}

/**
 * Represents CommonMark-style code span, i.e. code surrounded by
 * backtick characters.
 */
export class DocCodeSpan extends DocNode {
  // The opening ` delimiter
  private readonly _openingDelimiterExcerpt: DocExcerpt | undefined;

  // The code content
  private _code: string | undefined;
  private readonly _codeExcerpt: DocExcerpt | undefined;

  // The closing ` delimiter
  private readonly _closingDelimiterExcerpt: DocExcerpt | undefined;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocCodeSpanParameters | IDocCodeSpanParsedParameters) {
    super(parameters);

    if (DocNode.isParsedParameters(parameters)) {
      this._openingDelimiterExcerpt = new DocExcerpt({
        configuration: this.configuration,
        excerptKind: ExcerptKind.CodeSpan_OpeningDelimiter,
        content: parameters.openingDelimiterExcerpt
      });
      this._codeExcerpt = new DocExcerpt({
        configuration: this.configuration,
        excerptKind: ExcerptKind.CodeSpan_Code,
        content: parameters.codeExcerpt
      });
      this._closingDelimiterExcerpt = new DocExcerpt({
        configuration: this.configuration,
        excerptKind: ExcerptKind.CodeSpan_ClosingDelimiter,
        content: parameters.closingDelimiterExcerpt
      });
    } else {
      this._code = parameters.code;
    }
  }

  /** @override */
  public get kind(): DocNodeKind | string {
    return DocNodeKind.CodeSpan;
  }

  /**
   * The text that should be rendered as code, excluding the backtick delimiters.
   */
  public get code(): string {
    if (this._code === undefined) {
      this._code = this._codeExcerpt!.content.toString();
    }
    return this._code;
  }

  /** @override */
  protected onGetChildNodes(): readonly (DocNode | undefined)[] {
    return [
      this._openingDelimiterExcerpt,
      this._codeExcerpt,
      this._closingDelimiterExcerpt
    ];
  }
}
