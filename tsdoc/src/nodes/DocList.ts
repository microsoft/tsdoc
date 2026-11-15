// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { DocNodeKind, type DocNode } from './DocNode';
import { DocNodeContainer, type IDocNodeContainerParameters } from './DocNodeContainer';

/** Constructor parameters for {@link DocList}. */
export interface IDocListParameters extends IDocNodeContainerParameters {
  ordered: boolean;
  start?: number;
}

/** A sequence of documentation list items. */
export class DocList extends DocNodeContainer {
  public readonly ordered: boolean;
  public readonly start: number;

  public constructor(parameters: IDocListParameters, childNodes?: ReadonlyArray<DocNode>) {
    super(parameters, childNodes);
    this.ordered = parameters.ordered;
    this.start = parameters.start === undefined ? 1 : parameters.start;
    if (!Number.isInteger(this.start) || this.start < 0 || this.start > 999999999) {
      throw new Error('The list start must be an integer from 0 through 999999999');
    }
  }

  /** @override */
  public get kind(): DocNodeKind {
    return DocNodeKind.List;
  }
}
