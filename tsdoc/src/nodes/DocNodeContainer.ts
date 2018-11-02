import { DocNode, IDocNodeParameters, IDocNodeParsedParameters } from './DocNode';

/**
 * Constructor parameters for {@link DocNodeContainer}.
 */
export interface IDocNodeContainerParameters extends IDocNodeParameters {

}

/**
 * Constructor parameters for {@link DocNodeContainer}.
 */
export interface IDocNodeContainerParsedParameters extends IDocNodeParsedParameters {

}

/**
 * DocNodeContainer is the base class for DocNode classes that allow arbitrary child nodes to be added by the consumer.
 * The child classes are {@link DocParagraph} and {@link DocSection}.
 */
export abstract class DocNodeContainer extends DocNode {
  private readonly _nodes: DocNode[] = [];

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocNodeContainerParameters | IDocNodeContainerParsedParameters) {
    super(parameters);
  }

  /**
   * The nodes that were added to this container.
   */
  public get nodes(): ReadonlyArray<DocNode> {
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
   * Append a node to the container.
   */
  public appendNode(docNode: DocNode): void {
    if (!this.isAllowedChildNode(docNode)) {
      throw new Error(`A ${this.kind} cannot contain nodes of type ${docNode.kind}`);
    }
    this._nodes!.push(docNode);
  }

  /**
   * Append nodes to the container.
   */
  public appendNodes(docNodes: ReadonlyArray<DocNode>): void {
    for (const docNode of docNodes) {
      this.appendNode(docNode);
    }
  }

  /**
   * Remove all nodes from the container.
   */
  public clearNodes(): void {
    this._nodes!.length = 0;
  }

  /** @override */
  protected onGetChildNodes(): ReadonlyArray<DocNode | undefined> {
    return this._nodes;
  }
}
