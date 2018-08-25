import { DocNode, IDocNodeParameters } from './DocNode';

/**
 * Constructor parameters for {@link DocSection}.
 */
export interface IDocNodeContainerParameters extends IDocNodeParameters {

}

/**
 * DocNodeContainer is the base class for DocNode classes that act as a simple container
 * for other child nodes.  The child classes are {@link DocParagraph} and {@link DocSection}.
 */
export abstract class DocNodeContainer extends DocNode {
  private readonly _nodes: DocNode[] = [];

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocNodeContainerParameters) {
    super(parameters);
  }

  /**
   * The child nodes.  Note that for subclasses {@link getChildNodes()} may enumerate
   * additional nodes that are not part of this collection.
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
   * Returns true if the specified `docNode` is allowed to be added as a child node.
   * The {@link appendNode()} and {@link appendNodes()} functions use this to validate their
   * inputs.
   *
   * @virtual
   */
  public isAllowedChildNode(docNode: DocNode): boolean {
    return false;
  }

  /**
   * Append a node to the collection.
   */
  public appendNode(docNode: DocNode): void {
    if (!this.isAllowedChildNode(docNode)) {
      throw new Error(`A DocSection cannot contain nodes of type ${docNode.kind}`);
    }
    this._nodes.push(docNode);
  }

  public appendNodes(docNodes: ReadonlyArray<DocNode>): void {
    for (const docNode of docNodes) {
      this.appendNode(docNode);
    }
  }
}
