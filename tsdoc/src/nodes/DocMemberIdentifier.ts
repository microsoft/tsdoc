import { DocNodeKind, DocNode, IDocNodeParameters, IDocNodeParsedParameters } from './DocNode';
import { StringChecks } from '../parser/StringChecks';
import { TokenSequence } from '../parser/TokenSequence';
import { DocExcerpt, ExcerptKind } from './DocExcerpt';

/**
 * Constructor parameters for {@link DocMemberIdentifier}.
 */
export interface IDocMemberIdentifierParameters extends IDocNodeParameters {
  identifier: string;
}

/**
 * Constructor parameters for {@link DocMemberIdentifier}.
 */
export interface IDocMemberIdentifierParsedParameters extends IDocNodeParsedParameters {
  leftQuoteExcerpt?: TokenSequence;

  identifierExcerpt: TokenSequence;

  rightQuoteExcerpt?: TokenSequence;
}

/**
 * A member identifier is part of a {@link DocMemberReference}.
 */
export class DocMemberIdentifier extends DocNode {
  /** {@inheritDoc} */
  public readonly kind: DocNodeKind = DocNodeKind.MemberIdentifier;

  private readonly _leftQuoteExcerpt: DocExcerpt | undefined;

  private _identifier: string | undefined;
  private readonly _identifierExcerpt: DocExcerpt | undefined;

  private readonly _rightQuoteExcerpt: DocExcerpt | undefined;

  /**
   * Returns true if the specified string is a valid TypeScript
   * identifier.  If not, {@link DocMemberIdentifier.hasQuotes} will be
   * required.
   */
  public static isValidIdentifier(identifier: string): boolean {
    return !StringChecks.explainIfInvalidUnquotedIdentifier(identifier);
  }

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocMemberIdentifierParameters | IDocMemberIdentifierParsedParameters) {
    super(parameters);

    if (DocNode.isParsedParameters(parameters)) {
      if (parameters.leftQuoteExcerpt) {
        this._leftQuoteExcerpt = new DocExcerpt({
          configuration: this.configuration,
          excerptKind: ExcerptKind.MemberIdentifier_LeftQuote,
          content: parameters.leftQuoteExcerpt
        });
      }

      this._identifierExcerpt = new DocExcerpt({
        configuration: this.configuration,
        excerptKind: ExcerptKind.MemberIdentifier_Identifier,
        content: parameters.identifierExcerpt
      });

      if (parameters.rightQuoteExcerpt) {
        this._rightQuoteExcerpt = new DocExcerpt({
          configuration: this.configuration,
          excerptKind: ExcerptKind.MemberIdentifier_RightQuote,
          content: parameters.rightQuoteExcerpt
        });
      }
    } else {
      this._identifier = parameters.identifier;
    }
  }

  /**
   * The identifier string without any quote encoding.
   *
   * @remarks
   * If the value is not a valid ECMAScript identifier, it will be quoted as a
   * string literal during rendering.
   */
  public get identifier(): string {
    if (this._identifier === undefined) {
      this._identifier = this._identifierExcerpt!.content.toString();
    }
    return this._identifier;
  }

  /**
   * Returns true if the identifier will be rendered as a quoted string literal
   * instead of as a programming language identifier.  This is required if the
   * `identifier` property is not a valid ECMAScript identifier.
   */
  public get hasQuotes(): boolean {
    if (this._identifierExcerpt) {
      return !!this._leftQuoteExcerpt;
    } else {
      return !DocMemberIdentifier.isValidIdentifier(this.identifier);
    }
  }

  /** @override */
  protected onGetChildNodes(): ReadonlyArray<DocNode | undefined> {
    return [
      this._leftQuoteExcerpt,
      this._identifierExcerpt,
      this._rightQuoteExcerpt
    ];
  }
}
