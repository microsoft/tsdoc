// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { DocNodeKind, DocNode } from './DocNode';
import { DocBlock, type IDocBlockParameters, type IDocBlockParsedParameters } from './DocBlock';
import type { TokenSequence } from '../parser/TokenSequence';
import { DocExcerpt, ExcerptKind } from './DocExcerpt';

/**
 * Constructor parameters for {@link DocExampleBlock}.
 */
export interface IDocExampleBlockParameters extends IDocBlockParameters {
  /**
   * The title for the example, i.e. the text that appears on the same line as the `@example` tag.
   * If omitted, the example has no title.
   */
  readonly title?: string;
}

/**
 * Constructor parameters for {@link DocExampleBlock}.
 */
export interface IDocExampleBlockParsedParameters extends IDocBlockParsedParameters {
  /**
   * The whitespace that separates the `@example` tag from the title text on the same line.
   */
  readonly spacingAfterTagExcerpt?: TokenSequence;

  /**
   * The parsed token sequence for the title text that appears on the same line as the `@example` tag,
   * or undefined if the block has no title.
   */
  readonly titleExcerpt?: TokenSequence;

  /**
   * The title for the example, i.e. the text that appears on the same line as the `@example` tag.
   * This is an empty string if the block has no title.
   */
  readonly title: string;
}

/**
 * Represents a parsed `@example` block, which provides an example illustrating how to use an API.
 *
 * @remarks
 * Any text that appears on the same line as the `@example` tag is interpreted as a title for the
 * example.  The remaining content of the block (for example a code sample) is stored in the
 * {@link DocBlock.content} section.
 */
export class DocExampleBlock extends DocBlock {
  private readonly _spacingAfterTagExcerpt: DocExcerpt | undefined;

  private readonly _title: string;
  private readonly _titleExcerpt: DocExcerpt | undefined;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocExampleBlockParameters | IDocExampleBlockParsedParameters) {
    super(parameters);

    this._title = parameters.title ?? '';

    if (DocNode.isParsedParameters(parameters)) {
      if (parameters.spacingAfterTagExcerpt) {
        this._spacingAfterTagExcerpt = new DocExcerpt({
          configuration: this.configuration,
          excerptKind: ExcerptKind.Spacing,
          content: parameters.spacingAfterTagExcerpt
        });
      }

      if (parameters.titleExcerpt) {
        this._titleExcerpt = new DocExcerpt({
          configuration: this.configuration,
          excerptKind: ExcerptKind.ExampleBlock_Title,
          content: parameters.titleExcerpt
        });
      }
    }
  }

  /** @override */
  public get kind(): DocNodeKind | string {
    return DocNodeKind.ExampleBlock;
  }

  /**
   * The title for the example, which is the text that appears on the same line as the `@example` tag.
   *
   * @remarks
   * If no title was specified, then this returns an empty string.  A documentation tool may in that case
   * index the examples numerically instead.
   */
  public get title(): string {
    return this._title;
  }

  /** @override */
  protected onGetChildNodes(): ReadonlyArray<DocNode | undefined> {
    return [this.blockTag, this._spacingAfterTagExcerpt, this._titleExcerpt, this.content];
  }
}
