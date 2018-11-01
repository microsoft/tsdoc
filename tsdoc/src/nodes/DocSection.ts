import { DocNode, DocNodeKind } from './DocNode';
import { DocParagraph } from './DocParagraph';
import {
  DocNodeContainer,
  IDocNodeContainerParameters,
  IDocNodeContainerParsedParameters
} from './DocNodeContainer';

/**
 * Constructor parameters for {@link DocSection}.
 */
export interface IDocSectionParameters extends IDocNodeContainerParameters {

}

/**
 * Constructor parameters for {@link DocSection}.
 */
export interface IDocSectionParsedParameters extends IDocNodeContainerParsedParameters {

}

/**
 * Represents a general block of rich text.
 */
export class DocSection extends DocNodeContainer {
  /** {@inheritDoc} */
  public readonly kind: DocNodeKind = DocNodeKind.Section;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocSectionParameters | IDocSectionParsedParameters) {
    super(parameters);
  }

  /**
   * {@inheritDoc DocNode.isAllowedChildNode}
   * @override
   */
  public static isAllowedChildNode(docNode: DocNode): boolean {
    switch (docNode.kind) {
      case DocNodeKind.FencedCode:
      case DocNodeKind.Paragraph:
        return true;
    }
    return false;
  }

  /**
   * {@inheritDoc}
   * @override
   */
  public isAllowedChildNode(docNode: DocNode): boolean {
    return DocSection.isAllowedChildNode(docNode);
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
      paragraphNode = new DocParagraph({ configuration: this.configuration });
      this.appendNode(paragraphNode);
    }

    paragraphNode.appendNode(docNode);
  }
}
