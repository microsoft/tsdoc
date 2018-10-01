import { DocNode, DocNodeKind, IDocNodeParameters } from './DocNode';
import { DocMemberReference } from './DocMemberReference';
import { DocParticle } from './DocParticle';
import { Excerpt } from '../parser/Excerpt';

/**
 * Constructor parameters for {@link DocDeclarationReference}.
 */
export interface IDocDeclarationReferenceParameters extends IDocNodeParameters {
  packageNameExcerpt?: Excerpt;
  packageName?: string;

  importPathExcerpt?: Excerpt;
  importPath?: string;

  importHashExcerpt?: Excerpt;

  memberReferences?: DocMemberReference[];
}

/**
 * Represents a declaration reference.
 *
 * @remarks
 * Declaration references are TSDoc expressions used by tags such as `{@link}`
 * or `{@inheritDoc}` that need to refer to another declaration.
 */
export class DocDeclarationReference extends DocNode {
  /** {@inheritDoc} */
  public readonly kind: DocNodeKind = DocNodeKind.DeclarationReference;

  private _packageNameParticle: DocParticle | undefined;
  private _importPathParticle: DocParticle | undefined;
  private _importHashParticle: DocParticle | undefined;
  private _memberReferences: DocMemberReference[] | undefined; // never undefined after updateParameters()

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocDeclarationReferenceParameters) {
    super(parameters);
  }

  /**
   * The optional package name, which may optionally include an NPM scope.
   *
   * Example: `"@scope/my-package"`
   */
  public get packageName(): string | undefined {
    if (this._packageNameParticle) {
      return this._packageNameParticle.content;
    } else {
      return undefined;
    }
  }

  /**
   * The optional import path.  If a package name is provided, then if an import path is provided,
   * the path must start with a "/" delimiter; otherwise paths are resolved relative to the source file
   * containing the reference.
   *
   * Example: `"/path1/path2"`
   * Example: `"./path1/path2"`
   * Example: `"../path2/path2"`
   */
  public get importPath(): string | undefined {
    if (this._importPathParticle) {
      return this._importPathParticle.content;
    } else {
      return undefined;
    }
  }

  /**
   * The chain of member references that indicate the declaration being referenced.
   * If this list is empty, then either the packageName or importPath must be provided,
   * because the reference refers to a module.
   */
  public get memberReferences(): ReadonlyArray<DocMemberReference> {
    return this._memberReferences!;
  }

  /** @override */
  public updateParameters(parameters: IDocDeclarationReferenceParameters): void {
    super.updateParameters(parameters);

    this._packageNameParticle = undefined;
    this._importPathParticle = undefined;
    this._importHashParticle = undefined;

    if (parameters.packageName) {
      this._packageNameParticle = new DocParticle({
        particleId: 'packageName',
        content: parameters.packageName,
        excerpt: parameters.packageNameExcerpt
      });
    }

    if (parameters.importPath) {
      this._importPathParticle = new DocParticle({
        particleId: 'importPath',
        content: parameters.importPath || '',
        excerpt: parameters.importPathExcerpt
      });
    }

    if ((parameters.packageName && this._importPathParticle) || parameters.importHashExcerpt) {
      this._importHashParticle = new DocParticle({
        particleId: 'importHash',
        content: '#',
        excerpt: parameters.importHashExcerpt
      });
    }

    this._memberReferences = parameters.memberReferences || [];
  }

  /**
   * {@inheritDoc}
   * @override
   */
  public getChildNodes(): ReadonlyArray<DocNode> {
    return DocNode.trimUndefinedNodes([
      this._packageNameParticle,
      this._importPathParticle,
      this._importHashParticle,
      ...this._memberReferences!
    ]);
  }
}
