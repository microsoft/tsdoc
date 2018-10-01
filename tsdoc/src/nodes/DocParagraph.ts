import { DocNodeKind, DocNode } from './DocNode';
import { DocNodeContainer, IDocNodeContainerParameters } from './DocNodeContainer';

/**
 * Constructor parameters for {@link DocParagraph}.
 */
export interface IDocParagraphParameters extends IDocNodeContainerParameters {
}

/**
 * Represents a paragraph of text, similar to a `<p>` element in HTML.
 * Like CommonMark, the TSDoc syntax uses blank lines to delineate paragraphs
 * instead of explicitly notating them.
 */
export class DocParagraph extends DocNodeContainer {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.Paragraph;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocParagraphParameters) {
    super(parameters);
  }

  /**
   * {@inheritdoc}
   * @override
   */
  public isAllowedChildNode(docNode: DocNode): boolean {
    // NOTE: DocNodeKind.Paragraph cannot be nested
    switch (docNode.kind) {
      case DocNodeKind.BlockTag:
      case DocNodeKind.CodeSpan:
      case DocNodeKind.ErrorText:
      case DocNodeKind.EscapedText:
      case DocNodeKind.HtmlStartTag:
      case DocNodeKind.HtmlEndTag:
      case DocNodeKind.InlineTag:
      case DocNodeKind.InheritDocTag:
      case DocNodeKind.LinkTag:
      case DocNodeKind.PlainText:
      case DocNodeKind.SoftBreak:
        return true;
    }
    return false;
  }
}
