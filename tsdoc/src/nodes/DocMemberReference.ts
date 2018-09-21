import { DocNode, DocNodeKind, IDocNodeParameters } from './DocNode';
import { DocParticle } from './DocParticle';
import { Excerpt } from '../parser/Excerpt';

/**
 * Constructor parameters for {@link DocMemberReference}.
 */
export interface IDocMemberReferenceParameters extends IDocNodeParameters {
  hasDot: boolean;
  dotParticleExcerpt?: Excerpt;
  identifierExcerpt?: Excerpt;
  identifier: string;

  openingDelimiterExcerpt?: Excerpt;
  selectorExcerpt?: Excerpt;
  selector?: string;
  closingDelimiterExcerpt?: Excerpt;
}

/**
 * A declaration reference includes a chain of member references.
 * @remarks
 * For example, `example-library:ui.controls.Button[constructor]` is a
 * declaration reference that contains three member references:
 * `ui`, `.controls`, and `.Button[constructor]`.
 */
export class DocMemberReference extends DocNode {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.MemberReference;

  // The "." token if this is not the first member reference in the chain
  private readonly _dotParticle: DocParticle;

  // The identifier
  private readonly _identifierParticle: DocParticle;

  // The "[" token, if a selector is present
  private readonly _openingDelimiterParticle: DocParticle;

  // The optional selector
  private readonly _selectorParticle: DocParticle;

  // The "]" token, if a selector is present
  private readonly _closingDelimiterParticle: DocParticle;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocMemberReferenceParameters) {
    super(parameters);

    if (parameters.hasDot) {
      this._dotParticle = new DocParticle({
        excerpt: parameters.dotParticleExcerpt,
        content: '.'
      });
    } else {
      this._dotParticle = new DocParticle({
        content: ''
      });
    }

    this._identifierParticle = new DocParticle({
      excerpt: parameters.identifierExcerpt,
      content: parameters.identifier
    });

    if (parameters.selector !== undefined && parameters.selector.length > 0) {
      this._openingDelimiterParticle = new DocParticle({
        excerpt: parameters.openingDelimiterExcerpt,
        content: '['
      });

      this._selectorParticle = new DocParticle({
        excerpt: parameters.selectorExcerpt,
        content: parameters.selector
      });

      this._closingDelimiterParticle = new DocParticle({
        excerpt: parameters.closingDelimiterExcerpt,
        content: ']'
      });
    } else {
      this._openingDelimiterParticle = new DocParticle({ content: '' });
      this._selectorParticle = new DocParticle({ content: '' });
      this._closingDelimiterParticle = new DocParticle({ content: '' });
    }
  }

  /**
   * True if this member reference is preceded by a dot (".") token.
   * It should be false only for the first member in the chain.
   */
  public get hasDot(): boolean {
    return this._dotParticle.content.length > 0;
  }

  /**
   * The member identifier, for example the name of a TypeScript class, interface,
   * enum, function, etc.
   */
  public get identifier(): string {
    return this._identifierParticle.content;
  }

  /**
   * The optional selector, used in situations where TypeScript identifiers are
   * insufficient to unambiguously determine the declaration.  Examples include
   * function overloads, merged declarations, indexer, etc.
   *
   * @remarks
   * System-defined selectors use all lower case names (e.g. "class", "constructor", "static",
   * "instance").  User-defined selectors use upper case words delimited by underscores,
   * and are introduced using the `{@label}` inline tag.
   */
  public get selector(): string {
    return this._selectorParticle.content;
  }

  /**
   * {@inheritdoc}
   * @override
   */
  public getChildNodes(): ReadonlyArray<DocNode> {
    return [
      this._dotParticle,
      this._identifierParticle,
      this._openingDelimiterParticle,
      this._selectorParticle,
      this._closingDelimiterParticle
    ];
  }
}
