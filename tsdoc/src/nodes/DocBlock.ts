import { DocNodeKind, DocNode, IDocNodeParameters, IDocNodeParsedParameters } from './DocNode';
import { DocSection } from './DocSection';
import { DocBlockTag } from './DocBlockTag';

/**
 * Constructor parameters for {@link DocBlock}.
 */
export interface IDocBlockParameters extends IDocNodeParameters {
  blockTag: DocBlockTag;
}

/**
 * Constructor parameters for {@link DocBlock}.
 */
export interface IDocBlockParsedParameters extends IDocNodeParsedParameters {
  blockTag: DocBlockTag;
}

/**
 * Represents a section that is introduced by a TSDoc block tag.
 * For example, an `@example` block.
 */
export class DocBlock extends DocNode {
  /** @override */
  public readonly kind: DocNodeKind = DocNodeKind.Block;

  private readonly _blockTag: DocBlockTag;
  private readonly _content: DocSection;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocBlockParameters | IDocBlockParsedParameters) {
    super(parameters);
    this._blockTag = parameters.blockTag;
    this._content = new DocSection();
  }

  /**
   * The TSDoc tag that introduces this section.
   */
  public get blockTag(): DocBlockTag {
    return this._blockTag;
  }

  /**
   * The TSDoc tag that introduces this section.
   */
  public get content(): DocSection {
    return this._content;
  }

  /** @override */
  protected onGetChildNodes(): ReadonlyArray<DocNode | undefined> {
    return [this.blockTag, this._content];
  }
}
