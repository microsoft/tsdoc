import { DocNode, DocNodeKind, IDocNodeParameters } from './DocNode';

/**
 * Constructor parameters for {@link DocParticle}.
 */
export interface IDocParticleParameters extends IDocNodeParameters {
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
export class DocParticle extends DocNode {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.Particle;

  /**
   * The text representation of this particle, excluding any surrounding whitespace.
   */
  public readonly content: string;

  /**
   * Optional explicit whitespace that appears after the main content.
   * If undefined, then the renderer can use a formatting rule to generate appropriate spacing.
   */
  public readonly spacingAfterContent: string | undefined;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocParticleParameters) {
    super(parameters);
    this.content = parameters.content;
    this.spacingAfterContent = parameters.spacingAfterContent;
    DocNode.validateSpacing(parameters.spacingAfterContent, 'spacingAfterContent');
  }
}
