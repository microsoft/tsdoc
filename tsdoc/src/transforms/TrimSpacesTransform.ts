import {
  DocParagraph,
  DocNode,
  DocNodeKind,
  DocPlainText,
  IDocPlainTextParameters
} from '../nodes';

/**
 * Implementation of DocNodeTransforms.trimSpacesInParagraphNodes()
 */
export class TrimSpacesTransform {
  public static transform(docParagraph: DocParagraph): DocNode[] {
    const transformedNodes: DocNode[] = [];

    // Whether the next nonempty node to be added needs a space before it
    let pendingSpace: boolean = false;

    // The DocPlainText node that we're currently accumulating
    let accumulatedPlainTextNode: IDocPlainTextParameters | undefined = undefined;

    // We always trim leading whitespace for a paragraph.  This flag gets set to true
    // as soon as nonempty content is encountered.
    let finishedSkippingLeadingSpaces: boolean = false;

    for (const node of docParagraph.nodes) {
      switch (node.kind) {
        case DocNodeKind.PlainText:
          const docPlainText: DocPlainText = node as DocPlainText;

          const startedWithSpace: boolean = /^\s/.test(docPlainText.text);
          const endedWithSpace: boolean = /\s$/.test(docPlainText.text);
          const collapsedText: string = docPlainText.text.replace(/\s+/g, ' ').trim();

          if (startedWithSpace && finishedSkippingLeadingSpaces) {
            pendingSpace = true;
          }

          if (collapsedText.length > 0) {
            // If we haven't started an accumulatedPlainTextNode, create it now
            if (!accumulatedPlainTextNode) {
              accumulatedPlainTextNode = {
                excerpt: docPlainText.excerpt,
                text: ''
              };
            }

            if (pendingSpace) {
              accumulatedPlainTextNode.text += ' ';
              pendingSpace = false;
            }

            accumulatedPlainTextNode.text += collapsedText;
            finishedSkippingLeadingSpaces = true;
          }

          if (endedWithSpace && finishedSkippingLeadingSpaces) {
            pendingSpace = true;
          }
          break;
        case DocNodeKind.SoftBreak:
          if (finishedSkippingLeadingSpaces) {
            pendingSpace = true;
          }
          break;
        default:
          if (pendingSpace) {
            if (!accumulatedPlainTextNode) {
              accumulatedPlainTextNode = {
                excerpt: undefined,
                text: ' '
              };
              pendingSpace = false;
            }
          }

          // Push the accumulated text
          if (accumulatedPlainTextNode) {
            transformedNodes.push(new DocPlainText(accumulatedPlainTextNode));
            accumulatedPlainTextNode = undefined;
          }
          transformedNodes.push(node);
          finishedSkippingLeadingSpaces = true;
      }
    }

    // Push the accumulated text
    if (accumulatedPlainTextNode) {
      transformedNodes.push(new DocPlainText(accumulatedPlainTextNode));
    }

    return transformedNodes;
  }
}
