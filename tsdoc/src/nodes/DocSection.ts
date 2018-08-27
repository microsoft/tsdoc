import { DocNode, DocNodeKind } from './DocNode';
import { DocParagraph } from './DocParagraph';
import { DocNodeContainer, IDocNodeContainerParameters } from './DocNodeContainer';

/**
 * Constructor parameters for {@link DocSection}.
 */
export interface IDocSectionParameters extends IDocNodeContainerParameters {

}

/**
 * Represents a general block of rich text.  DocSection is the base class for DocNode classes that
 * act as a simple container for other child nodes.
 */
export class DocSection extends DocNodeContainer {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.Section;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocSectionParameters) {
    super(parameters);
  }

  /**
   * {@inheritdoc}
   * @override
   */
  public isAllowedChildNode(docNode: DocNode): boolean {
    switch (docNode.kind) {
      case DocNodeKind.CodeFence:
      case DocNodeKind.ErrorText:
      case DocNodeKind.Paragraph:
        return true;
    }
    return false;
  }

  /**
   * If the last item in DocSection.nodes is not a DocParagraph, a new paragraph
   * is started.  Either way, the provided docNode will be appended to the paragraph.
   */
  public appendNodeInParagraph(docNode: DocNode): void {
    let paragraphNode: DocParagraph | undefined = undefined;

    if (this.nodes.length > 0) {
      const lastNode: DocNode = this.nodes[this.nodes.length - 1];
      if (lastNode.kind === DocNodeKind.Paragraph) {
        paragraphNode = lastNode as DocParagraph;
      }
    }
    if (!paragraphNode) {
      paragraphNode = new DocParagraph({ });
      this.appendNode(paragraphNode);
    }

    paragraphNode.appendNode(docNode);
  }
}
