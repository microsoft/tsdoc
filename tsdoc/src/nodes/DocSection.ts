import { DocNode, DocNodeKind, IDocNodeParameters } from './DocNode';

/**
 * Constructor parameters for {@link DocSection}.
 */
export interface IDocSectionParameters extends IDocNodeParameters {

}

/**
 * Represents a general block of rich text.  DocSection is the base class for DocNode classes that
 * act as a simple container for other child nodes.
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
    switch (docNode.kind) {
      case DocNodeKind.BlockTag:
      case DocNodeKind.CodeSpan:
      case DocNodeKind.ErrorText:
      case DocNodeKind.EscapedText:
      case DocNodeKind.HtmlStartTag:
      case DocNodeKind.HtmlEndTag:
      case DocNodeKind.InlineTag:
      case DocNodeKind.Paragraph:
      case DocNodeKind.PlainText:
      case DocNodeKind.SoftBreak:
        return true;
    }
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
