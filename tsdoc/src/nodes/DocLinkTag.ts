import { DocNodeKind, DocNode } from './DocNode';
import { DocInlineTag, IDocInlineTagParameters } from './DocInlineTag';
import { DocDeclarationReference } from './DocDeclarationReference';
import { DocParticle } from './DocParticle';
import { Excerpt } from '../parser/Excerpt';

/**
 * Constructor parameters for {@link DocLinkTag}.
 */
export interface IDocLinkTagParameters extends IDocInlineTagParameters {
  codeLink?: DocDeclarationReference;

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

  private readonly _codeLink: DocDeclarationReference | undefined;

  private readonly _documentLink: DocParticle | undefined;

  private readonly _pipeParticle: DocParticle | undefined;

  private readonly _linkTextParticle: DocParticle | undefined;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocLinkTagParameters) {
    super(parameters);

    this._codeLink = undefined;
    this._documentLink = undefined;

    if (parameters.codeLink) {
      if (parameters.documentLink !== undefined) {
        throw new Error('Either the codeLink or the documentLink may be specified, but not both');
      }
      this._codeLink = parameters.codeLink;
    } else if (parameters.documentLink !== undefined) {
      this._documentLink = new DocParticle({
        excerpt: parameters.documentLinkExcerpt,
        content: parameters.documentLink
      });
    }

    this._pipeParticle = new DocParticle({
      excerpt: parameters.pipeExcerpt,
      content: ':'
    });

    if (parameters.linkText !== undefined) {
      this._linkTextParticle = new DocParticle({
        excerpt: parameters.linkTextExcerpt,
        content: parameters.linkText
      });
    }
  }

  /**
   * If the link tag refers to a declaration, this returns the declaration reference object;
   * otherwise this property is undefined.
   * @remarks
   * Either the `codeLink` or the `documentLink` property will be defined, but never both.
   */
  public get codeLink(): DocDeclarationReference | undefined {
    return this._codeLink;
  }

  /**
   * If the link tag was an ordinary URI, this returns the URI string;
   * otherwise this property is undefined.
   * @remarks
   * Either the `codeLink` or the `documentLink` property will be defined, but never both.
   */
  public get documentLink(): DocParticle | undefined {
    return this._documentLink;
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

  /**
   * {@inheritdoc}
   * @override
   */
  public getChildNodes(): ReadonlyArray<DocNode> {
    return DocNode.trimUndefinedNodes([
      this._codeLink,
      this._documentLink,
      this._pipeParticle,
      this._linkTextParticle
    ]);
  }
}
