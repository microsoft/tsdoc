import { DocNode, DocNodeKind, IDocNodeParameters } from './DocNode';
import { DocParticle } from './DocParticle';
import { Excerpt } from '../parser/Excerpt';
import { DocMemberIdentifier } from './DocMemberIdentifier';
import { DocMemberSymbol } from './DocMemberSymbol';
import { DocMemberSelector } from './DocMemberSelector';

/**
 * Constructor parameters for {@link DocMemberReference}.
 */
export interface IDocMemberReferenceParameters extends IDocNodeParameters {
  hasDot: boolean;
  dotExcerpt?: Excerpt;
  leftParenthesisExcerpt?: Excerpt;

  memberIdentifier?: DocMemberIdentifier;
  memberSymbol?: DocMemberSymbol;

  colonExcerpt?: Excerpt;

  selector?: DocMemberSelector;

  rightParenthesisExcerpt?: Excerpt;
}

/**
 * A {@link DocDeclarationReference | declaration reference} includes a chain of
 * member references represented using `DocMemberReference` nodes.
 *
 * @remarks
 * For example, `example-library#ui.controls.Button.(render:static)` is a
 * declaration reference that contains three member references:
 * `ui`, `.controls`, and `.Button`, and `.(render:static)`.
 */
export class DocMemberReference extends DocNode {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.MemberReference;

  // The "." token if unless this was the member reference in the chain
  private _dotParticle: DocParticle | undefined;

  private _leftParenthesisParticle: DocParticle | undefined;

  private _memberIdentifier: DocMemberIdentifier | undefined;

  private _memberSymbol: DocMemberSymbol | undefined;

  // The ":" token that separates the identifier and selector parts
  private _colonParticle: DocParticle | undefined;

  private _selector: DocMemberSelector | undefined;

  private _rightParenthesisParticle: DocParticle | undefined;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocMemberReferenceParameters) {
    super(parameters);
  }

  /**
   * True if this member reference is preceded by a dot (".") token.
   * It should be false only for the first member in the chain.
   */
  public get hasDot(): boolean {
    return !!this._dotParticle;
  }

  /**
   * The identifier for the referenced member.
   * @remarks
   * Either `memberIdentifier` or `memberSymbol` may be specified, but not both.
   */
  public get memberIdentifier(): DocMemberIdentifier | undefined {
    return this._memberIdentifier;
  }

  /**
   * The ECMAScript 6 symbol expression, which may be used instead of an identifier
   * to indicate the referenced member.
   * @remarks
   * Either `memberIdentifier` or `memberSymbol` may be specified, but not both.
   */
  public get memberSymbol(): DocMemberSymbol | undefined {
    return this._memberSymbol;
  }

  /**
   * A TSDoc selector, which may be optionally when the identifier or symbol is insufficient
   * to unambiguously determine the referenced declaration.
   */
  public get selector(): DocMemberSelector | undefined {
    return this._selector;
  }

  /** @override */
  public updateParameters(parameters: IDocMemberReferenceParameters): void {
    if (parameters.memberIdentifier && parameters.memberSymbol) {
      throw new Error('"memberIdentifier" or "memberSymbol" may be specified, but not both');
    }

    super.updateParameters(parameters);

    this._dotParticle = undefined;
    this._leftParenthesisParticle = undefined;
    this._colonParticle = undefined;
    this._selector = undefined;
    this._rightParenthesisParticle = undefined;

    if (parameters.hasDot || parameters.dotExcerpt) {
      this._dotParticle = new DocParticle({
        particleId: 'dot',
        excerpt: parameters.dotExcerpt,
        content: '.'
      });
    }

    if (parameters.leftParenthesisExcerpt || parameters.selector) {
      this._leftParenthesisParticle = new DocParticle({
        particleId: 'leftParenthesis',
        excerpt: parameters.leftParenthesisExcerpt,
        content: '('
      });
    }

    this._memberIdentifier = parameters.memberIdentifier;
    this._memberSymbol = parameters.memberSymbol;

    if (parameters.colonExcerpt || parameters.selector) {
      this._dotParticle = new DocParticle({
        particleId: 'colon',
        excerpt: parameters.colonExcerpt,
        content: ':'
      });
    }

    if (this._leftParenthesisParticle) {
      this._rightParenthesisParticle = new DocParticle({
        particleId: 'rightParenthesis',
        excerpt: parameters.rightParenthesisExcerpt,
        content: ')'
      });
    }
  }

  /**
   * {@inheritdoc}
   * @override
   */
  public getChildNodes(): ReadonlyArray<DocNode> {
    return DocNode.trimUndefinedNodes([
      this._dotParticle,
      this._leftParenthesisParticle,
      this._memberIdentifier,
      this._memberSymbol,
      this._colonParticle,
      this._selector,
      this._rightParenthesisParticle
    ]);
  }
}
