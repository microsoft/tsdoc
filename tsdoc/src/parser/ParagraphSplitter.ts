import {
  DocComment,
  DocSection,
  DocNode,
  DocNodeKind,
  DocParagraph,
  DocPlainText
} from '../nodes';

export class ParagraphSplitter {
  private static readonly _whitespaceRegExp: RegExp = /^\s*$/;

  /**
   * For each DocSection, split the DocParagraph into multiple paragraphs by looking
   * for one or more blank lines that separate the paragraphs.  (These "lines" are ended
   * by SoftBreak nodes).  The blank lines are assigned to the preceding paragraph,
   * and referred to as the "trailer".
   */
  public static splitParagraphs(docComment: DocComment): void {
    for (const node of docComment.getChildNodes()) {
      if (node instanceof DocSection) {
        ParagraphSplitter._splitParagraphsForSection(node);
      }
    }
  }

  private static _splitParagraphsForSection(docSection: DocSection): void {
    const inputNodes: ReadonlyArray<DocNode> = docSection.nodes;
    const outputNodes: DocNode[] = [];

    for (const oldNode of inputNodes) {
      if (oldNode.kind === DocNodeKind.Paragraph) {
        ParagraphSplitter._splitParagraph(oldNode as DocParagraph, outputNodes);
      } else {
        outputNodes.push(oldNode);
      }
    }

    // Replace the inputNodes with the outputNodes
    docSection.clearNodes();
    docSection.appendNodes(outputNodes);
  }

  private static _splitParagraph(oldParagraph: DocParagraph, outputNodes: DocNode[]): void {
    const inputParagraphNodes: ReadonlyArray<DocNode> = oldParagraph.nodes;

    let currentParagraph: DocParagraph = new DocParagraph({ });
    outputNodes.push(currentParagraph);

    const enum SplitterState {
      Start,
      AwaitingTrailer,
      ReadingTrailer
    }
    let state: SplitterState = SplitterState.Start;

    let currentIndex: number = 0;
    while (currentIndex < inputParagraphNodes.length) {

      // Scan forwards to the end of the line
      let isBlankLine: boolean = true;
      let lineEndIndex: number = currentIndex; // non-inclusive
      do {
        const node: DocNode = inputParagraphNodes[lineEndIndex++];
        if (node.kind === DocNodeKind.SoftBreak) {
          break;
        }
        if (isBlankLine) {
          if (!this._isWhitespace(node)) {
            isBlankLine = false;
          }
        }
      } while (lineEndIndex < inputParagraphNodes.length);

      // At this point, the line and SoftBreak will be in inputParagraphNodes.slice(currentIndex, lineEndIndex)

      switch (state) {
        case SplitterState.Start:
          // We're skipping any blank lines that start the first paragraph
          if (!isBlankLine) {
            state = SplitterState.AwaitingTrailer;
          }
          break;
        case SplitterState.AwaitingTrailer:
          // We already saw some content, so now we're looking for a blank line that starts the trailer
          // at the end of this paragraph
          if (isBlankLine) {
            state = SplitterState.ReadingTrailer;
          }
          break;
        case SplitterState.ReadingTrailer:
          // We already found the trailer, so now we're looking for a non-blank line that will
          // begin a new paragraph
          if (!isBlankLine) {
            // Start a new paragraph
            currentParagraph = new DocParagraph({ });
            outputNodes.push(currentParagraph);

            state = SplitterState.AwaitingTrailer;
          }
          break;
      }

      // Append the line onto the current paragraph
      for (let i: number = currentIndex; i < lineEndIndex; ++i) {
        currentParagraph.appendNode(inputParagraphNodes[i]);
      }

      currentIndex = lineEndIndex;
    }
  }

  private static _isWhitespace(node: DocNode): boolean {
    switch (node.kind) {
      case DocNodeKind.PlainText:
        const docPlainText: DocPlainText = node as DocPlainText;
        return ParagraphSplitter._whitespaceRegExp.test(docPlainText.text);
      default:
        return false;
    }
  }
}
