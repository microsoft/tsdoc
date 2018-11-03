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
  public constructor(parameters: IDocNodeContainerParameters | IDocNodeContainerParsedParameters,
    children?: DocNode[]) {

    super(parameters);

    if (children !== undefined && children.length > 0) {
      this.appendNodes(children);
    }
  }

  /**
   * The nodes that were added to this container.
   */
  public get nodes(): ReadonlyArray<DocNode> {
    return this._nodes;
  }

  /**
   * Append a node to the container.
   */
  public appendNode(docNode: DocNode): void {
    if (!this.configuration.docNodeManager.isAllowedChild(this.kind, docNode.kind)) {
      throw new Error(`The TSDocConfiguration does not permit ${this.kind} to contain nodes of type ${docNode.kind}`);
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
