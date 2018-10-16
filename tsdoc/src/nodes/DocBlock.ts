import { DocNodeKind, DocNode } from './DocNode';
import { DocSection, IDocSectionParameters, IDocSectionParsedParameters } from './DocSection';
import { DocBlockTag } from './DocBlockTag';

/**
 * Constructor parameters for {@link DocBlock}.
 */
export interface IDocBlockParameters extends IDocSectionParameters {
  blockTag: DocBlockTag;
}

/**
 * Constructor parameters for {@link DocBlock}.
 */
export interface IDocBlockParsedParameters extends IDocSectionParsedParameters {
  blockTag: DocBlockTag;
}

/**
 * Represents a section that is introduced by a TSDoc block tag.
 * For example, an `@example` block.
 */
export class DocBlock extends DocSection {
  /** @override */
  public readonly kind: DocNodeKind = DocNodeKind.Block;

  private readonly _blockTag: DocBlockTag;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocBlockParameters | IDocBlockParsedParameters) {
    super(parameters);
    this._blockTag = parameters.blockTag;
  }

  /**
   * The TSDoc tag that introduces this section.
   */
  public get blockTag(): DocBlockTag {
    return this._blockTag;
  }

  /** @override */
  protected onGetChildNodes(): ReadonlyArray<DocNode | undefined> {
    return [this.blockTag, ...super.onGetChildNodes()];
  }
}
