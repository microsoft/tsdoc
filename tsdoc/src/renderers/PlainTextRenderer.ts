import { DocNode, DocNodeKind, DocNodeContainer, DocPlainText } from '../nodes';

/**
 * Renders a DocNode tree as plain text, without any rich text formatting or markup.
 */
export class PlainTextRenderer {

  /**
   * Returns true if the specified collection of nodes contains any text content.
   */
  public static hasAnyTextContent(node: DocNode): boolean;
  public static hasAnyTextContent(nodes: ReadonlyArray<DocNode>): boolean;
  public static hasAnyTextContent(nodeOrNodes: DocNode | ReadonlyArray<DocNode>): boolean {
    if (nodeOrNodes instanceof DocNode) {
      nodeOrNodes = [nodeOrNodes];
    }

    for (const node of nodeOrNodes) {
      switch (node.kind) {
        case DocNodeKind.FencedCode:
        case DocNodeKind.CodeSpan:
        case DocNodeKind.EscapedText:
        case DocNodeKind.LinkTag:
          return true;
        case DocNodeKind.PlainText:
          const docPlainText: DocPlainText = node as DocPlainText;
          // Is there at least one non-spacing character?
          if (docPlainText.text.trim().length > 0) {
            return true;
          }
          break;
      }

      if (node instanceof DocNodeContainer) {
        for (const childNode of node.getChildNodes()) {
          if (this.hasAnyTextContent(childNode)) {
            return true;
          }
        }
      }
    }

    return false;
  }
}
