import { DocNodeKind, DocNode } from './DocNode';
import { DocBlock, IDocBlockParameters } from './DocBlock';
import { DocParticle } from './DocParticle';
import { Excerpt } from '../parser/Excerpt';

/**
 * Constructor parameters for {@link DocParamBlock}.
 */
export interface IDocParamBlockParameters extends IDocBlockParameters {
  parameterNameExcerpt?: Excerpt;
  parameterName: string;

  hyphenExcerpt?: Excerpt;
}

/**
 * Represents a parsed `@param` block, which provides a description for a
 * function parameter.
 */
export class DocParamBlock extends DocBlock {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.ParamBlock;

  private readonly _parameterNameParticle: DocParticle;
  private readonly _hyphenParticle: DocParticle;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocParamBlockParameters) {
    super(parameters);

    this._parameterNameParticle = new DocParticle({
      excerpt: parameters.parameterNameExcerpt,
      content: parameters.parameterName
    });

    this._hyphenParticle = new DocParticle({
      excerpt: parameters.hyphenExcerpt,
      content: '-'
    });
  }

  /**
   * The name of the parameter that is being documented.
   * For example "width" in `@param width - the width of the object`.
   */
  public get parameterName(): string {
    return this._parameterNameParticle.content;
  }

  /**
   * {@inheritdoc}
   * @override
   */
  public getChildNodes(): ReadonlyArray<DocNode> {
    return [
      this.blockTag,
      this._parameterNameParticle,
      this._hyphenParticle,

      ...this.nodes
    ];
  }
}
