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
  /** {@inheritDoc} */
  public readonly kind: DocNodeKind = DocNodeKind.CodeSpan;

  // The opening ` delimiter
  private _openingDelimiterParticle: DocParticle | undefined;  // never undefined after updateParameters()

  // The code content
  private _codeParticle: DocParticle | undefined;              // never undefined after updateParameters()

  // The closing ` delimiter
  private _closingDelimiterParticle: DocParticle | undefined;  // never undefined after updateParameters()

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocCodeSpanParameters) {
    super(parameters);
  }

  /**
   * The text that should be rendered as code, excluding the backtick delimiters.
   */
  public get code(): string {
    return this._codeParticle!.content;
  }

  /** @override */
  public updateParameters(parameters: IDocCodeSpanParameters): void {
    super.updateParameters(parameters);

    this._openingDelimiterParticle = new DocParticle({
      particleId: 'openingDelimiter',
      excerpt: parameters.openingDelimiterExcerpt,
      content: '`'
    });

    this._codeParticle = new DocParticle({
      particleId: 'code',
      excerpt: parameters.codeExcerpt,
      content: parameters.code
    });

    this._closingDelimiterParticle = new DocParticle({
      particleId: 'closingDelimiter',
      excerpt: parameters.closingDelimiterExcerpt,
      content: '`'
    });
  }

  /**
   * {@inheritDoc}
   * @override
   */
  public getChildNodes(): ReadonlyArray<DocNode> {
    return [
      this._openingDelimiterParticle!,
      this._codeParticle!,
      this._closingDelimiterParticle!
    ];
  }
}
