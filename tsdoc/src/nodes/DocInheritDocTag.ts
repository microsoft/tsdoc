import { DocNodeKind, DocNode } from './DocNode';
import { DocInlineTag, IDocInlineTagParameters } from './DocInlineTag';
import { DocDeclarationReference } from './DocDeclarationReference';

/**
 * Constructor parameters for {@link DocInheritDocTag}.
 */
export interface IDocInheritDocTagParameters extends IDocInlineTagParameters {
  declarationReference?: DocDeclarationReference;
}

/**
 * Represents an `{@inheritDoc}` tag.
 */
export class DocInheritDocTag extends DocInlineTag {

  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.InheritDocTag;

  private _declarationReference: DocDeclarationReference | undefined;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocInheritDocTagParameters) {
    super(parameters);
  }

  /**
   * The declaration that the documentation will be inherited from.
   * If omitted, the documentation will be inherited from the parent class.
   */
  public get declarationReference(): DocDeclarationReference | undefined {
    return this._declarationReference;
  }

  /** @override */
  public updateParameters(parameters: IDocInheritDocTagParameters): void {
    if (parameters.tagName.toUpperCase() !== '@INHERITDOC') {
      throw new Error('DocInheritDocTag requires the tag name to be "{@inheritDoc}"');
    }

    super.updateParameters(parameters);

    this._declarationReference = parameters.declarationReference;
  }

  /**
   * {@inheritdoc}
   * @override
   */
  protected getChildNodesForContent(): ReadonlyArray<DocNode> {
    if (this.tagContentParticle.excerpt) {
      // If the parser associated the inline tag input with the tagContentExcerpt (e.g. because
      // second stage parsing encountered an error), then fall back to the base class's representation
      return super.getChildNodesForContent();
    } else {
      // Otherwise return the detailed structure
      return DocNode.trimUndefinedNodes([
        this._declarationReference
      ]);
    }
  }
}
