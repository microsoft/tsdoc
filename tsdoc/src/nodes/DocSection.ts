import { DocNode, DocNodeKind, IDocNodeParameters } from './DocNode';

/**
 * Constructor parameters for {@link DocSection}.
 */
export interface IDocDocSectionParameters extends IDocNodeParameters {

}

/**
 * Represents a general block of rich text.  DocSection is a simple container
 * for other DocNode child nodes.
 */
export class DocSection extends DocNode {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.Section;

  private readonly _nodes: DocNode[] = [];

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocDocSectionParameters) {
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
        throw new Error(`A DocSection cannot contain nodes of type ${DocNodeKind[docNode.kind]}`);
    }
    this._nodes.push(docNode);
  }
}
