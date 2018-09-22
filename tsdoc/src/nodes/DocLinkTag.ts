import { DocNodeKind, DocNode } from './DocNode';
import { DocInlineTag, IDocInlineTagParameters } from './DocInlineTag';
import { DocParticle } from './DocParticle';
import { Excerpt } from '../parser/Excerpt';

/**
 * Constructor parameters for {@link DocLinkTag}.
 */
export interface IDocLinkTagParameters extends IDocInlineTagParameters {
  documentLinkExcerpt?: Excerpt;
  documentLink?: string;

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

  private _documentLinkParticle: DocParticle | undefined;

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
   * Either the `codeLink` or the `documentLink` property will be defined, but never both.
   */
  public get documentLink(): string | undefined {
    return this._documentLinkParticle ? this._documentLinkParticle.content : undefined;
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

    super.updateParameters(parameters);

    this._documentLinkParticle = undefined;

    if (parameters.documentLink !== undefined) {
      this._documentLinkParticle = new DocParticle({
        excerpt: parameters.documentLinkExcerpt,
        content: parameters.documentLink
      });
    }

    this._pipeParticle = new DocParticle({
      excerpt: parameters.pipeExcerpt,
      content: '|'
    });

    if (parameters.linkText !== undefined) {
      this._linkTextParticle = new DocParticle({
        excerpt: parameters.linkTextExcerpt,
        content: parameters.linkText
      });
    }
  }

  /**
   * {@inheritdoc}
   * @override
   */
  public getChildNodes(): ReadonlyArray<DocNode> {
    return DocNode.trimUndefinedNodes([
      this._documentLinkParticle,
      this._pipeParticle,
      this._linkTextParticle
    ]);
  }
}
