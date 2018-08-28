import { DocNodeKind, IDocNodeParameters, DocNode } from './DocNode';
import { Excerpt } from '../parser/Excerpt';
import { DocParticle } from './DocParticle';

/**
 * Constructor parameters for {@link DocCodeFence}.
 */
export interface IDocCodeFenceParameters extends IDocNodeParameters {
  openingDelimiterExcerpt?: Excerpt;

  languageExcerpt?: Excerpt;
  language?: string | 'ts' | '';

  codeExcerpt?: Excerpt;
  code: string;

  closingDelimiterExcerpt?: Excerpt;
}

/**
 * Represents CommonMark-style code fence, i.e. a block of program code that
 * starts and ends with a line comprised of three backticks.  The opening delimiter
 * can also specify a language for a syntax highlighter.
 */
export class DocCodeFence extends DocNode {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.CodeFence;

  // The attribute name
  private readonly _openingDelimiterParticle: DocParticle;

  // The "=" delimiter
  private readonly _languageParticle: DocParticle;

  private readonly _codeParticle: DocParticle;

  // The attribute value including quotation marks
  private readonly _closingDelimiterParticle: DocParticle;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocCodeFenceParameters) {
    super(parameters);

    this._openingDelimiterParticle = new DocParticle({
      excerpt: parameters.openingDelimiterExcerpt,
      content: '```'
    });

    this._languageParticle = new DocParticle({
      excerpt: parameters.languageExcerpt,
      content: parameters.language || ''
    });

    this._codeParticle = new DocParticle({
      excerpt: parameters.codeExcerpt,
      content: parameters.code
    });

    this._closingDelimiterParticle = new DocParticle({
      excerpt: parameters.closingDelimiterExcerpt,
      content: '```'
    });
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
   */
  public get language(): string | 'ts' | '' {
    return this._languageParticle.content;
  }

  /**
   * The text that should be rendered as code.
   */
  public get code(): string {
    return this._codeParticle.content;
  }

  /**
   * {@inheritdoc}
   * @override
   */
  public getChildNodes(): ReadonlyArray<DocNode> {
    return [
      this._openingDelimiterParticle,
      this._languageParticle,
      this._codeParticle,
      this._closingDelimiterParticle
    ];
  }
}
