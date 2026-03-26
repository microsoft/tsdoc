// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { DocNodeKind } from './DocNode';
import { type IDocNodeContainerParameters, DocNodeContainer } from './DocNodeContainer';

export type DocHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface IDocHeadingParameters extends IDocNodeContainerParameters {
  headingLevel: DocHeadingLevel;
}

export class DocHeading extends DocNodeContainer {
  private readonly _headingLevel: DocHeadingLevel;

  public constructor(parameters: IDocHeadingParameters) {
    super(parameters);

    if (!Number.isInteger(parameters.headingLevel) || parameters.headingLevel < 1 || parameters.headingLevel > 6) {
      throw new Error('The headingLevel must be an integer between 1 and 6');
    }

    this._headingLevel = parameters.headingLevel;
  }

  public get kind(): DocNodeKind.Heading {
    return DocNodeKind.Heading;
  }

  public get headingLevel(): DocHeadingLevel {
    return this._headingLevel;
  }
}
