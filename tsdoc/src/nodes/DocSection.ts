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
  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocSectionParameters | IDocSectionParsedParameters, children?: DocNode[]) {
    super(parameters, children);
  }

  /** @override */
  public get kind(): DocNodeKind | string {
    return DocNodeKind.Section;
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
