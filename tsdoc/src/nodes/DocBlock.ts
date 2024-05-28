// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { DocNodeKind, DocNode, type IDocNodeParameters, type IDocNodeParsedParameters } from './DocNode';
import { DocSection } from './DocSection';
import type { DocBlockTag } from './DocBlockTag';

/**
 * Constructor parameters for {@link DocBlock}.
 */
export interface IDocBlockParameters extends IDocNodeParameters {
  blockTag: DocBlockTag;
}

/**
 * Constructor parameters for {@link DocBlock}.
 */
export interface IDocBlockParsedParameters extends IDocNodeParsedParameters {
  blockTag: DocBlockTag;
}

/**
 * Represents a section that is introduced by a TSDoc block tag.
 * For example, an `@example` block.
 */
export class DocBlock extends DocNode {
  private readonly _blockTag: DocBlockTag;
  private readonly _content: DocSection;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocBlockParameters | IDocBlockParsedParameters) {
    super(parameters);
    this._blockTag = parameters.blockTag;
    this._content = new DocSection({ configuration: this.configuration });
  }

  /** @override */
  public get kind(): DocNodeKind | string {
    return DocNodeKind.Block;
  }

  /**
   * The TSDoc tag that introduces this section.
   */
  public get blockTag(): DocBlockTag {
    return this._blockTag;
  }

  /**
   * The TSDoc tag that introduces this section.
   */
  public get content(): DocSection {
    return this._content;
  }

  /** @override */
  protected onGetChildNodes(): ReadonlyArray<DocNode | undefined> {
    return [this.blockTag, this._content];
  }
}
