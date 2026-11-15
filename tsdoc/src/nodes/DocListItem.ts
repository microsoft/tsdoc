// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { DocNode, DocNodeKind, type IDocNodeParameters } from './DocNode';
import { DocSection } from './DocSection';
import { DocExcerpt, ExcerptKind } from './DocExcerpt';
import type { TokenSequence } from '../parser/TokenSequence';

/** Constructor parameters for {@link DocListItem}. */
export interface IDocListItemParameters extends IDocNodeParameters {}

/** A list item with a rich-text body that can contain nested lists. */
export class DocListItem extends DocNode {
  public readonly content: DocSection;
  private readonly _prefixes: DocExcerpt[] = [];

  public constructor(parameters: IDocListItemParameters, childNodes?: ReadonlyArray<DocNode>) {
    super(parameters);
    this.content = new DocSection({ configuration: this.configuration }, childNodes);
  }

  /** @override */
  public get kind(): DocNodeKind {
    return DocNodeKind.ListItem;
  }

  /** Retains structural syntax without treating it as item text. @internal */
  public addPrefixExcerpt(sequence: TokenSequence): void {
    this._prefixes.push(
      new DocExcerpt({
        configuration: this.configuration,
        excerptKind: ExcerptKind.ListItem_Prefix,
        content: sequence
      })
    );
  }

  /** @override */
  protected onGetChildNodes(): ReadonlyArray<DocNode> {
    return [...this._prefixes, this.content];
  }
}
