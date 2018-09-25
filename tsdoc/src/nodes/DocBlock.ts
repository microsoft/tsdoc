import { DocNodeKind, DocNode } from './DocNode';
import { DocSection, IDocSectionParameters } from './DocSection';
import { DocBlockTag } from './DocBlockTag';

/**
 * Constructor parameters for {@link DocBlock}.
 */
export interface IDocBlockParameters extends IDocSectionParameters {
  blockTag: DocBlockTag;
}

/**
 * Represents a section that is introduced by a TSDoc block tag.
 * For example, an `@example` block.
 */
export class DocBlock extends DocSection {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.Block;

  private _blockTag: DocBlockTag | undefined;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocBlockParameters) {
    super(parameters);
  }

  /**
   * The TSDoc tag that introduces this section.
   */
  public get blockTag(): DocBlockTag {
    return this._blockTag!;
  }

  /** @override */
  public updateParameters(parameters: IDocBlockParameters): void {
    super.updateParameters(parameters);
    this._blockTag = parameters.blockTag;
  }

  /**
   * {@inheritdoc}
   * @override
   */
  public getChildNodes(): ReadonlyArray<DocNode> {
    return [this.blockTag, ...super.getChildNodes()];
  }
}
