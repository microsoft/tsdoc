import { DocNodeKind, DocNode } from './DocNode';
import { DocNodeLeaf, IDocNodeLeafParameters } from './DocNodeLeaf';
import { DocDeclarationReference } from './DocDeclarationReference';
import { DocParticle } from './DocParticle';
import { Excerpt } from '../parser/Excerpt';

/**
 * Constructor parameters for {@link DocMemberSymbol}.
 */
export interface IDocMemberSymbolParameters extends IDocNodeLeafParameters {
  leftBracketExcerpt?: Excerpt;

  symbolReference: DocDeclarationReference | undefined;

  rightBracketExcerpt?: Excerpt;
}

/**
 * Represents a reference to an ECMAScript 6 symbol that is used
 * to identify a member declaration.
 *
 * @example
 *
 * In the declaration reference `{@link MyClass.([MySymbols.example]:instance)}`,
 * the member symbol `[MySymbols.example]` might be used to reference a property
 * of the class.
 */
export class DocMemberSymbol extends DocNodeLeaf {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.MemberSymbol;

  private _leftBracketParticle: DocParticle | undefined;          // never undefined after updateParameters()

  private _symbolReference: DocDeclarationReference | undefined;  // never undefined after updateParameters()

  private _rightBracketParticle: DocParticle | undefined;         // never undefined after updateParameters()

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocMemberSymbolParameters) {
    super(parameters);
  }

  /**
   * The declaration reference for the ECMAScript 6 symbol that will act as
   * the identifier for the member.
   */
  public get symbolReference(): DocDeclarationReference {
    return this._symbolReference!;
  }

  /** @override */
  public updateParameters(parameters: IDocMemberSymbolParameters): void {
    super.updateParameters(parameters);

    this._leftBracketParticle = new DocParticle({
      particleId: 'leftBracket',
      excerpt: parameters.leftBracketExcerpt,
      content: '['
    });

    this._symbolReference = parameters.symbolReference;

    this._rightBracketParticle = new DocParticle({
      particleId: 'rightBracket',
      excerpt: parameters.leftBracketExcerpt,
      content: ']'
    });
  }

  /**
   * {@inheritdoc}
   * @override
   */
  public getChildNodes(): ReadonlyArray<DocNode> {
    return [
      this._leftBracketParticle!,
      this._symbolReference!,
      this._rightBracketParticle!
    ];
  }
}
