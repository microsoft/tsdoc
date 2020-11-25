import { DocNodeKind, DocNode } from './DocNode';
import { DocDeclarationReference } from './DocDeclarationReference';
import {
  DocInlineTagBase,
  IDocInlineTagBaseParsedParameters,
  IDocInlineTagBaseParameters
} from './DocInlineTagBase';

/**
 * Constructor parameters for {@link DocInheritDocTag}.
 */
export interface IDocInheritDocTagParameters extends IDocInlineTagBaseParameters {
  declarationReference?: DocDeclarationReference;
}

/**
 * Constructor parameters for {@link DocInheritDocTag}.
 */
export interface IDocInheritDocTagParsedParameters extends IDocInlineTagBaseParsedParameters {
  declarationReference?: DocDeclarationReference;
}

/**
 * Represents an `{@inheritDoc}` tag.
 */
export class DocInheritDocTag extends DocInlineTagBase {
  private readonly _declarationReference: DocDeclarationReference | undefined;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocInheritDocTagParameters | IDocInheritDocTagParsedParameters) {
    super(parameters);

    if (this.tagNameWithUpperCase !== '@INHERITDOC') {
      throw new Error('DocInheritDocTag requires the tag name to be "{@inheritDoc}"');
    }

    this._declarationReference = parameters.declarationReference;
  }

  /** @override */
  public get kind(): DocNodeKind | string {
    return DocNodeKind.InheritDocTag;
  }

  /**
   * The declaration that the documentation will be inherited from.
   * If omitted, the documentation will be inherited from the parent class.
   */
  public get declarationReference(): DocDeclarationReference | undefined {
    return this._declarationReference;
  }

  /** @override */
  protected getChildNodesForContent(): ReadonlyArray<DocNode | undefined> {
    // abstract
    return [this._declarationReference];
  }
}
