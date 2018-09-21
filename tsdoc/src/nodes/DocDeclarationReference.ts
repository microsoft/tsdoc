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

  colonExcerpt?: Excerpt;

  memberReferences?: DocMemberReference[];
}

/**
 *
 */
export class DocDeclarationReference extends DocNode {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.DeclarationReference;

  private _packageNameParticle: DocParticle;
  private _importPathParticle: DocParticle;
  private _colonParticle: DocParticle;
  private _memberReferences: DocMemberReference[];

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocDeclarationReferenceParameters) {
    super(parameters);

    this._packageNameParticle = new DocParticle({
      content: parameters.packageName || '',
      excerpt: parameters.packageNameExcerpt
    });

    this._importPathParticle = new DocParticle({
      content: parameters.importPath || '',
      excerpt: parameters.importPathExcerpt
    });

    if (this._importPathParticle.content.length > 0 || this._packageNameParticle.content.length > 0) {
      this._colonParticle = new DocParticle({
        content: '.',
        excerpt: parameters.colonExcerpt
      });
    } else {
      this._colonParticle = new DocParticle({ content: '' });
    }

    this._memberReferences = parameters.memberReferences || [];
  }

  /**
   * The optional package name, which may optionally include an NPM scope.
   *
   * Example: `"@scope/my-package"`
   */
  public get packageName(): string | undefined {
    if (this._packageNameParticle.content.length > 0) {
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
    if (this._importPathParticle.content.length > 0) {
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
    return this._memberReferences;
  }

  /**
   * {@inheritdoc}
   * @override
   */
  public getChildNodes(): ReadonlyArray<DocNode> {
    return [
      this._packageNameParticle,
      this._importPathParticle,
      this._colonParticle,
      ...this._memberReferences
    ];
  }
}
