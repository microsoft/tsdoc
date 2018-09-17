import {
  DocParagraph,
  DocNode,
  DocNodeKind,
  DocPlainText,
  IDocPlainTextParameters
} from '../nodes';
import { Excerpt } from '../parser/Excerpt';
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
            if (accumulatedPlainTextNode) {
              // If this node can't be merged, then eject it
              if (!TrimSpacesTransform._canMergeExcerpts(accumulatedPlainTextNode.excerpt, docPlainText.excerpt)) {
                transformedNodes.push(new DocPlainText(accumulatedPlainTextNode));
                accumulatedPlainTextNode = undefined;
              }
            }

            // If we haven't started an accumulatedPlainTextNode, create it now
            if (!accumulatedPlainTextNode) {
              accumulatedPlainTextNode = {
                excerpt: undefined,
                text: ''
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

  private static _canMergeExcerpts(currentExcerpt: Excerpt | undefined,
    followingExcerpt: Excerpt | undefined): boolean {

    if (currentExcerpt === undefined || followingExcerpt === undefined) {
      return true;
    }

    if (!currentExcerpt.spacingAfterContent.isEmpty()
      || !followingExcerpt.spacingAfterContent.isEmpty()) {
      return false;
    }

    const currentSequence: TokenSequence = currentExcerpt.content;
    const followingSequence: TokenSequence = followingExcerpt.content;

    if (currentSequence.parserContext !== followingSequence.parserContext) {
      return false;
    }

    return currentSequence.endIndex === followingSequence.startIndex;
  }

  private static _mergeExcerpts(currentExcerpt: Excerpt | undefined,
    followingExcerpt: Excerpt | undefined): Excerpt | undefined {

    if (currentExcerpt === undefined) {
      return followingExcerpt;
    }

    if (followingExcerpt === undefined) {
      return currentExcerpt;
    }

    if (!currentExcerpt.spacingAfterContent.isEmpty()
      || !followingExcerpt.spacingAfterContent.isEmpty()) {
      // This would be a program bug
      throw new Error('mergeExcerpts(): Cannot merge excerpts with spacingAfterContent');
    }

    const currentSequence: TokenSequence = currentExcerpt.content;
    const followingSequence: TokenSequence = followingExcerpt.content;

    if (currentSequence.parserContext !== followingSequence.parserContext) {
      // This would be a program bug
      throw new Error('mergeExcerpts(): Cannot merge excerpts with incompatible parser contexts');
    }

    if (currentSequence.endIndex !== followingSequence.startIndex) {
      // This would be a program bug
      throw new Error('mergeExcerpts(): Cannot merge excerpts that are not adjacent');
    }

    return new Excerpt({
      content: currentSequence.getNewSequence(currentSequence.startIndex,
        followingSequence.endIndex)
    });
  }
}
