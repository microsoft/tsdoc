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
 * Represents a parsed `@param` or `@typeParam` block, which provides a description for a
 * function parameter.
 */
export class DocParamBlock extends DocBlock {
  /** {@inheritDoc} */
  public readonly kind: DocNodeKind = DocNodeKind.ParamBlock;

  private _parameterNameParticle: DocParticle | undefined;  // never undefined after updateParameters()
  private _hyphenParticle: DocParticle | undefined;         // never undefined after updateParameters()

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocParamBlockParameters) {
    super(parameters);
  }

  /**
   * The name of the parameter that is being documented.
   * For example "width" in `@param width - the width of the object`.
   */
  public get parameterName(): string {
    return this._parameterNameParticle!.content;
  }

  /** @override */
  public updateParameters(parameters: IDocParamBlockParameters): void {
    super.updateParameters(parameters);

    this._parameterNameParticle = new DocParticle({
      particleId: 'parameterName',
      excerpt: parameters.parameterNameExcerpt,
      content: parameters.parameterName
    });

    this._hyphenParticle = new DocParticle({
      particleId: 'hyphen',
      excerpt: parameters.hyphenExcerpt,
      content: '-'
    });
  }

  /**
   * {@inheritDoc}
   * @override
   */
  public getChildNodes(): ReadonlyArray<DocNode> {
    return [
      this.blockTag,
      this._parameterNameParticle!,
      this._hyphenParticle!,

      ...this.nodes
    ];
  }
}
