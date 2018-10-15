import { DocNodeKind, IDocNodeParameters, DocNode, IDocNodeParsedParameters } from './DocNode';
import { TokenSequence } from '../parser/TokenSequence';
import { DocExcerpt, ExcerptId } from './DocExcerpt';

/**
 * Constructor parameters for {@link DocFencedCode}.
 */
export interface IDocFencedCodeParameters extends IDocNodeParameters {
  language: string;

  code: string;
}

/**
 * Constructor parameters for {@link DocFencedCode}.
 */
export interface IDocFencedCodeParsedParameters extends IDocNodeParsedParameters {
  openingFenceExcerpt: TokenSequence;
  spacingAfterOpeningFenceExcerpt?: TokenSequence;

  languageExcerpt?: TokenSequence;
  spacingAfterLanguageExcerpt?: TokenSequence;

  codeExcerpt: TokenSequence;

  spacingBeforeClosingFenceExcerpt?: TokenSequence;
  closingFenceExcerpt: TokenSequence;
  spacingAfterClosingFenceExcerpt?: TokenSequence;
}

/**
 * Represents CommonMark-style code fence, i.e. a block of program code that
 * starts and ends with a line comprised of three backticks.  The opening delimiter
 * can also specify a language for a syntax highlighter.
 */
export class DocFencedCode extends DocNode {
  /** {@inheritDoc} */
  public readonly kind: DocNodeKind = DocNodeKind.FencedCode;

  // The opening ``` delimiter and padding
  private readonly _openingFenceExcerpt: DocExcerpt | undefined;

  private readonly _spacingAfterOpeningFenceExcerpt: DocExcerpt | undefined;

  // The optional language string
  private _language: string | undefined;
  private readonly _languageExcerpt: DocExcerpt | undefined;

  private readonly _spacingAfterLanguageExcerpt: DocExcerpt | undefined;

  // The code content
  private _code: string | undefined;
  private readonly _codeExcerpt: DocExcerpt | undefined;

  // The closing ``` delimiter and padding
  private readonly _spacingBeforeClosingFenceExcerpt: DocExcerpt | undefined;

  private readonly _closingFenceExcerpt: DocExcerpt | undefined;

  private readonly _spacingAfterClosingFenceExcerpt: DocExcerpt | undefined;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocFencedCodeParameters | IDocFencedCodeParsedParameters) {
    super(parameters);

    if (DocNode.isParsedParameters(parameters)) {
      this._openingFenceExcerpt = new DocExcerpt({
        excerptId: ExcerptId.FencedCode_OpeningFence,
        content: parameters.openingFenceExcerpt
      });
      if (parameters.spacingAfterOpeningFenceExcerpt) {
        this._spacingAfterOpeningFenceExcerpt = new DocExcerpt({
          excerptId: ExcerptId.Spacing,
          content: parameters.spacingAfterOpeningFenceExcerpt
        });
      }

      if (parameters.languageExcerpt) {
        this._languageExcerpt = new DocExcerpt({
          excerptId: ExcerptId.FencedCode_Language,
          content: parameters.languageExcerpt
        });
      }
      if (parameters.spacingAfterLanguageExcerpt) {
        this._spacingAfterLanguageExcerpt = new DocExcerpt({
          excerptId: ExcerptId.Spacing,
          content: parameters.spacingAfterLanguageExcerpt
        });
      }

      this._codeExcerpt = new DocExcerpt({
        excerptId: ExcerptId.FencedCode_Code,
        content: parameters.codeExcerpt
      });

      if (parameters.spacingBeforeClosingFenceExcerpt) {
        this._spacingBeforeClosingFenceExcerpt = new DocExcerpt({
          excerptId: ExcerptId.Spacing,
          content: parameters.spacingBeforeClosingFenceExcerpt
        });
      }
      this._closingFenceExcerpt = new DocExcerpt({
        excerptId: ExcerptId.FencedCode_ClosingFence,
        content: parameters.closingFenceExcerpt
      });
      if (parameters.spacingAfterClosingFenceExcerpt) {
        this._spacingAfterClosingFenceExcerpt = new DocExcerpt({
          excerptId: ExcerptId.Spacing,
          content: parameters.spacingAfterClosingFenceExcerpt
        });
      }
    } else {
      this._code = parameters.code;
      this._language = parameters.language;
    }
  }

  /**
   * A name that can optionally be included after the opening code fence delimiter,
   * on the same line as the three backticks.  This name indicates the programming language
   * for the code, which a syntax highlighter may use to style the code block.
   *
   * @remarks
   * The TSDoc standard requires that the language "ts" should be interpreted to mean TypeScript.
   * Other languages names may be supported, but this is implementation dependent.
   *
   * CommonMark refers to this field as the "info string".
   *
   * @privateRemarks
   * Examples of language strings supported by GitHub flavored markdown:
   * https://raw.githubusercontent.com/github/linguist/master/lib/linguist/languages.yml
   */
  public get language(): string | 'ts' | '' {
    if (this._language === undefined) {
      if (this._languageExcerpt !== undefined) {
        this._language = this._languageExcerpt.content.toString();
      } else {
        this._language = '';
      }
    }
    return this.language;
  }

  /**
   * The text that should be rendered as code.
   */
  public get code(): string {
    if (this._code === undefined) {
      if (this._codeExcerpt !== undefined) {
        this._code = this._codeExcerpt.content.toString();
      }
    }
    return this._code!;
  }

  /** @override */
  protected onGetChildNodes(): ReadonlyArray<DocNode | undefined> {
    return [
      this._openingFenceExcerpt,
      this._spacingAfterOpeningFenceExcerpt,

      this._languageExcerpt,
      this._spacingAfterLanguageExcerpt,

      this._codeExcerpt,

      this._spacingBeforeClosingFenceExcerpt,
      this._closingFenceExcerpt,
      this._spacingAfterClosingFenceExcerpt
    ];
  }
}
