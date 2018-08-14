import { DocNode, DocNodeKind, IDocNodeParameters } from './DocNode';

/**
 * Constructor parameters for {@link DocSection}.
 */
export interface IDocSectionParameters extends IDocNodeParameters {

}

/**
 * Represents a general block of rich text.  DocSection is a simple container
 * for other DocNode child nodes.
 *
 * @remarks
 *
 * Some terminology: A "block" is a section that is introduced by a TSDoc block tag (e.g. `@example`).
 * Since in many cases the block tag may not always be required or part of the structure being discussed,
 * "section" is often used interchangeably with "block".
 */
export class DocSection extends DocNode {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.Section;

  private readonly _nodes: DocNode[] = [];

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocSectionParameters) {
    super(parameters);
  }

  /**
   * The child nodes.
   */
  public get nodes(): ReadonlyArray<DocNode> {
    return this._nodes;
  }

  /**
   * {@inheritdoc}
   * @override
   */
  public getChildNodes(): ReadonlyArray<DocNode> {
    return this._nodes;
  }

  /**
   * Append a node to the collection.
   */
  public appendNode(docNode: DocNode): void {
    switch (docNode.kind) {
      case DocNodeKind.Comment:
      case DocNodeKind.Section:
      case DocNodeKind.ParamSection:
        throw new Error(`A DocSection cannot contain nodes of type ${DocNodeKind[docNode.kind]}`);
    }
    this._nodes.push(docNode);
  }

  public appendNodes(docNodes: ReadonlyArray<DocNode>): void {
    for (const docNode of docNodes) {
      this.appendNode(docNode);
    }
  }
}
