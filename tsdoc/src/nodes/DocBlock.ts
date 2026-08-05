// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { DocNodeKind, DocNode, type IDocNodeParameters, type IDocNodeParsedParameters } from './DocNode';
import { DocSection } from './DocSection';
import { DocParagraph } from './DocParagraph';
import { DocNodeTransforms } from '../transforms/DocNodeTransforms';
import type { DocBlockTag } from './DocBlockTag';

/**
 * Constructor parameters for {@link DocBlock}.
 */
export interface IDocBlockParameters extends IDocNodeParameters {
  blockTag: DocBlockTag;
}

/**
 * Constructor parameters for {@link DocBlock}.
 */
export interface IDocBlockParsedParameters extends IDocNodeParsedParameters {
  blockTag: DocBlockTag;
}

/**
 * Represents a section that is introduced by a TSDoc block tag.
 * For example, an `@example` block.
 */
export class DocBlock extends DocNode {
  private readonly _blockTag: DocBlockTag;
  private readonly _content: DocSection;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocBlockParameters | IDocBlockParsedParameters) {
    super(parameters);
    this._blockTag = parameters.blockTag;
    this._content = new DocSection({ configuration: this.configuration });
  }

  /** @override */
  public get kind(): DocNodeKind | string {
    return DocNodeKind.Block;
  }

  /**
   * The TSDoc tag that introduces this section.
   */
  public get blockTag(): DocBlockTag {
    return this._blockTag;
  }

  /**
   * The TSDoc tag that introduces this section.
   */
  public get content(): DocSection {
    return this._content;
  }

  /**
   * The block's "title", i.e. the rich text that appears on the same line as the block tag.
   *
   * @remarks
   * Per the TSDoc specification, the text that appears on the same line as certain block tags (such as
   * `@example`) is interpreted as a title.  This accessor is a derived view over {@link DocBlock.content}:
   * it returns the leading nodes of the first paragraph, up to (but not including) the first line break,
   * re-wrapped in a synthesized {@link DocParagraph} with surrounding spaces trimmed.
   *
   * The title supports the same inline content as any paragraph (for example `{@link}` tags or code
   * spans).  It is `undefined` when the block has no non-whitespace text on the tag line (for example when
   * the content begins on the next line), which a documentation tool may use to fall back to numeric indexing.
   *
   * Because TSDoc inline tags may span multiple lines, an inline tag that opens on the tag line but
   * closes on a later line is a single node with no intervening line break, so the title extends across
   * those lines up to where the tag closes.
   *
   * The underlying nodes are shared with {@link DocBlock.content}; this view does not modify the block.
   */
  public get title(): DocParagraph | undefined {
    const contentNodes: ReadonlyArray<DocNode> = this._content.nodes;
    if (contentNodes.length === 0) {
      return undefined;
    }

    const firstNode: DocNode = contentNodes[0];
    if (firstNode.kind !== DocNodeKind.Paragraph) {
      return undefined;
    }

    const paragraphNodes: ReadonlyArray<DocNode> = (firstNode as DocParagraph).nodes;
    if (paragraphNodes.length === 0 || paragraphNodes[0].kind === DocNodeKind.SoftBreak) {
      // The tag line has no text (the content begins with a line break), so there is no title.
      return undefined;
    }

    const titleNodes: DocNode[] = [];
    for (const node of paragraphNodes) {
      if (node.kind === DocNodeKind.SoftBreak) {
        break;
      }
      titleNodes.push(node);
    }

    const titleParagraph: DocParagraph = new DocParagraph({ configuration: this.configuration }, titleNodes);
    const trimmedTitle: DocParagraph = DocNodeTransforms.trimSpacesInParagraph(titleParagraph);

    // A tag line containing only whitespace is not a title.
    if (trimmedTitle.nodes.length === 0) {
      return undefined;
    }

    return trimmedTitle;
  }

  /**
   * The block's content excluding its {@link DocBlock.title}.
   *
   * @remarks
   * This accessor is a derived view over {@link DocBlock.content}: when a {@link DocBlock.title} is present,
   * the remainder of the first paragraph (the nodes after the first line break) is re-wrapped in a
   * synthesized {@link DocParagraph}, followed by the remaining content nodes.  When there is no title, this
   * returns the full content.
   *
   * The underlying nodes are shared with {@link DocBlock.content}; this view does not modify the block.
   */
  public get body(): DocSection {
    const bodySection: DocSection = new DocSection({ configuration: this.configuration });
    const contentNodes: ReadonlyArray<DocNode> = this._content.nodes;

    if (this.title === undefined) {
      bodySection.appendNodes(contentNodes);
      return bodySection;
    }

    // The title consumed the leading portion of the first paragraph; recover the remainder that follows
    // its first line break and re-wrap it in a synthesized paragraph.
    const paragraphNodes: ReadonlyArray<DocNode> = (contentNodes[0] as DocParagraph).nodes;
    let softBreakIndex: number = -1;
    for (let i: number = 0; i < paragraphNodes.length; ++i) {
      if (paragraphNodes[i].kind === DocNodeKind.SoftBreak) {
        softBreakIndex = i;
        break;
      }
    }
    if (softBreakIndex >= 0) {
      // Skip the line breaks that separated the title from the body before re-wrapping the remainder.
      let remainderStart: number = softBreakIndex + 1;
      while (
        remainderStart < paragraphNodes.length &&
        paragraphNodes[remainderStart].kind === DocNodeKind.SoftBreak
      ) {
        ++remainderStart;
      }
      const remainderNodes: ReadonlyArray<DocNode> = paragraphNodes.slice(remainderStart);
      if (remainderNodes.length > 0) {
        bodySection.appendNode(new DocParagraph({ configuration: this.configuration }, remainderNodes));
      }
    }

    bodySection.appendNodes(contentNodes.slice(1));
    return bodySection;
  }

  /** @override */
  protected onGetChildNodes(): ReadonlyArray<DocNode | undefined> {
    return [this.blockTag, this._content];
  }
}
