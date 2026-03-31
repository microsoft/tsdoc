// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { DocNode, type IDocNodeParameters } from './DocNode';
import { DocNodeContainer, type IDocNodeContainerParameters } from './DocNodeContainer';
import { DocNodeKind } from './DocNodeKind';

/**
 * Constructor parameters for {@link DocHeading}.
 */
export interface IDocHeadingParameters extends IDocNodeContainerParameters {
  /**
   * The heading level from 1 to 6, similar to Markdown headings.
   */
  headingLevel?: number;
}

/**
 * Represents a heading section in the documentation, similar to Markdown headings (#, ##, etc.).
 *
 * @remarks
 * This node type stores a heading level (1-6) and contains the heading content as child nodes.
 */
export class DocHeading extends DocNodeContainer {
  private static _kind: string = DocNodeKind.Heading;
  private _headingLevel: number;

  public constructor(parameters: IDocHeadingParameters | DocHeading) {
    super(parameters);
    if (parameters instanceof DocHeading) {
      this._headingLevel = parameters._headingLevel;
    } else {
      this._headingLevel = parameters.headingLevel ?? 1;
    }
  }

  /** @override */
  public get kind(): string {
    return DocHeading._kind;
  }

  /**
   * The heading level from 1 to 6.
   */
  public get headingLevel(): number {
    return this._headingLevel;
  }

  /**
   * Sets the heading level (must be between 1 and 6).
   */
  public set headingLevel(value: number) {
    if (value < 1 || value > 6) {
      throw new Error('Heading level must be between 1 and 6');
    }
    this._headingLevel = value;
  }

  /** @override */
  protected onGetChildNodes(): ReadonlyArray<DocNode> {
    return this.nodes;
  }
}
