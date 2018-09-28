import { DocNodeKind, DocNode } from './DocNode';
import { DocNodeLeaf, IDocNodeLeafParameters } from './DocNodeLeaf';
import { Excerpt } from '../parser/Excerpt';
import { DocParticle } from './DocParticle';
import { StringChecks } from '../parser/StringChecks';

/**
 * Constructor parameters for {@link DocMemberIdentifier}.
 */
export interface IDocMemberIdentifierParameters extends IDocNodeLeafParameters {
  leftQuoteExcerpt?: Excerpt | undefined;

  identifierExcerpt?: Excerpt | undefined;
  identifier: string;

  rightQuoteExcerpt?: Excerpt | undefined;
}

/**
 * A member identifier is part of a {@link DocMemberReference}.
 */
export class DocMemberIdentifier extends DocNodeLeaf {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.MemberIdentifier;

  private _leftQuoteParticle: DocParticle | undefined;

  private _identifierParticle: DocParticle | undefined;

  private _rightQuoteParticle: DocParticle | undefined;

  /**
   * Returns true if the specified string is a valid TypeScript
   * identifier.  If not, {@link DocMemberIdentifier.hasQuotes} will be
   * required.
   */
  public static isValidIdentifier(identifier: string): boolean {
    return !StringChecks.explainIfInvalidEcmaScriptIdentifier(identifier);
  }

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocMemberIdentifierParameters) {
    super(parameters);
  }

  /**
   * The identifier string without any quote encoding.
   *
   * @remarks
   * If the value is not a valid ECMAScript identifier, it will be quoted as a
   * string literal during rendering.
   */
  public get identifier(): string {
    return this._identifierParticle!.content;
  }

  /**
   * Returns true if the identifier will be rendered as a quoted string literal
   * instead of as a programming language identifier.  This is required if the
   * `identifier` property is not a valid ECMAScript identifier.
   */
  public get hasQuotes(): boolean {
    return !!this._leftQuoteParticle;
  }

  /** @override */
  public updateParameters(parameters: IDocMemberIdentifierParameters): void {
    super.updateParameters(parameters);

    this._leftQuoteParticle = undefined;
    this._identifierParticle = undefined;
    this._rightQuoteParticle = undefined;

    if (parameters.leftQuoteExcerpt || !DocMemberIdentifier.isValidIdentifier(parameters.identifier)) {
      this._leftQuoteParticle = new DocParticle({
        particleId: 'leftQuote',
        excerpt: parameters.leftQuoteExcerpt,
        content: '"'
      });
    }

    this._identifierParticle = new DocParticle({
      particleId: 'identifier',
      excerpt: parameters.identifierExcerpt,
      content: parameters.identifier
    });

    if (this._leftQuoteParticle) {
      this._rightQuoteParticle = new DocParticle({
        particleId: 'rightQuote',
        excerpt: parameters.rightQuoteExcerpt,
        content: '"'
      });
    }
  }

  /**
   * {@inheritdoc}
   * @override
   */
  public getChildNodes(): ReadonlyArray<DocNode> {
    return DocNode.trimUndefinedNodes([
      this._leftQuoteParticle,
      this._identifierParticle,
      this._rightQuoteParticle
    ]);
  }
}
