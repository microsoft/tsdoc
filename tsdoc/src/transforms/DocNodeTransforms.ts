import { TrimSpacesTransform } from './TrimSpacesTransform';
import { DocParagraph, DocNode } from '../nodes';

/**
 * Helper functions that transform DocNode trees.
 */
export class DocNodeTransforms {
  /**
   * The SpaceTrimmer collapses extra spacing characters from plain text nodes.
   *
   * @remark
   * This is useful when emitting HTML, where any number of spaces are equivalent
   * to a single space.  It's also useful when emitting Markdown, where spaces
   * can be misinterpreted as an indented code block.
   *
   * For example, we might transform this:
   *
   * nodes: [
   *   { kind: PlainText, text: "   Here   are some   " },
   *   { kind: SoftBreak }
   *   { kind: PlainText, text: "   words" },
   *   { kind: SoftBreak }
   *   { kind: InlineTag, text: "{\@inheritDoc}" },
   *   { kind: PlainText, text: "to process." },
   *   { kind: PlainText, text: "  " },
   *   { kind: PlainText, text: "  " }
   * ]
   *
   * ...to this:
   *
   * nodes: [
   *   { kind: PlainText, text: "Here are some words " },
   *   { kind: InlineTag, text: "{\@inheritDoc}" },
   *   { kind: PlainText, text: "to process." }
   * ]
   *
   * @param docParagraph - a DocParagraph containing nodes to be transformed
   * @returns The transformed child nodes.
   */
  public static trimSpacesInParagraphNodes(docParagraph: DocParagraph): DocNode[] {
    return TrimSpacesTransform.transform(docParagraph);
  }
}
