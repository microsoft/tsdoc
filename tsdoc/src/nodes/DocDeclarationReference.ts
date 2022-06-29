import { DocNode, DocNodeKind, IDocNodeParameters, IDocNodeParsedParameters } from './DocNode';
import { DocMemberReference } from './DocMemberReference';
import { TokenSequence } from '../parser/TokenSequence';
import { DocExcerpt, ExcerptKind } from './DocExcerpt';
import { StringBuilder } from '../emitters/StringBuilder';
import { DeclarationReference, ModuleSource } from '../beta/DeclarationReference';

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
 * @beta
 */
export interface IBetaDocDeclarationReferenceParameters extends IDocNodeParameters {
  declarationReference: DeclarationReference;
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
 * Constructor parameters for {@link DocDeclarationReference}.
 * @beta
 */
export interface IBetaDocDeclarationReferenceParsedParameters extends IDocNodeParsedParameters {
  declarationReferenceExcerpt: TokenSequence;
  declarationReference?: DeclarationReference;
}

/**
 * Represents a declaration reference.
 *
 * @remarks
 * Declaration references are TSDoc expressions used by tags such as `{@link}`
 * or `{@inheritDoc}` that need to refer to another declaration.
 */
export class DocDeclarationReference extends DocNode {
  private _packageName: string | undefined;
  private readonly _packageNameExcerpt: DocExcerpt | undefined;

  private _importPath: string | undefined;
  private readonly _importPathExcerpt: DocExcerpt | undefined;

  private readonly _importHashExcerpt: DocExcerpt | undefined;
  private readonly _spacingAfterImportHashExcerpt: DocExcerpt | undefined;

  private _memberReferences: DocMemberReference[] | undefined;

  private readonly _declarationReference: DeclarationReference | undefined;
  private readonly _declarationReferenceExcerpt: DocExcerpt | undefined;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(
    parameters:
      | IDocDeclarationReferenceParameters
      | IDocDeclarationReferenceParsedParameters
      | IBetaDocDeclarationReferenceParameters
      | IBetaDocDeclarationReferenceParsedParameters
  ) {
    super(parameters);

    if (DocNode.isParsedParameters(parameters)) {
      if ('declarationReferenceExcerpt' in parameters) {
        this._declarationReferenceExcerpt = new DocExcerpt({
          configuration: this.configuration,
          excerptKind: ExcerptKind.DeclarationReference_DeclarationReference,
          content: parameters.declarationReferenceExcerpt
        });
        this._declarationReference =
          parameters.declarationReference ??
          DeclarationReference.parse(this._declarationReferenceExcerpt.content.toString());
      } else {
        if (parameters.packageNameExcerpt) {
          this._packageNameExcerpt = new DocExcerpt({
            configuration: this.configuration,
            excerptKind: ExcerptKind.DeclarationReference_PackageName,
            content: parameters.packageNameExcerpt
          });
        }
        if (parameters.importPathExcerpt) {
          this._importPathExcerpt = new DocExcerpt({
            configuration: this.configuration,
            excerptKind: ExcerptKind.DeclarationReference_ImportPath,
            content: parameters.importPathExcerpt
          });
        }
        if (parameters.importHashExcerpt) {
          this._importHashExcerpt = new DocExcerpt({
            configuration: this.configuration,
            excerptKind: ExcerptKind.DeclarationReference_ImportHash,
            content: parameters.importHashExcerpt
          });
        }
        if (parameters.spacingAfterImportHashExcerpt) {
          this._spacingAfterImportHashExcerpt = new DocExcerpt({
            configuration: this.configuration,
            excerptKind: ExcerptKind.Spacing,
            content: parameters.spacingAfterImportHashExcerpt
          });
        }
        if (parameters.memberReferences) {
          this._memberReferences = parameters.memberReferences.slice();
        }
      }
    } else if ('declarationReference' in parameters) {
      this._declarationReference = parameters.declarationReference;
    } else {
      this._packageName = parameters.packageName;
      this._importPath = parameters.importPath;
      if (parameters.memberReferences) {
        this._memberReferences = parameters.memberReferences.slice();
      }
    }
  }

  /** @override */
  public get kind(): DocNodeKind | string {
    return DocNodeKind.DeclarationReference;
  }

  /**
   * The optional package name, which may optionally include an NPM scope.
   *
   * Example: `"@scope/my-package"`
   */
  public get packageName(): string | undefined {
    if (this.declarationReference) {
      if (this.declarationReference.source instanceof ModuleSource) {
        return this.declarationReference.source.packageName;
      }
      return undefined;
    }
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
    if (this.declarationReference) {
      if (this.declarationReference.source instanceof ModuleSource) {
        return this.declarationReference.source.importPath;
      }
    }
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
    if (!this._memberReferences) {
      this._memberReferences =
        this._declarationReference?.symbol?.toDocMemberReferences(this.configuration) ?? [];
    }
    return this._memberReferences;
  }

  /**
   * Gets the beta DeclarationReference for this reference.
   * @beta
   */
  public get declarationReference(): DeclarationReference | undefined {
    return this._declarationReference;
  }

  /**
   * Generates the TSDoc representation of this declaration reference.
   */
  public emitAsTsdoc(): string {
    const stringBuilder: StringBuilder = new StringBuilder();
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const emitter: TSDocEmitter = new TSDocEmitter();
    emitter.renderDeclarationReference(stringBuilder, this);
    return stringBuilder.toString();
  }

  /** @override */
  protected onGetChildNodes(): ReadonlyArray<DocNode | undefined> {
    return this._declarationReferenceExcerpt
      ? [this._declarationReferenceExcerpt]
      : [
          this._packageNameExcerpt,
          this._importPathExcerpt,
          this._importHashExcerpt,
          this._spacingAfterImportHashExcerpt,
          ...(this._memberReferences ?? [])
        ];
  }
}

// Circular reference
import { TSDocEmitter } from '../emitters/TSDocEmitter';
