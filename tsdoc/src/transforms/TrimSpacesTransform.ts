// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { DocParagraph, type DocNode, DocNodeKind, DocPlainText, DocSoftBreak } from '../nodes';

/**
 * Implementation of DocNodeTransforms.trimSpacesInParagraphNodes()
 */
export class TrimSpacesTransform {
  public static transform(docParagraph: DocParagraph): DocParagraph {
    const transformedNodes: DocNode[] = [];

    // Whether the next nonempty node to be added needs a space before it
    let pendingSpace: boolean = false;

    // The DocPlainText node that we're currently accumulating
    const accumulatedTextChunks: string[] = [];
    const accumulatedNodes: DocNode[] = [];

    // We always trim leading whitespace for a paragraph.  This flag gets set to true
    // as soon as nonempty content is encountered.
    let finishedSkippingLeadingSpaces: boolean = false;

    function pushAccumulatedText(): void {
      const lines: string[] = accumulatedTextChunks.join('').split('\n');
      for (let i: number = 0; i < lines.length; i++) {
        const line: string = lines[i];
        if (line.length !== 0) {
          if (i !== 0) {
            transformedNodes.push(
              new DocSoftBreak({
                configuration: docParagraph.configuration
              })
            );
          }
          transformedNodes.push(
            new DocPlainText({
              configuration: docParagraph.configuration,
              text: line
            })
          );
        }
      }
      accumulatedTextChunks.length = 0;
      accumulatedNodes.length = 0;
    }

    for (const node of docParagraph.nodes) {
      switch (node.kind) {
        case DocNodeKind.PlainText:
          const docPlainText: DocPlainText = node as DocPlainText;

          const text: string = docPlainText.text;

          const startedWithSpace: boolean = /^\s/.test(text);
          const endedWithSpace: boolean = /\s$/.test(text);
          const collapsedText: string = text.replace(/\s+/g, ' ').trim();

          if (startedWithSpace && finishedSkippingLeadingSpaces) {
            pendingSpace = true;
          }

          if (collapsedText.length > 0) {
            if (pendingSpace) {
              accumulatedTextChunks.push(' ');
              pendingSpace = false;
            }

            accumulatedTextChunks.push(collapsedText);
            accumulatedNodes.push(node);

            finishedSkippingLeadingSpaces = true;
          }

          if (endedWithSpace && finishedSkippingLeadingSpaces) {
            pendingSpace = true;
          }
          break;
        case DocNodeKind.SoftBreak:
          accumulatedTextChunks.push('\n');
          accumulatedNodes.push(node);
          break;
        default:
          if (pendingSpace) {
            accumulatedTextChunks.push(' ');
            pendingSpace = false;
          }

          // Push the accumulated text
          if (accumulatedTextChunks.length > 0) {
            // TODO: We should probably track the accumulatedNodes somehow, e.g. so we can map them back to the
            // original excerpts.  But we need a developer scenario before we can design this API.
            pushAccumulatedText();
          }

          transformedNodes.push(node);
          finishedSkippingLeadingSpaces = true;
      }
    }

    // Push the accumulated text
    if (accumulatedTextChunks.length > 0) {
      pushAccumulatedText();
    }

    const transformedParagraph: DocParagraph = new DocParagraph({
      configuration: docParagraph.configuration
    });
    transformedParagraph.appendNodes(transformedNodes);
    return transformedParagraph;
  }
}
