import { DocNodeKind, IDocNodeParameters, DocNode } from './DocNode';
import { DocParticle } from './DocParticle';
import { Excerpt } from '../parser/Excerpt';

/**
 * Constructor parameters for {@link DocCodeSpan}.
 */
export interface IDocCodeSpanParameters extends IDocNodeParameters {
  openingDelimiterExcerpt?: Excerpt;

  codeExcerpt?: Excerpt;
  code: string;

  closingDelimiterExcerpt?: Excerpt;
}

/**
 * Represents CommonMark-style code span, i.e. code surrounded by
 * backtick characters.
 */
export class DocCodeSpan extends DocNode {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.CodeSpan;

  // The opening ` delimiter
  private readonly _openingDelimiterParticle: DocParticle;

  // The code content
  private readonly _codeParticle: DocParticle;

  // The closing ` delimiter
  private readonly _closingDelimiterParticle: DocParticle;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocCodeSpanParameters) {
    super(parameters);

    this._openingDelimiterParticle = new DocParticle({
      excerpt: parameters.openingDelimiterExcerpt,
      content: '`'
    });

    this._codeParticle = new DocParticle({
      excerpt: parameters.codeExcerpt,
      content: parameters.code
    });

    this._closingDelimiterParticle = new DocParticle({
      excerpt: parameters.closingDelimiterExcerpt,
      content: '`'
    });

  }

  /**
   * The text that should be rendered as code, excluding the backtick delimiters.
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
      this._codeParticle,
      this._closingDelimiterParticle
    ];
  }
}
