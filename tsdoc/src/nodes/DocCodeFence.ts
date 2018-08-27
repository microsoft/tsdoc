import { DocNodeKind, IDocNodeParameters, DocNode } from './DocNode';
import { Excerpt } from '../parser/Excerpt';
import { DocParticle } from './DocParticle';

/**
 * Constructor parameters for {@link DocCodeFence}.
 */
export interface IDocCodeFenceParameters extends IDocNodeParameters {
  openingDelimiterExcerpt?: Excerpt;

  languageExcerpt?: Excerpt;
  language?: string | 'ts' | undefined;

  textExcerpt?: Excerpt;
  text: string;

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
  private readonly _languageParticle: DocParticle | undefined;

  private readonly _textParticle: DocParticle;

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

    if (parameters.language && parameters.language.length > 0) {
      this._languageParticle = new DocParticle({
        excerpt: parameters.languageExcerpt,
        content: parameters.language
      });
    }

    this._textParticle = new DocParticle({
      excerpt: parameters.textExcerpt,
      content: parameters.text
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
  public get language(): string | 'ts' | undefined {
    if (this._languageParticle) {
      return this._languageParticle.content;
    }
    return undefined;
  }

  /**
   * The text that should be rendered as code.
   */
  public get text(): string {
    return this._textParticle.content;
  }

  /**
   * {@inheritdoc}
   * @override
   */
  public getChildNodes(): ReadonlyArray<DocNode> {
    const result: DocNode[] = [ ];

    result.push(this._openingDelimiterParticle);

    if (this._languageParticle) {
      result.push(this._languageParticle);
    }

    result.push(this._textParticle);
    result.push(this._closingDelimiterParticle);

    return result;
  }
}
