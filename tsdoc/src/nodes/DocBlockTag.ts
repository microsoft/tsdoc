import { DocNode, DocNodeKind, IDocNodeParameters } from './DocNode';

/**
 * Constructor parameters for {@link DocBlockTag}.
 */
export interface IDocBlockTagParameters extends IDocNodeParameters {
  tagName: string;
}

/**
 * Represents a TSDoc block tag such as `@param` or `@public`.
 */
export class DocBlockTag extends DocNode {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.BlockTag;

  /**
   * The TSDoc tag name.  TSDoc tag names start with an at-sign ("@") followed
   * by ASCII letters using "camelCase" capitalization.
   */
  public readonly tagName: string;

  /**
   * The TSDoc tag name in all capitals, which is used for performing
   * case-insensitive comparisons or lookups.
   */
  public readonly tagNameForComparisons: string;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocBlockTagParameters) {
    super(parameters);

    DocNode.validateTSDocTagName(parameters.tagName);
    this.tagName = parameters.tagName;
    this.tagNameForComparisons = this.tagName.toUpperCase();
  }
}
