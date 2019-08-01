import { DocNode, DocNodeKind, DocPlainText, DocFencedCode, DocCodeSpan, DocLinkTag, DocEscapedText } from '../nodes';

/**
 * Renders a DocNode tree as plain text, without any rich text formatting or markup.
 */
export class PlainTextEmitter {

  /**
   * Returns true if the specified node contains any text content.
   *
   * @remarks
   * A documentation tool can use this test to report warnings when a developer neglected to write a code comment
   * for a declaration.
   *
   * @param node - this node and all its children will be considered
   * @param requiredCharacters - The test returns true if at least this many non-spacing characters are found.
   * The default value is 1.
   */
  public static hasAnyTextContent(node: DocNode, requiredCharacters?: number): boolean;

  /**
   * Returns true if the specified collection of nodes contains any text content.
   *
   * @remarks
   * A documentation tool can use this test to report warnings when a developer neglected to write a code comment
   * for a declaration.
   *
   * @param nodes - the collection of nodes to be tested
   * @param requiredCharacters - The test returns true if at least this many non-spacing characters are found.
   * The default value is 1.
   */
  public static hasAnyTextContent(nodes: readonly DocNode[], requiredCharacters?: number): boolean;
  public static hasAnyTextContent(nodeOrNodes: DocNode | readonly DocNode[], requiredCharacters?: number): boolean {
    if (requiredCharacters === undefined || requiredCharacters < 1) {
      requiredCharacters = 1; // default
    }

    let nodes: readonly DocNode[];
    if (nodeOrNodes instanceof DocNode) {
      nodes = [ nodeOrNodes ];
    } else {
      nodes = nodeOrNodes;
    }

    const foundCharacters: number = PlainTextEmitter._scanTextContent(nodes, requiredCharacters, 0);

    return foundCharacters >= requiredCharacters;
  }

  private static _scanTextContent(nodes: readonly DocNode[], requiredCharacters: number,
    foundCharacters: number): number {

    for (const node of nodes) {
      switch (node.kind) {
        case DocNodeKind.FencedCode:
          const docFencedCode: DocFencedCode = node as DocFencedCode;
          foundCharacters += PlainTextEmitter._countNonSpaceCharacters(docFencedCode.code);
          break;

        case DocNodeKind.CodeSpan:
          const docCodeSpan: DocCodeSpan = node as DocCodeSpan;
          foundCharacters += PlainTextEmitter._countNonSpaceCharacters(docCodeSpan.code);
          break;
        case DocNodeKind.EscapedText:
          const docEscapedText: DocEscapedText = node as DocEscapedText;
          foundCharacters += PlainTextEmitter._countNonSpaceCharacters(docEscapedText.decodedText);
          break;

        case DocNodeKind.LinkTag:
          const docLinkTag: DocLinkTag = node as DocLinkTag;
          foundCharacters += PlainTextEmitter._countNonSpaceCharacters(docLinkTag.linkText || '');
          break;

        case DocNodeKind.PlainText:
          const docPlainText: DocPlainText = node as DocPlainText;
          foundCharacters += PlainTextEmitter._countNonSpaceCharacters(docPlainText.text);
          break;
      }

      if (foundCharacters >= requiredCharacters) {
        break;
      }

      foundCharacters += PlainTextEmitter._scanTextContent(node.getChildNodes(), requiredCharacters, foundCharacters);

      if (foundCharacters >= requiredCharacters) {
        break;
      }
    }

    return foundCharacters;
  }

  private static _countNonSpaceCharacters(s: string): number {
    let count: number = 0;
    const length: number = s.length;
    let i: number = 0;
    while (i < length) {
      switch (s.charCodeAt(i)) {
        case 32:  // space
        case 9:   // tab
        case 13:  // CR
        case 10:  // LF
          break;
        default:
          ++count;
      }
      ++i;
    }
    return count;
  }
}
