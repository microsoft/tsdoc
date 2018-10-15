import {
  DocParagraph,
  DocNode,
  DocNodeKind,
  DocPlainText,
  IDocPlainTextParsedParameters
} from '../nodes';
import { TokenSequence } from '../parser/TokenSequence';

/**
 * Implementation of DocNodeTransforms.trimSpacesInParagraphNodes()
 */
export class TrimSpacesTransform {
  public static transform(docParagraph: DocParagraph): DocParagraph {
    const transformedNodes: DocNode[] = [];

    // Whether the next nonempty node to be added needs a space before it
    let pendingSpace: boolean = false;

    // The DocPlainText node that we're currently accumulating
    let accumulatedPlainTextNode: IDocPlainTextParsedParameters | undefined = undefined;

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
            if (accumulatedPlainTextNode) {
              // If this node can't be merged, then eject it
              if (!TrimSpacesTransform._canMergeExcerpts(
                accumulatedPlainTextNode.textExcerpt, docPlainText.textExcerpt)) {

                transformedNodes.push(new DocPlainText(accumulatedPlainTextNode));
                accumulatedPlainTextNode = undefined;
              }
            }

            // If we haven't started an accumulatedPlainTextNode, create it now
            if (!accumulatedPlainTextNode) {
              accumulatedPlainTextNode = {
                parsed: true,
                textExcerpt: undefined!
              };
            }

            if (pendingSpace) {
              accumulatedPlainTextNode.text += ' ';
              pendingSpace = false;
            }

            accumulatedPlainTextNode.text += collapsedText;
            accumulatedPlainTextNode.excerpt = TrimSpacesTransform._mergeExcerpts(
              accumulatedPlainTextNode.excerpt, docPlainText.excerpt);

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
            // If we haven't started an accumulatedPlainTextNode, create it now
            if (!accumulatedPlainTextNode) {
              accumulatedPlainTextNode = {
                excerpt: undefined,
                text: ''
              };
            }

            accumulatedPlainTextNode.text += ' ';
            pendingSpace = false;
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
      accumulatedPlainTextNode = undefined;
    }

    const transformedParagraph: DocParagraph = new DocParagraph({ });
    transformedParagraph.appendNodes(transformedNodes);
    return transformedParagraph;
  }

  private static _canMergeExcerpts(currentExcerpt: TokenSequence | undefined,
    followingExcerpt: TokenSequence | undefined): boolean {

    if (currentExcerpt === undefined || followingExcerpt === undefined) {
      return true;
    }

    if (currentExcerpt.parserContext !== currentExcerpt.parserContext) {
      return false;
    }

    return currentExcerpt.endIndex === currentExcerpt.startIndex;
  }

  private static _mergeExcerpts(currentExcerpt: TokenSequence | undefined,
    followingExcerpt: TokenSequence | undefined): TokenSequence | undefined {

    if (currentExcerpt === undefined) {
      return followingExcerpt;
    }

    if (followingExcerpt === undefined) {
      return currentExcerpt;
    }

    if (currentExcerpt.parserContext !== followingExcerpt.parserContext) {
      // This would be a program bug
      throw new Error('mergeExcerpts(): Cannot merge excerpts with incompatible parser contexts');
    }

    if (currentExcerpt.endIndex !== followingExcerpt.startIndex) {
      // This would be a program bug
      throw new Error('mergeExcerpts(): Cannot merge excerpts that are not adjacent');
    }

    return currentExcerpt.getNewSequence(currentExcerpt.startIndex, followingExcerpt.endIndex);
  }
}
