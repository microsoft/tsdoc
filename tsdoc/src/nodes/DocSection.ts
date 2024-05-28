// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { type DocNode, DocNodeKind } from './DocNode';
import { DocParagraph } from './DocParagraph';
import {
  DocNodeContainer,
  type IDocNodeContainerParameters,
  type IDocNodeContainerParsedParameters
} from './DocNodeContainer';

/**
 * Constructor parameters for {@link DocSection}.
 */
export interface IDocSectionParameters extends IDocNodeContainerParameters {}

/**
 * Constructor parameters for {@link DocSection}.
 */
export interface IDocSectionParsedParameters extends IDocNodeContainerParsedParameters {}

/**
 * Represents a general block of rich text.
 */
export class DocSection extends DocNodeContainer {
  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(
    parameters: IDocSectionParameters | IDocSectionParsedParameters,
    childNodes?: ReadonlyArray<DocNode>
  ) {
    super(parameters, childNodes);
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

  public appendNodesInParagraph(docNodes: ReadonlyArray<DocNode>): void {
    for (const docNode of docNodes) {
      this.appendNodeInParagraph(docNode);
    }
  }
}
