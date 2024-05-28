// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { DocNode, DocNodeKind, type IDocNodeParameters, type IDocNodeParsedParameters } from './DocNode';
import type { TokenSequence } from '../parser/TokenSequence';
import { DocExcerpt, ExcerptKind } from './DocExcerpt';
import { StringBuilder } from '../emitters/StringBuilder';
import { TSDocEmitter } from '../emitters/TSDocEmitter';

/**
 * Constructor parameters for {@link DocHtmlEndTag}.
 */
export interface IDocHtmlEndTagParameters extends IDocNodeParameters {
  name: string;
}

/**
 * Constructor parameters for {@link DocHtmlEndTag}.
 */
export interface IDocHtmlEndTagParsedParameters extends IDocNodeParsedParameters {
  openingDelimiterExcerpt: TokenSequence;

  nameExcerpt: TokenSequence;
  spacingAfterNameExcerpt?: TokenSequence;

  closingDelimiterExcerpt: TokenSequence;
}

/**
 * Represents an HTML end tag.  Example: `</a>`
 */
export class DocHtmlEndTag extends DocNode {
  // The "</" delimiter and padding
  private readonly _openingDelimiterExcerpt: DocExcerpt | undefined;

  // The element name
  private _name: string | undefined;
  private readonly _nameExcerpt: DocExcerpt | undefined;
  private readonly _spacingAfterNameExcerpt: DocExcerpt | undefined;

  // The  ">" delimiter and padding
  private readonly _closingDelimiterExcerpt: DocExcerpt | undefined;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocHtmlEndTagParameters | IDocHtmlEndTagParsedParameters) {
    super(parameters);

    if (DocNode.isParsedParameters(parameters)) {
      this._openingDelimiterExcerpt = new DocExcerpt({
        configuration: this.configuration,
        excerptKind: ExcerptKind.HtmlEndTag_OpeningDelimiter,
        content: parameters.openingDelimiterExcerpt
      });
      this._nameExcerpt = new DocExcerpt({
        configuration: this.configuration,
        excerptKind: ExcerptKind.HtmlEndTag_Name,
        content: parameters.nameExcerpt
      });

      if (parameters.spacingAfterNameExcerpt) {
        this._spacingAfterNameExcerpt = new DocExcerpt({
          configuration: this.configuration,
          excerptKind: ExcerptKind.Spacing,
          content: parameters.spacingAfterNameExcerpt
        });
      }

      this._closingDelimiterExcerpt = new DocExcerpt({
        configuration: this.configuration,
        excerptKind: ExcerptKind.HtmlEndTag_ClosingDelimiter,
        content: parameters.closingDelimiterExcerpt
      });
    } else {
      this._name = parameters.name;
    }
  }

  /** @override */
  public get kind(): DocNodeKind | string {
    return DocNodeKind.HtmlEndTag;
  }

  /**
   * The HTML element name.
   */
  public get name(): string {
    if (this._name === undefined) {
      this._name = this._nameExcerpt!.content.toString();
    }
    return this._name;
  }

  /**
   * Generates the HTML for this tag.
   */
  public emitAsHtml(): string {
    // NOTE: Here we're assuming that the TSDoc representation for a tag is also a valid HTML expression.
    const stringBuilder: StringBuilder = new StringBuilder();
    const emitter: TSDocEmitter = new TSDocEmitter();
    emitter.renderHtmlTag(stringBuilder, this);
    return stringBuilder.toString();
  }

  /** @override */
  protected onGetChildNodes(): ReadonlyArray<DocNode | undefined> {
    return [
      this._openingDelimiterExcerpt,
      this._nameExcerpt,
      this._spacingAfterNameExcerpt,
      this._closingDelimiterExcerpt
    ];
  }
}
