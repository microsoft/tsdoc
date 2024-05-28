// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { type DocNode, DocExcerpt } from '@microsoft/tsdoc';

/**
 * This is a simplistic solution until we implement proper DocNode rendering APIs.
 */
export class Formatter {
  public static renderDocNode(docNode: DocNode): string {
    let result: string = '';
    if (docNode) {
      if (docNode instanceof DocExcerpt) {
        result += docNode.content.toString();
      }
      for (const childNode of docNode.getChildNodes()) {
        result += Formatter.renderDocNode(childNode);
      }
    }
    return result;
  }

  public static renderDocNodes(docNodes: ReadonlyArray<DocNode>): string {
    let result: string = '';
    for (const docNode of docNodes) {
      result += Formatter.renderDocNode(docNode);
    }
    return result;
  }
}
