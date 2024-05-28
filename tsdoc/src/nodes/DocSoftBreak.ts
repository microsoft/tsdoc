// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { DocNodeKind, type IDocNodeParameters, DocNode, type IDocNodeParsedParameters } from './DocNode';
import type { TokenSequence } from '../parser/TokenSequence';
import { DocExcerpt, ExcerptKind } from './DocExcerpt';

/**
 * Constructor parameters for {@link DocSoftBreak}.
 */
export interface IDocSoftBreakParameters extends IDocNodeParameters {}

/**
 * Constructor parameters for {@link DocSoftBreak}.
 */
export interface IDocSoftBreakParsedParameters extends IDocNodeParsedParameters {
  softBreakExcerpt: TokenSequence;
}

/**
 * Instructs a renderer to insert an explicit newline in the output.
 * (Normally the renderer uses a formatting rule to determine where
 * lines should wrap.)
 *
 * @remarks
 * In HTML, a soft break is represented as an ASCII newline character (which does not
 * affect the web browser's view), whereas the hard break is the `<br />` element
 * (which starts a new line in the web browser's view).
 *
 * TSDoc follows the same conventions, except the renderer avoids emitting
 * two empty lines (because that could start a new CommonMark paragraph).
 */
export class DocSoftBreak extends DocNode {
  private readonly _softBreakExcerpt: DocExcerpt | undefined;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocSoftBreakParameters | IDocSoftBreakParsedParameters) {
    super(parameters);

    if (DocNode.isParsedParameters(parameters)) {
      // The type is IDocNodeParsedParameters, which is a base of IDocSoftBreakParsedParameters
      // but not a base of IDocSoftBreakParameters. Therefore the type must be IDocSoftBreakParsedParameters.
      // TypeScript 4 could infer this, but for some reason TypeScript 5 cannot.
      const parsedParameters: IDocSoftBreakParsedParameters = parameters as IDocSoftBreakParsedParameters;
      this._softBreakExcerpt = new DocExcerpt({
        configuration: this.configuration,
        excerptKind: ExcerptKind.SoftBreak,
        content: parsedParameters.softBreakExcerpt
      });
    }
  }

  /** @override */
  public get kind(): DocNodeKind | string {
    return DocNodeKind.SoftBreak;
  }

  /** @override */
  protected onGetChildNodes(): ReadonlyArray<DocNode | undefined> {
    return [this._softBreakExcerpt];
  }
}
