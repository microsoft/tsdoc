import { DocNode, DocNodeKind } from './DocNode';
import { DocNodeLeaf, IDocNodeLeafParameters } from './DocNodeLeaf';

/**
 * Constructor parameters for {@link DocParticle}.
 */
export interface IDocParticleParameters extends IDocNodeLeafParameters {
  particleId: string;
  content: string;
  spacingAfterContent?: string | undefined;
}

/**
 * DocParticle is used to represent additional generic nodes that are part of the
 * DocNode tree, for the purpose of providing additional Excerpt information.
 *
 * @remarks
 * For example, a DocHtmlAttribute has a "=" delimiter and a quoted text string
 * that may be interesting to highlight in an editor; however, it would be awkward
 * to expect developers to construct these nodes as part of constructing a
 * DocHtmlAttribute object.  Instead, the developer merely assigns
 * DocHtmlAttribute.attributeValue, and the particle nodes automatically appear
 * in the tree as a byproduct.  And rather than introducing lots of special-purpose
 * types (e.g. DocHtmlAttributeEqualsDelimiter or DocHtmlAttributeStringValue),
 * they are represented as generic "DocParticle" nodes.
 */
export class DocParticle extends DocNodeLeaf {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.Particle;

  private _particleId: string | undefined;
  private _content: string | undefined;
  private _spacingAfterContent: string | undefined;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocParticleParameters) {
    super(parameters);
  }

  /**
   * A string identifier that uniquely identifies a particle among its siblings.
   * This can be used by DocNode.getChildren() visitors to determine what the particle
   * represents.
   */
  public get particleId(): string {
    return this._particleId!;
  }

  /**
   * The text representation of this particle, excluding any surrounding whitespace.
   */
  public get content(): string {
    return this._content!;
  }

  /**
   * Optional explicit whitespace that appears after the main content.
   * If undefined, then the renderer can use a formatting rule to generate appropriate spacing.
   */
  public get spacingAfterContent(): string | undefined {
    return this._spacingAfterContent;
  }

  /** @override */
  public updateParameters(parameters: IDocParticleParameters): void {
    DocNode.validateSpacing(parameters.spacingAfterContent, 'spacingAfterContent');

    if (this._particleId && parameters.particleId !== this._particleId) {
      throw new Error('The particleId cannot be changed using updateParameters()');
    }

    super.updateParameters(parameters);

    this._particleId = parameters.particleId;
    this._content = parameters.content;
    this._spacingAfterContent = parameters.spacingAfterContent;
  }
}
