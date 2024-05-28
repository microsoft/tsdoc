// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { DocNodeKind, type DocNode } from './DocNode';
import { DocNodeContainer, type IDocNodeContainerParameters } from './DocNodeContainer';

/**
 * Constructor parameters for {@link DocParagraph}.
 */
export interface IDocParagraphParameters extends IDocNodeContainerParameters {}

/**
 * Represents a paragraph of text, similar to a `<p>` element in HTML.
 * Like CommonMark, the TSDoc syntax uses blank lines to delineate paragraphs
 * instead of explicitly notating them.
 */
export class DocParagraph extends DocNodeContainer {
  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocParagraphParameters, childNodes?: ReadonlyArray<DocNode>) {
    super(parameters, childNodes);
  }

  /** @override */
  public get kind(): DocNodeKind | string {
    return DocNodeKind.Paragraph;
  }
}
