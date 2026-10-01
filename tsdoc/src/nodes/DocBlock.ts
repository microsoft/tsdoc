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
   * The rich text that appears on the same line as the block tag, or `undefined` if the tag line has
   * no content.
   *
   * @remarks
   * This is a derived view over {@link DocBlock.content}: it returns the leading nodes of the first
   * paragraph, up to (but not including) the first line break, re-wrapped in a synthesized
   * {@link DocParagraph} with surrounding spaces trimmed.  It is `undefined` when the tag line has no
   * non-whitespace content (for example when the block's content begins on the next line).
   *
   * The tag line content supports the same inline content as any paragraph (for example `{@link}`
   * tags or code spans).  Because TSDoc inline tags may span multiple lines, an inline tag that opens
   * on the tag line but closes on a later line is a single node with no intervening line break, so the
   * tag line content extends across those lines up to where the tag closes.
   *
   * Individual tags assign their own meaning to this content.  For example, an `@example` block
   * interprets its tag line content as the title of the example; a documentation tool may fall back to
   * numeric indexing when it is `undefined`.
   *
   * The underlying nodes are shared with {@link DocBlock.content}; this view does not modify the block.
   */
  public get tagLineContent(): DocParagraph | undefined {
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
      // The block's content begins with a line break, so the tag line has no content.
      return undefined;
    }

    const tagLineNodes: DocNode[] = [];
    for (const node of paragraphNodes) {
      if (node.kind === DocNodeKind.SoftBreak) {
        break;
      }
      tagLineNodes.push(node);
    }

    const tagLineParagraph: DocParagraph = new DocParagraph(
      { configuration: this.configuration },
      tagLineNodes
    );
    const trimmedContent: DocParagraph = DocNodeTransforms.trimSpacesInParagraph(tagLineParagraph);

    // A tag line containing only whitespace has no content.
    if (trimmedContent.nodes.length === 0) {
      return undefined;
    }

    return trimmedContent;
  }

  /**
   * The block's {@link DocBlock.content} excluding its {@link DocBlock.tagLineContent}.
   *
   * @remarks
   * This is a derived view over {@link DocBlock.content}: when {@link DocBlock.tagLineContent} is
   * present, the remainder of the first paragraph (the nodes after the first line break) is re-wrapped
   * in a synthesized {@link DocParagraph}, followed by the remaining content nodes.  When there is no
   * tag line content, this returns the full content.
   *
   * The underlying nodes are shared with {@link DocBlock.content}; this view does not modify the block.
   */
  public get bodyContent(): DocSection {
    const bodySection: DocSection = new DocSection({ configuration: this.configuration });
    const contentNodes: ReadonlyArray<DocNode> = this._content.nodes;

    if (this.tagLineContent === undefined) {
      bodySection.appendNodes(contentNodes);
      return bodySection;
    }

    // The tag line content consumed the leading portion of the first paragraph; recover the remainder
    // that follows its first line break and re-wrap it in a synthesized paragraph.
    const paragraphNodes: ReadonlyArray<DocNode> = (contentNodes[0] as DocParagraph).nodes;
    let softBreakIndex: number = -1;
    for (let i: number = 0; i < paragraphNodes.length; ++i) {
      if (paragraphNodes[i].kind === DocNodeKind.SoftBreak) {
        softBreakIndex = i;
        break;
      }
    }
    if (softBreakIndex >= 0) {
      // Skip the line breaks that separated the tag line content from the body before re-wrapping the
      // remainder.
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
