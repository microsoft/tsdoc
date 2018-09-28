import { DocNodeKind, DocNode } from './DocNode';
import { DocInlineTag, IDocInlineTagParameters } from './DocInlineTag';
import { DocParticle } from './DocParticle';
import { Excerpt } from '../parser/Excerpt';

/**
 * Constructor parameters for {@link DocLinkTag}.
 */
export interface IDocLinkTagParameters extends IDocInlineTagParameters {
  urlDestinationExcerpt?: Excerpt;
  urlDestination?: string;

  pipeExcerpt?: Excerpt;

  linkTextExcerpt?: Excerpt;
  linkText?: string;
}

/**
 * Represents an `{@link}` tag.
 */
export class DocLinkTag extends DocInlineTag {

  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.LinkTag;

  private _urlDestinationParticle: DocParticle | undefined;

  private _pipeParticle: DocParticle | undefined;

  private _linkTextParticle: DocParticle | undefined;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocLinkTagParameters) {
    super(parameters);
  }

  /**
   * If the link tag was an ordinary URI, this returns the URL string;
   * otherwise this property is undefined.
   * @remarks
   * Either the `codeDestination` or the `urlDestination` property will be defined, but never both.
   */
  public get urlDestination(): string | undefined {
    return this._urlDestinationParticle ? this._urlDestinationParticle.content : undefined;
  }

  /**
   * An optional text string that is the hyperlink text.  If omitted, the documentation
   * renderer will use a default string based on the link itself (e.g. the URL text
   * or the declaration identifier).
   */
  public get linkText(): string | undefined {
    if (this._linkTextParticle) {
      return this._linkTextParticle.content;
    } else {
      return undefined;
    }
  }

  /** @override */
  public updateParameters(parameters: IDocLinkTagParameters): void {
    if (parameters.tagName.toUpperCase() !== '@LINK') {
      throw new Error('DocLinkTag requires the tag name to be "{@link}"');
    }

    if (parameters.tagContentExcerpt !== undefined) {
      if (parameters.urlDestinationExcerpt || parameters.linkTextExcerpt) {
        // This would violate the TokenCoverageChecker properties
        throw new Error('The input cannot be associated with tagContentExcerpt and also the detail excerpts');
      }
    }

    super.updateParameters(parameters);

    this._urlDestinationParticle = undefined;
    this._pipeParticle = undefined;
    this._linkTextParticle = undefined;

    if (parameters.urlDestination !== undefined) {
      this._urlDestinationParticle = new DocParticle({
        particleId: 'urlDestination',
        excerpt: parameters.urlDestinationExcerpt,
        content: parameters.urlDestination
      });
    }

    if (parameters.linkTextExcerpt || parameters.linkText || parameters.pipeExcerpt) {
      this._pipeParticle = new DocParticle({
        particleId: 'pipe',
        excerpt: parameters.pipeExcerpt,
        content: '|'
      });
    }

    if (parameters.linkText !== undefined) {
      this._linkTextParticle = new DocParticle({
        particleId: 'linkText',
        excerpt: parameters.linkTextExcerpt,
        content: parameters.linkText
      });
    }
  }

  /**
   * {@inheritdoc}
   * @override
   */
  protected getChildNodesForContent(): ReadonlyArray<DocNode> {
    if (this.tagContentParticle.excerpt) {
      // If the parser associated the inline tag input with the tagContentExcerpt (e.g. because
      // second stage parsing encountered an error), then fall back to the base class's representation
      return super.getChildNodes();
    } else {
      // Otherwise return the detailed structure
      return DocNode.trimUndefinedNodes([
        this._urlDestinationParticle,
        this._pipeParticle,
        this._linkTextParticle
      ]);
    }

  }
}
