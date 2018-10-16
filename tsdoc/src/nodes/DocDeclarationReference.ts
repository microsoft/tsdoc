import { DocNode, DocNodeKind, IDocNodeParameters, IDocNodeParsedParameters } from './DocNode';
import { DocMemberReference } from './DocMemberReference';
import { TokenSequence } from '../parser/TokenSequence';
import { DocExcerpt, ExcerptKind } from './DocExcerpt';

/**
 * Constructor parameters for {@link DocDeclarationReference}.
 */
export interface IDocDeclarationReferenceParameters extends IDocNodeParameters {
  packageName?: string;
  importPath?: string;
  memberReferences?: DocMemberReference[];
}

/**
 * Constructor parameters for {@link DocDeclarationReference}.
 */
export interface IDocDeclarationReferenceParsedParameters extends IDocNodeParsedParameters {
  packageNameExcerpt?: TokenSequence;
  importPathExcerpt?: TokenSequence;
  importHashExcerpt?: TokenSequence;
  spacingAfterImportHashExcerpt?: TokenSequence;
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

  private _packageName: string | undefined;
  private readonly _packageNameExcerpt: DocExcerpt | undefined;

  private _importPath: string | undefined;
  private readonly _importPathExcerpt: DocExcerpt | undefined;

  private readonly _importHashExcerpt: DocExcerpt | undefined;
  private readonly _spacingAfterImportHashExcerpt: DocExcerpt | undefined;

  private readonly _memberReferences: DocMemberReference[];

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocDeclarationReferenceParameters | IDocDeclarationReferenceParsedParameters) {
    super(parameters);

    if (DocNode.isParsedParameters(parameters)) {
      if (parameters.packageNameExcerpt) {
        this._packageNameExcerpt = new DocExcerpt({
          excerptKind: ExcerptKind.DeclarationReference_PackageName,
          content: parameters.packageNameExcerpt
        });
      }
      if (parameters.importPathExcerpt) {
        this._importPathExcerpt = new DocExcerpt({
          excerptKind: ExcerptKind.DeclarationReference_ImportPath,
          content: parameters.importPathExcerpt
        });
      }
      if (parameters.importHashExcerpt ) {
        this._importHashExcerpt = new DocExcerpt({
          excerptKind: ExcerptKind.DeclarationReference_ImportHash,
          content: parameters.importHashExcerpt
        });
      }
      if (parameters.spacingAfterImportHashExcerpt ) {
        this._spacingAfterImportHashExcerpt = new DocExcerpt({
          excerptKind: ExcerptKind.Spacing,
          content: parameters.spacingAfterImportHashExcerpt
        });
      }
    } else {
      this._packageName = parameters.packageName;
      this._importPath = parameters.importPath;
    }

    this._memberReferences = [];
    if (parameters.memberReferences) {
      this._memberReferences.push(...parameters.memberReferences);
    }
  }

  /**
   * The optional package name, which may optionally include an NPM scope.
   *
   * Example: `"@scope/my-package"`
   */
  public get packageName(): string | undefined {
    if (this._packageName === undefined) {
      if (this._packageNameExcerpt !== undefined) {
        this._packageName = this._packageNameExcerpt.content.toString();
      }
    }
    return this._packageName;
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
    if (this._importPath === undefined) {
      if (this._importPathExcerpt !== undefined) {
        this._importPath = this._importPathExcerpt.content.toString();
      }
    }
    return this._importPath;
  }

  /**
   * The chain of member references that indicate the declaration being referenced.
   * If this list is empty, then either the packageName or importPath must be provided,
   * because the reference refers to a module.
   */
  public get memberReferences(): ReadonlyArray<DocMemberReference> {
    return this._memberReferences;
  }

  /** @override */
  protected onGetChildNodes(): ReadonlyArray<DocNode | undefined> {
    return [
      this._packageNameExcerpt,
      this._importPathExcerpt,
      this._importHashExcerpt,
      this._spacingAfterImportHashExcerpt,
      ...this._memberReferences
    ];
  }
}
