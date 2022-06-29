/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/array-type */
/* eslint-disable no-return-assign */
/* eslint-disable no-sequences */
/* eslint-disable no-inner-declarations */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @rushstack/no-new-null */

// NOTE: See DeclarationReference.grammarkdown for information on the underlying grammar.
// NOTE: @rushstack/no-new-null is disabled for places where `null` is used as a sentinel to
//       indicate explicit non-presence of a value (such as when removing values using `.with()`).

import { TSDocConfiguration } from '../configuration/TSDocConfiguration';
import {
  DocDeclarationReference,
  DocMemberIdentifier,
  DocMemberReference,
  DocMemberSelector,
  DocMemberSymbol
} from '../nodes';
import { StringChecks } from '../parser/StringChecks';
import { TokenKind, Token as DocToken } from '../parser/Token';
import { TokenReader } from '../parser/TokenReader';

// #region DeclarationReference

/**
 * Represents a reference to a declaration.
 * @beta
 */
export class DeclarationReference {
  private _source: Source | undefined;
  private _navigation: SourceNavigation | undefined;
  private _symbol: SymbolReference | undefined;

  public constructor(source?: Source, navigation?: SourceNavigation, symbol?: SymbolReference) {
    this._source = source;
    this._navigation = navigation;
    this._symbol = symbol;
  }

  /**
   * Gets the source for the declaration.
   */
  public get source(): Source | undefined {
    return this._source;
  }

  /**
   * Gets whether the symbol for the declaration is a local or exported symbol of the source.
   */
  public get navigation(): SourceNavigation | undefined {
    return resolveNavigation(this._source, this._symbol, this._navigation);
  }

  /**
   * Gets the symbol reference for the declaration.
   */
  public get symbol(): SymbolReference | undefined {
    return this._symbol;
  }

  /**
   * Gets a value indicating whether this {@link DeclarationReference} is empty.
   */
  public get isEmpty(): boolean {
    return this.source === undefined && this.symbol === undefined;
  }

  /**
   * Parses a {@link DeclarationReference} from the provided text.
   */
  public static parse(source: string): DeclarationReference {
    const parser: Parser = new Parser(new TextReader(source));
    const reference: DeclarationReference = parser.parseDeclarationReference();
    if (parser.errors.length) {
      throw new SyntaxError(`Invalid DeclarationReference '${source}':\n  ${parser.errors.join('\n  ')}`);
    } else if (!parser.eof) {
      throw new SyntaxError(`Invalid DeclarationReference '${source}'`);
    }
    return reference;
  }

  /**
   * Parses a {@link DeclarationReference} from the provided text.
   */
  public static tryParse(source: string): DeclarationReference | undefined;
  /**
   * Parses a {@link DeclarationReference} from the provided text.
   * @internal
   */
  public static tryParse(source: TokenReader, fallback?: boolean): DeclarationReference | undefined;
  public static tryParse(source: string | TokenReader, fallback?: boolean): DeclarationReference | undefined {
    const marker: number | undefined = typeof source === 'string' ? undefined : source.createMarker();
    const reader: ICharacterReader =
      typeof source === 'string' ? new TextReader(source) : new TokenReaderNormalizer(source);
    const parser: Parser = new Parser(reader, fallback);
    const reference: DeclarationReference = parser.parseDeclarationReference();
    if (parser.errors.length || (!parser.eof && typeof source === 'string')) {
      if (marker !== undefined && typeof source !== 'string') {
        source.backtrackToMarker(marker);
      }
      return undefined;
    }
    return reference;
  }

  /**
   * Parses a {@link Component} from the provided text.
   */
  public static parseComponent(text: string): Component {
    if (text[0] === '[') {
      return ComponentReference.parse(text);
    } else {
      return new ComponentString(text, true);
    }
  }

  /**
   * Determines whether the provided string is a well-formed symbol navigation component string.
   */
  public static isWellFormedComponentString(text: string): boolean {
    const scanner: Scanner = new Scanner(new TextReader(text));
    return scanner.scan() === Token.String
      ? scanner.scan() === Token.EofToken
      : scanner.token() === Token.Text
      ? scanner.scan() === Token.EofToken
      : scanner.token() === Token.EofToken;
  }

  /**
   * Escapes a string for use as a symbol navigation component. If the string contains any of `!.#~:,"{}()@` or starts
   * with `[`, it is enclosed in quotes.
   */
  public static escapeComponentString(text: string): string {
    if (text.length === 0) {
      return '""';
    } else {
      const ch: string = text.charAt(0);
      if (ch === '[' || ch === '"' || !this.isWellFormedComponentString(text)) {
        return JSON.stringify(text);
      } else {
        return text;
      }
    }
  }

  /**
   * Unescapes a string used as a symbol navigation component.
   */
  public static unescapeComponentString(text: string): string {
    if (text.length >= 2 && text.charAt(0) === '"' && text.charAt(text.length - 1) === '"') {
      try {
        return JSON.parse(text);
      } catch {
        throw new SyntaxError(`Invalid Component '${text}'`);
      }
    } else if (!this.isWellFormedComponentString(text)) {
      throw new SyntaxError(`Invalid Component '${text}'`);
    } else {
      return text;
    }
  }

  /**
   * Determines whether the provided string is a well-formed module source string. The string may not
   * have a trailing `!` character.
   */
  public static isWellFormedModuleSourceString(text: string): boolean {
    const scanner: Scanner = new Scanner(new TextReader(text + '!'));
    return (
      scanner.rescanModuleSource() === Token.ModuleSource &&
      !scanner.stringIsUnterminated &&
      scanner.scan() === Token.ExclamationToken &&
      scanner.scan() === Token.EofToken
    );
  }

  /**
   * Escapes a string for use as a module source. If the string contains any of `!"` it is enclosed in quotes.
   */
  public static escapeModuleSourceString(text: string): string {
    if (text.length === 0) {
      return '""';
    } else {
      const ch: string = text.charAt(0);
      if (ch === '"' || !this.isWellFormedModuleSourceString(text)) {
        return JSON.stringify(text);
      } else {
        return text;
      }
    }
  }

  /**
   * Unescapes a string used as a module source. The string may not have a trailing `!` character.
   */
  public static unescapeModuleSourceString(text: string): string {
    if (text.length >= 2 && text.charAt(0) === '"' && text.charAt(text.length - 1) === '"') {
      try {
        return JSON.parse(text);
      } catch {
        throw new SyntaxError(`Invalid Module source '${text}'`);
      }
    } else if (!this.isWellFormedModuleSourceString(text)) {
      throw new SyntaxError(`Invalid Module source '${text}'`);
    } else {
      return text;
    }
  }

  /**
   * Returns an empty {@link DeclarationReference}.
   *
   * An alias for `DeclarationReference.from({ })`.
   */
  public static empty(): DeclarationReference {
    return DeclarationReference.from({});
  }

  /**
   * Creates a new {@link DeclarationReference} for the provided package.
   *
   * An alias for `Declaration.from({ packageName, importPath })`.
   */
  public static package(packageName: string, importPath?: string): DeclarationReference {
    return DeclarationReference.from({ packageName, importPath });
  }

  /**
   * Creates a new {@link DeclarationReference} for the provided module path.
   */
  public static module(path: string, userEscaped?: boolean): DeclarationReference {
    return new DeclarationReference(new ModuleSource(path, userEscaped));
  }

  /**
   * Creates a new {@link DeclarationReference} for the global scope.
   */
  public static global(): DeclarationReference {
    return new DeclarationReference(GlobalSource.instance);
  }

  /**
   * Creates a new {@link DeclarationReference} from the provided parts.
   */
  public static from(parts: DeclarationReferenceLike</*With*/ false> | undefined): DeclarationReference {
    const resolved: ResolvedDeclarationReferenceLike | undefined = resolveDeclarationReferenceLike(
      parts,
      /*fallbackReference*/ undefined
    );
    if (resolved === undefined) {
      return new DeclarationReference();
    } else if (resolved instanceof DeclarationReference) {
      return resolved;
    } else {
      const { source, navigation, symbol } = resolved;
      return new DeclarationReference(
        source === undefined ? undefined : Source.from(source),
        navigation,
        symbol === undefined ? undefined : SymbolReference.from(symbol)
      );
    }
  }

  /**
   * Returns a {@link DeclarationReference} updated with the provided parts.
   * If a part is set to `undefined`, the current value is used.
   * If a part is set to `null`, the part will be removed in the result.
   * @returns This object if there were no changes; otherwise, a new object updated with the provided parts.
   */
  public with(parts: DeclarationReferenceParts</*With*/ true>): DeclarationReference {
    const { source, navigation, symbol } = resolveDeclarationReferenceParts(
      parts,
      this.source,
      this.navigation,
      this.symbol
    );

    const resolvedSource: Source | undefined = source === undefined ? undefined : Source.from(source);

    const resolvedSymbol: SymbolReference | undefined =
      symbol === undefined ? undefined : SymbolReference.from(symbol);

    const resolvedNavigation: SourceNavigation | undefined = resolveNavigation(
      resolvedSource,
      resolvedSymbol,
      navigation
    );

    if (
      Source.equals(this.source, resolvedSource) &&
      SymbolReference.equals(this.symbol, resolvedSymbol) &&
      this.navigation === resolvedNavigation
    ) {
      return this;
    } else {
      return new DeclarationReference(resolvedSource, navigation, resolvedSymbol);
    }
  }

  /**
   * Returns an {@link DeclarationReference} updated with the provided source.
   *
   * An alias for `declref.with({ source: source ?? null })`.
   *
   * @returns This object if there were no changes; otherwise, a new object updated with the provided source.
   */
  public withSource(source: Source | undefined): DeclarationReference {
    return this.with({ source: source ?? null });
  }

  /**
   * Returns an {@link DeclarationReference} updated with the provided navigation.
   *
   * An alias for `declref.with({ navigation: navigation ?? null })`.
   *
   * @returns This object if there were no changes; otherwise, a new object updated with the provided navigation.
   */
  public withNavigation(navigation: SourceNavigation | undefined): DeclarationReference {
    return this.with({ navigation: navigation ?? null });
  }

  /**
   * Returns an {@link DeclarationReference} updated with the provided symbol.
   *
   * An alias for `declref.with({ symbol: symbol ?? null })`.
   *
   * @returns This object if there were no changes; otherwise, a new object updated with the provided symbol.
   */
  public withSymbol(symbol: SymbolReference | undefined): DeclarationReference {
    return this.with({ symbol: symbol ?? null });
  }

  /**
   * Returns an {@link DeclarationReference} whose symbol has been updated with the provided component path.
   *
   * An alias for `declref.with({ componentPath: componentPath ?? null })`.
   *
   * @returns This object if there were no changes; otherwise, a new object updated with the provided component path.
   */
  public withComponentPath(componentPath: ComponentPath | undefined): DeclarationReference {
    return this.with({ componentPath: componentPath ?? null });
  }

  /**
   * Returns an {@link DeclarationReference} whose symbol has been updated with the provided meaning.
   *
   * An alias for `declref.with({ meaning: meaning ?? null })`.
   *
   * @returns This object if there were no changes; otherwise, a new object updated with the provided meaning.
   */
  public withMeaning(meaning: Meaning | undefined): DeclarationReference {
    return this.with({ meaning: meaning ?? null });
  }

  /**
   * Returns an {@link DeclarationReference} whose symbol has been updated with the provided overload index.
   *
   * An alias for `declref.with({ overloadIndex: overloadIndex ?? null })`.
   *
   * @returns This object if there were no changes; otherwise, a new object updated with the provided overload index.
   */
  public withOverloadIndex(overloadIndex: number | undefined): DeclarationReference {
    return this.with({ overloadIndex: overloadIndex ?? null });
  }

  /**
   * Returns a new {@link DeclarationReference} whose symbol has been updated to include the provided navigation step in its component path.
   * @returns This object if there were no changes; otherwise, a new object updated with the provided navigation step.
   */
  public addNavigationStep(
    navigation: Navigation,
    component: ComponentLike</*With*/ false>
  ): DeclarationReference {
    if (this.symbol) {
      return this.withSymbol(this.symbol.addNavigationStep(navigation, component));
    } else {
      if (navigation === Navigation.Members) {
        navigation = Navigation.Exports;
      }
      return this.with({
        navigation,
        symbol: SymbolReference.from({ componentPath: ComponentRoot.from({ component }) })
      });
    }
  }

  /**
   * Tests whether two {@link DeclarationReference} objects are equivalent.
   */
  public static equals(
    left: DeclarationReference | undefined,
    right: DeclarationReference | undefined
  ): boolean {
    if (left === undefined || right === undefined) {
      return left === right;
    } else {
      return left.toString() === right.toString();
    }
  }

  /**
   * Tests whether this object is equivalent to `other`.
   */
  public equals(other: DeclarationReference): boolean {
    return DeclarationReference.equals(this, other);
  }

  public toString(): string {
    const navigation: string =
      this._source instanceof ModuleSource && this._symbol && this.navigation === Navigation.Locals
        ? '~'
        : '';
    return `${this.source || ''}${navigation}${this.symbol || ''}`;
  }
}

// #region DeclarationReferenceParts

/**
 * A part that can be used to compose or update a {@link DeclarationReference}.
 *
 * @typeParam With - `true` if this part is used by `with()` (which allows `null` for some parts), `false` if this part is used
 * by `from()` (which does not allow `null`).
 *
 * @beta
 */
export type DeclarationReferenceSourcePart<With extends boolean> = Parts<
  With,
  {
    /** The module or global source for a symbol. */
    source?: Part<With, SourceLike<With>>;
  }
>;

/**
 * Parts that can be used to compose or update a {@link DeclarationReference}.
 *
 * @typeParam With - `true` if these parts are used by `with()` (which allows `null` for some parts), `false` if these parts are used by `from()` (which does not allow `null`).
 *
 * @beta
 */
export type DeclarationReferenceSourceParts<With extends boolean> =
  | DeclarationReferenceSourcePart<With>
  | SourceParts<With>;

/**
 * Parts that can be used to compose or update a {@link DeclarationReference}.
 *
 * @typeParam With - `true` if these parts are used by `with()` (which allows `null` for some parts), `false` if these parts are used by `from()` (which does not allow `null`).
 *
 * @beta
 */
export type DeclarationReferenceNavigationParts<With extends boolean> = Parts<
  With,
  {
    /** Indicates whether the symbol is exported or local to the source. */
    navigation?: Part<With, SourceNavigation>;
  }
>;

/**
 * A part that can be used to compose or update a {@link DeclarationReference}.
 *
 * @typeParam With - `true` if this part is used by `with()` (which allows `null` for some parts), `false` if this part is used
 * by `from()` (which does not allow `null`).
 *
 * @beta
 */
export type DeclarationReferenceSymbolPart<With extends boolean> = Parts<
  With,
  {
    /** The referenced symbol. */
    symbol?: Part<With, SymbolReferenceLike<With>>;
  }
>;

/**
 * Parts that can be used to compose or update a {@link DeclarationReference}.
 *
 * @typeParam With - `true` if these parts are used by `with()` (which allows `null` for some parts), `false` if these parts are used by `from()` (which does not allow `null`).
 *
 * @beta
 */
export type DeclarationReferenceSymbolParts<With extends boolean> =
  | DeclarationReferenceSymbolPart<With>
  | SymbolReferenceParts<With>;

/**
 * Parts that can be used to compose or update a {@link DeclarationReference}.
 *
 * @typeParam With - `true` if these parts are used by `with()` (which allows `null` for some parts), `false` if these parts are used by `from()` (which does not allow `null`).
 *
 * @beta
 */
export type DeclarationReferenceParts<With extends boolean> = DeclarationReferenceSourceParts<With> &
  DeclarationReferenceNavigationParts<With> &
  DeclarationReferenceSymbolParts<With>;

function resolveDeclarationReferenceSource(
  parts: DeclarationReferenceSourceParts</*With*/ true>,
  fallbackSource: Source | undefined
): SourceLike</*With*/ false> | undefined {
  // If `source` is neither `null` or `undefined`, returns the resolved source-like.
  // If `source` is `null`, returns `undefined` (which removes `source` from the updated DeclarationReference).
  // If `packageName`, `scopeName`, `unscopedPackageName`, or `importPath` are present, returns the resolved `ModuleSourceParts` for those properties.
  // If `source` is `undefined`, assumes no change and returns `fallbackSource`.
  const { source, packageName, scopeName, unscopedPackageName, importPath } = parts as AllParts<typeof parts>;
  if (source !== undefined) {
    if (packageName !== undefined) {
      throw new TypeError(`Cannot specify both 'source' and 'packageName'`);
    } else if (scopeName !== undefined) {
      throw new TypeError(`Cannot specify both 'source' and 'scopeName'`);
    } else if (unscopedPackageName !== undefined) {
      throw new TypeError(`Cannot specify both 'source' and 'unscopedPackageName'`);
    } else if (importPath !== undefined) {
      throw new TypeError(`Cannot specify both 'source' and 'importPath'`);
    }
    if (source === null) {
      return undefined;
    } else {
      return resolveSourceLike(source, fallbackSource);
    }
  } else if (
    packageName !== undefined ||
    scopeName !== undefined ||
    unscopedPackageName !== undefined ||
    importPath !== undefined
  ) {
    return resolveModuleSourceParts(
      parts as ModuleSourceParts</*With*/ true>,
      tryCast(fallbackSource, ModuleSource)?.['_getOrParsePathComponents']()
    );
  } else {
    return fallbackSource;
  }
}

function resolveDeclarationReferenceNavigation(
  parts: DeclarationReferenceNavigationParts</*With*/ true>,
  fallbackNavigation: SourceNavigation | undefined
): SourceNavigation | undefined {
  // If `navigation` is neither `null` nor `undefined`, returns `navigation`.
  // If `navigation` is `null`, returns `undefined` (which removes `navigation` from the updated DeclarationReference).
  // If `navigation` is `undeifned`, returns `fallbackNavigation`.
  const { navigation } = parts;
  if (navigation !== undefined) {
    if (navigation === null) {
      return undefined;
    } else {
      return navigation;
    }
  } else {
    return fallbackNavigation;
  }
}

function resolveDeclarationReferenceSymbol(
  parts: DeclarationReferenceSymbolParts</*With*/ true>,
  fallbackSymbol: SymbolReference | undefined
): SymbolReferenceLike</*With*/ false> | undefined {
  // If `symbol` is neither `null` or `undefined`, returns the resolved symbol-reference-like.
  // If `symbol` is `null`, returns `undefined` (which removes `symbol` from the updated DeclarationReference).
  // If `componentPath`, `meaning`, or `overloadIndex` are present, returns the resolved `SymbolReferenceParts` for those properties.
  // If `symbol` is `undefined`, assumes no change and returns `fallbackSymbol`.
  const { symbol, componentPath, meaning, overloadIndex } = parts as AllParts<typeof parts>;
  if (symbol !== undefined) {
    if (componentPath !== undefined) {
      throw new TypeError(`Cannot specify both 'symbol' and 'componentPath'`);
    } else if (meaning !== undefined) {
      throw new TypeError(`Cannot specify both 'symbol' and 'meaning'`);
    } else if (overloadIndex !== undefined) {
      throw new TypeError(`Cannot specify both 'symbol' and 'overloadIndex'`);
    }
    if (symbol === null) {
      return undefined;
    } else {
      return resolveSymbolReferenceLike(symbol, fallbackSymbol);
    }
  } else if (componentPath !== undefined || meaning !== undefined || overloadIndex !== undefined) {
    return resolveSymbolReferenceLike(parts as SymbolReferenceParts</*With*/ true>, fallbackSymbol);
  } else {
    return fallbackSymbol;
  }
}

type ResolvedDeclarationReferenceParts = DeclarationReferenceSourcePart</*With*/ false> &
  DeclarationReferenceNavigationParts</*With*/ false> &
  DeclarationReferenceSymbolPart</*With*/ false>;

function resolveDeclarationReferenceParts(
  parts: DeclarationReferenceParts</*With*/ true>,
  fallbackSource: Source | undefined,
  fallbackNavigation: Navigation.Exports | Navigation.Locals | undefined,
  fallbackSymbol: SymbolReference | undefined
): ResolvedDeclarationReferenceParts {
  return {
    source: resolveDeclarationReferenceSource(parts, fallbackSource),
    navigation: resolveDeclarationReferenceNavigation(parts, fallbackNavigation),
    symbol: resolveDeclarationReferenceSymbol(parts, fallbackSymbol)
  };
}

// #endregion DeclarationReferenceParts

/**
 * A value that can be resolved to a {@link DeclarationReference}.
 *
 * @typeParam With - `true` if this type is used by `with()` (which allows `null` for some parts), `false` if this value is used
 * by `from()` (which does not allow `null`).
 *
 * @beta
 */
export type DeclarationReferenceLike<With extends boolean> =
  | DeclarationReference
  | DeclarationReferenceParts<With>
  | string;

type ResolvedDeclarationReferenceLike = DeclarationReference | ResolvedDeclarationReferenceParts;

function resolveDeclarationReferenceLike(
  reference: DeclarationReferenceLike</*With*/ true> | undefined,
  fallbackReference: DeclarationReference | undefined
): ResolvedDeclarationReferenceLike | undefined {
  if (reference === undefined) {
    return undefined;
  } else if (reference instanceof DeclarationReference) {
    return reference;
  } else if (typeof reference === 'string') {
    return DeclarationReference.parse(reference);
  } else {
    return resolveDeclarationReferenceParts(
      reference,
      fallbackReference?.source,
      fallbackReference?.navigation,
      fallbackReference?.symbol
    );
  }
}

function resolveNavigation(
  source: Source | undefined,
  symbol: SymbolReference | undefined,
  navigation: SourceNavigation | undefined
): SourceNavigation | undefined {
  if (!source || !symbol) {
    return undefined;
  } else if (source === GlobalSource.instance) {
    return Navigation.Locals;
  } else if (navigation === undefined) {
    return Navigation.Exports;
  } else {
    return navigation;
  }
}

// #endregion DeclarationReference

// #region SourceBase

/**
 * Abstract base class for the source of a {@link DeclarationReference}.
 * @beta
 */
export abstract class SourceBase {
  public abstract readonly kind: string;

  /**
   * Combines this source with the provided parts to create a new {@link DeclarationReference}.
   */
  public toDeclarationReference(
    this: Source,
    parts?: DeclarationReferenceNavigationParts</*With*/ false> &
      DeclarationReferenceSymbolParts</*With*/ false>
  ): DeclarationReference {
    return DeclarationReference.from({ ...parts, source: this });
  }

  public abstract toString(): string;
}

// #endregion SourceBase

// #region GlobalSource

/**
 * Represents the global scope.
 * @beta
 */
export class GlobalSource extends SourceBase {
  /**
   * A singleton instance of {@link GlobalSource}.
   */
  public static readonly instance: GlobalSource = new GlobalSource();

  public readonly kind: 'global-source' = 'global-source';

  private constructor() {
    super();
  }

  public toString(): string {
    return '!';
  }
}

// #endregion GlobalSource

// #region ModuleSource

/**
 * Represents a module source.
 * @beta
 */
export class ModuleSource extends SourceBase {
  public readonly kind: 'module-source' = 'module-source';

  private _escapedPath: string;
  private _path: string | undefined;
  private _pathComponents: IParsedPackage | undefined;
  private _packageName: string | undefined;

  /**
   * @param path The module source path, including the package name.
   * @param userEscaped If `false`, escapes `path` if needed. If `true` (default), validates `path` is already escaped.
   */
  public constructor(path: string, userEscaped: boolean = true) {
    super();
    this._escapedPath = escapeModuleSourceIfNeeded(path, this instanceof ParsedModuleSource, userEscaped);
  }

  /**
   * A canonically escaped module source string.
   */
  public get escapedPath(): string {
    return this._escapedPath;
  }

  /**
   * An unescaped module source string.
   */
  public get path(): string {
    return this._path !== undefined
      ? this._path
      : (this._path = DeclarationReference.unescapeModuleSourceString(this.escapedPath));
  }

  /**
   * The full name of the module's package, such as `typescript` or `@microsoft/api-extractor`.
   */
  public get packageName(): string {
    if (this._packageName === undefined) {
      const parsed: IParsedPackage = this._getOrParsePathComponents();
      this._packageName = formatPackageName(parsed.scopeName, parsed.unscopedPackageName);
    }
    return this._packageName;
  }

  /**
   * Returns the scope portion of a scoped package name (i.e., `@scope` in `@scope/package`).
   */
  public get scopeName(): string {
    return this._getOrParsePathComponents().scopeName ?? '';
  }

  /**
   * Returns the non-scope portion of a scoped package name (i.e., `package` in `@scope/package`, or `typescript` in `typescript`).
   */
  public get unscopedPackageName(): string {
    return this._getOrParsePathComponents().unscopedPackageName;
  }

  /**
   * Returns the package-relative import path of a module source (i.e., `path/to/file` in `packageName/path/to/file`).
   */
  public get importPath(): string {
    return this._getOrParsePathComponents().importPath ?? '';
  }

  /**
   * Creates a new {@link ModuleSource} from the supplied parts.
   */
  public static from(parts: ModuleSourceLike</*With*/ false>): ModuleSource {
    const resolved: ResolvedModuleSourceLike = resolveModuleSourceLike(parts, /*fallbackSource*/ undefined);
    if (resolved instanceof ModuleSource) {
      return resolved;
    } else {
      const source: ModuleSource = new ModuleSource(
        formatModuleSource(resolved.scopeName, resolved.unscopedPackageName, resolved.importPath)
      );
      source._pathComponents = resolved;
      return source;
    }
  }

  /**
   * Creates a new {@link ModuleSource} for a scoped package.
   *
   * An alias for `ModuleSource.from({ scopeName, unscopedPackageName, importPath })`.
   */
  public static fromScopedPackage(
    scopeName: string | undefined,
    unscopedPackageName: string,
    importPath?: string
  ): ModuleSource {
    return ModuleSource.from({ scopeName, unscopedPackageName, importPath });
  }

  /**
   * Creates a new {@link ModuleSource} for package.
   */
  public static fromPackage(packageName: string, importPath?: string): ModuleSource {
    return ModuleSource.from({ packageName, importPath });
  }

  /**
   * Gets a {@link ModuleSource} updated with the provided parts.
   * If a part is set to `undefined`, the current value is used.
   * If a part is set to `null`, the part will be removed in the result.
   * @returns This object if there were no changes; otherwise, a new object updated with the provided parts.
   */
  public with(parts: ModuleSourceParts</*With*/ true>): ModuleSource {
    const current: IParsedPackage = this._getOrParsePathComponents();
    const parsed: IParsedPackage = resolveModuleSourceParts(parts, current);
    if (
      parsed.scopeName === current.scopeName &&
      parsed.unscopedPackageName === current.unscopedPackageName &&
      parsed.importPath === current.importPath
    ) {
      return this;
    } else {
      const source: ModuleSource = new ModuleSource(
        formatModuleSource(parsed.scopeName, parsed.unscopedPackageName, parsed.importPath)
      );
      source._pathComponents = parsed;
      return source;
    }
  }

  /**
   * Tests whether two {@link ModuleSource} values are equivalent.
   */
  public static equals(left: ModuleSource | undefined, right: ModuleSource | undefined): boolean {
    if (left === undefined || right === undefined) {
      return left === right;
    } else {
      return left.packageName === right.packageName && left.importPath === right.importPath;
    }
  }

  /**
   * Tests whether this object is equivalent to `other`.
   */
  public equals(other: ModuleSource): boolean {
    return ModuleSource.equals(this, other);
  }

  public toString(): string {
    return `${this.escapedPath}!`;
  }

  private _getOrParsePathComponents(): IParsedPackage {
    if (!this._pathComponents) {
      const path: string = this.path;
      const parsed: IParsedPackage | null = tryParsePackageName(path);
      if (
        parsed &&
        !StringChecks.explainIfInvalidPackageName(
          formatPackageName(parsed.scopeName, parsed.unscopedPackageName)
        )
      ) {
        this._pathComponents = parsed;
      } else {
        this._pathComponents = {
          scopeName: undefined,
          unscopedPackageName: '',
          importPath: path
        };
      }
    }
    return this._pathComponents;
  }
}

class ParsedModuleSource extends ModuleSource {
  public constructor(text: string, userEscaped?: boolean) {
    super(text, userEscaped);
    try {
      setPrototypeOf?.(this, ModuleSource.prototype);
    } catch {
      // ignored
    }
  }
}

// matches the following:
//   'foo'            -> ["foo", undefined, "foo", undefined]
//   'foo/bar'        -> ["foo/bar", undefined, "foo", "bar"]
//   '@scope/foo'     -> ["@scope/foo", "scope", "foo", undefined]
//   '@scope/foo/bar' -> ["@scope/foo/bar", "scope", "foo", "bar"]
// does not match:
//   '/'
//   '@/'
//   '@scope/'
// capture groups:
//   1. The scope name (including the leading '@')
//   2. The unscoped package name
//   3. The package-relative import path
const packageNameRegExp: RegExp = /^(?:(@[^/]+?)\/)?([^/]+?)(?:\/(.+))?$/;

// no leading './' or '.\'
// no leading '../' or '..\'
// no leading '/' or '\'
// not '.' or '..'
const invalidImportPathRegExp: RegExp = /^(\.\.?([\\/]|$)|[\\/])/;

interface IParsedPackage {
  scopeName: string | undefined;
  unscopedPackageName: string;
  importPath: string | undefined;
}

function parsePackageName(text: string): IParsedPackage {
  const parsed: IParsedPackage | null = tryParsePackageName(text);
  if (!parsed) {
    throw new SyntaxError(`Invalid NPM package name: The package name ${JSON.stringify(text)} was invalid`);
  }

  const packageNameError: string | undefined = StringChecks.explainIfInvalidPackageName(
    formatPackageName(parsed.scopeName, parsed.unscopedPackageName)
  );
  if (packageNameError !== undefined) {
    throw new SyntaxError(packageNameError);
  }

  if (parsed.importPath && invalidImportPathRegExp.test(parsed.importPath)) {
    throw new SyntaxError(`Invalid import path ${JSON.stringify(parsed.importPath)}`);
  }

  return parsed;
}

function tryParsePackageName(text: string): IParsedPackage | null {
  const match: RegExpExecArray | null = packageNameRegExp.exec(text);
  if (!match) {
    return match;
  }
  const [, scopeName, unscopedPackageName = '', importPath]: RegExpExecArray = match;
  return { scopeName, unscopedPackageName, importPath };
}

function formatPackageName(scopeName: string | undefined, unscopedPackageName: string | undefined): string {
  let packageName: string = '';
  if (unscopedPackageName) {
    packageName = unscopedPackageName;
    if (scopeName) {
      packageName = `${scopeName}/${packageName}`;
    }
  }
  return packageName;
}

function parseModuleSource(text: string): IParsedPackage {
  if (text.slice(-1) === '!') {
    text = text.slice(0, -1);
  }
  return parsePackageName(text);
}

function formatModuleSource(
  scopeName: string | undefined,
  unscopedPackageName: string | undefined,
  importPath: string | undefined
): string {
  let path: string = formatPackageName(scopeName, unscopedPackageName);
  if (importPath) {
    path += '/' + importPath;
  }
  return path;
}

/**
 * Parts that can be used to compose or update a {@link ModuleSource}.
 *
 * @typeParam With - `true` if these parts are used by `with()` (which allows `null` for some parts), `false` if these parts are used by `from()` (which does not allow `null`).
 *
 * @beta
 */
export type ModuleSourceParts<With extends boolean> = Parts<
  With,
  | {
      /** The full name of the package. */
      packageName: string;

      /** A package relative import path. */
      importPath?: Part<With, string>;
    }
  | {
      /** The scope name for a scoped package. */
      scopeName?: Part<With, string>;

      /** The unscoped package name for a scoped package, or a package name that must not contain a scope. */
      unscopedPackageName: string;

      /** A package relative import path. */
      importPath?: Part<With, string>;
    }
  | {
      /** A package relative import path. */
      importPath: string;
    }
>;

function resolveModuleSourceParts(
  parts: ModuleSourceParts</*With*/ true>,
  fallback: IParsedPackage | undefined
): IParsedPackage {
  const { scopeName, unscopedPackageName, packageName, importPath } = parts as AllParts<typeof parts>;
  if (scopeName !== undefined) {
    // If we reach this branch, we're defining a scoped package

    // verify parts aren't incompatible
    if (packageName !== undefined) {
      throw new TypeError("Cannot specify 'packageName' with 'scopeName', use 'unscopedPackageName' instead");
    }

    // validate `scopeName`
    const newScopeName: string | undefined = scopeName ? ensureScopeName(scopeName) : undefined;
    if (newScopeName !== undefined) {
      const scopeNameError: string | undefined = StringChecks.explainIfInvalidPackageScope(newScopeName);
      if (scopeNameError !== undefined) {
        throw new SyntaxError(`Invalid NPM package name: ${scopeNameError}`);
      }
    }

    const newUnscopedPackageName: string | undefined = unscopedPackageName ?? fallback?.unscopedPackageName;
    if (newUnscopedPackageName === undefined) {
      throw new TypeError(
        "If either 'scopeName' or 'unscopedPackageName' are specified, both must be present"
      );
    }

    const unscopedPackageNameError: string | undefined = StringChecks.explainIfInvalidUnscopedPackageName(
      newUnscopedPackageName
    );
    if (unscopedPackageNameError !== undefined) {
      throw new SyntaxError(`Invalid NPM package name: ${unscopedPackageNameError}`);
    }

    if (typeof importPath === 'string' && invalidImportPathRegExp.test(importPath)) {
      throw new SyntaxError(`Invalid import path ${JSON.stringify(importPath)}`);
    }

    const newImportPath: string | undefined =
      typeof importPath === 'string'
        ? importPath
        : importPath === undefined
        ? fallback?.importPath
        : undefined;

    return {
      scopeName: newScopeName,
      unscopedPackageName: newUnscopedPackageName,
      importPath: newImportPath
    };
  } else if (unscopedPackageName !== undefined) {
    // If we reach this branch, we're either:
    // - creating an unscoped package
    // - updating the non-scoped part of a scoped package
    // - updating the package name of a non-scoped package

    // verify parts aren't incompatible
    if (packageName !== undefined) {
      throw new TypeError("Cannot specify both 'packageName' and 'unscopedPackageName'");
    }

    const unscopedPackageNameError: string | undefined = StringChecks.explainIfInvalidUnscopedPackageName(
      unscopedPackageName
    );
    if (unscopedPackageNameError !== undefined) {
      throw new SyntaxError(`Invalid NPM package name: ${unscopedPackageNameError}`);
    }

    if (typeof importPath === 'string' && invalidImportPathRegExp.test(importPath)) {
      throw new SyntaxError(`Invalid import path ${JSON.stringify(importPath)}`);
    }

    const newScopeName: string | undefined = fallback?.scopeName;

    const newImportPath: string | undefined =
      typeof importPath === 'string'
        ? importPath
        : importPath === undefined
        ? fallback?.importPath
        : undefined;

    return {
      scopeName: newScopeName,
      unscopedPackageName,
      importPath: newImportPath
    };
  } else if (packageName !== undefined) {
    // If we reach this branch, we're creating a possibly scoped or unscoped package

    // parse and verify package
    const parsed: IParsedPackage = parsePackageName(packageName);
    if (importPath !== undefined) {
      // verify parts aren't incompatible.
      if (parsed.importPath !== undefined) {
        throw new TypeError("Cannot specify 'importPath' if 'packageName' contains a path");
      }
      // validate `importPath`
      if (typeof importPath === 'string' && invalidImportPathRegExp.test(importPath)) {
        throw new SyntaxError(`Invalid import path ${JSON.stringify(importPath)}`);
      }
      parsed.importPath = importPath ?? undefined;
    } else if (parsed.importPath === undefined) {
      parsed.importPath = fallback?.importPath;
    }
    return parsed;
  } else if (importPath !== undefined) {
    // If we reach this branch, we're creating a path without a package scope

    if (fallback?.unscopedPackageName) {
      if (typeof importPath === 'string' && invalidImportPathRegExp.test(importPath)) {
        throw new SyntaxError(`Invalid import path ${JSON.stringify(importPath)}`);
      }
    }

    return {
      scopeName: fallback?.scopeName,
      unscopedPackageName: fallback?.unscopedPackageName ?? '',
      importPath: importPath ?? undefined
    };
  } else if (fallback !== undefined) {
    return fallback;
  } else {
    throw new TypeError(
      "You must specify either 'packageName', 'importPath', or both 'scopeName' and 'unscopedPackageName'"
    );
  }
}

/**
 * A value that can be resolved to a {@link ModuleSource}.
 *
 * @typeParam With - `true` if this type is used by `with()` (which allows `null` for some parts), `false` if this value is used
 * by `from()` (which does not allow `null`).
 *
 * @beta
 */
export type ModuleSourceLike<With extends boolean> = ModuleSourceParts<With> | ModuleSource | string;

type ResolvedModuleSourceLike = ModuleSource | IParsedPackage;

function resolveModuleSourceLike(
  source: ModuleSourceLike</*With*/ true>,
  fallbackSource: ModuleSource | undefined
): ResolvedModuleSourceLike {
  if (source instanceof ModuleSource) {
    return source;
  } else if (typeof source === 'string') {
    return parseModuleSource(source);
  } else {
    return resolveModuleSourceParts(source, fallbackSource);
  }
}

// #endregion ModuleSource

// #region Source

/**
 * A valid source in a {@link DeclarationReference}.
 * @beta
 */
export type Source = GlobalSource | ModuleSource;

/**
 * @beta
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Source {
  /**
   * Creates a {@link Source} from the provided parts.
   */
  export function from(parts: SourceLike</*With*/ false>): Source {
    const resolved: ResolvedSourceLike = resolveSourceLike(parts, /*fallbackSource*/ undefined);
    if (resolved instanceof GlobalSource || resolved instanceof ModuleSource) {
      return resolved;
    } else {
      const source: ModuleSource = new ModuleSource(
        formatModuleSource(resolved.scopeName, resolved.unscopedPackageName, resolved.importPath)
      );
      source['_pathComponents'] = resolved;
      return source;
    }
  }

  /**
   * Tests whether two {@link Source} objects are equivalent.
   */
  export function equals(left: Source | undefined, right: Source | undefined): boolean {
    if (left === undefined || right === undefined) {
      return left === right;
    } else if (left instanceof GlobalSource) {
      return right instanceof GlobalSource;
    } else if (right instanceof GlobalSource) {
      return left instanceof GlobalSource;
    } else {
      return ModuleSource.equals(left, right);
    }
  }
}

/**
 * Parts that can be used to compose or update a {@link Source}.
 *
 * @typeParam With - `true` if these parts are used by `with()` (which allows `null` for some parts), `false` if these parts are used by `from()` (which does not allow `null`).
 *
 * @beta
 */
export type SourceParts<With extends boolean> = ModuleSourceParts<With>;

type ResolvedSourceParts = IParsedPackage;

function resolveSourceParts(
  parts: SourceParts</*With*/ true>,
  fallbackSource: Source | undefined
): ResolvedSourceParts {
  return resolveModuleSourceParts(parts, tryCast(fallbackSource, ModuleSource));
}

/**
 * A value that can be resolved to a {@link Source}.
 *
 * @typeParam With - `true` if this type is used by `with()` (which allows `null` for some parts), `false` if this value is used
 * by `from()` (which does not allow `null`).
 *
 * @beta
 */
export type SourceLike<With extends boolean> = GlobalSource | ModuleSourceLike<With>;

type ResolvedSourceLike = Source | ResolvedSourceParts;

function resolveSourceLike(
  source: SourceLike</*With*/ true>,
  fallbackSource: Source | undefined
): ResolvedSourceLike {
  if (source instanceof ModuleSource || source instanceof GlobalSource) {
    return source;
  } else if (source === '!') {
    return GlobalSource.instance;
  } else if (typeof source === 'string') {
    return parseModuleSource(source);
  } else {
    return resolveSourceParts(source, fallbackSource);
  }
}

// #endregion Source

// #region SymbolReference

/**
 * Represents a reference to a TypeScript symbol.
 * @beta
 */
export class SymbolReference {
  public readonly componentPath: ComponentPath | undefined;
  public readonly meaning: Meaning | undefined;
  public readonly overloadIndex: number | undefined;

  public constructor(
    component: ComponentPath | undefined,
    { meaning, overloadIndex }: Pick<SymbolReferenceParts</*With*/ false>, 'meaning' | 'overloadIndex'> = {}
  ) {
    this.componentPath = component;
    this.meaning = meaning;
    this.overloadIndex = overloadIndex;
  }

  /**
   * Gets whether this reference does not contain a `componentPath`, `meaning`, or `overloadIndex`.
   */
  public get isEmpty(): boolean {
    return this.componentPath === undefined && this.overloadIndex === undefined && this.meaning === undefined;
  }

  /**
   * Creates an empty {@link SymbolReference}.
   */
  public static empty(): SymbolReference {
    return new SymbolReference(/*component*/ undefined);
  }

  /**
   * Parses a {@link SymbolReference} from the supplied text.
   */
  public static parse(text: string): SymbolReference {
    const parser: Parser = new Parser(new TextReader(text));
    const symbol: SymbolReference | undefined = parser.tryParseSymbolReference();
    if (parser.errors.length) {
      throw new SyntaxError(`Invalid SymbolReference '${text}':\n  ${parser.errors.join('\n  ')}`);
    } else if (!parser.eof || symbol === undefined) {
      throw new SyntaxError(`Invalid SymbolReference '${text}'`);
    } else {
      return symbol;
    }
  }

  /**
   * Attempts to parse a {@link SymbolReference} from the supplied text. Returns `undefined` if parsing
   * fails rather than throwing an error.
   */
  public static tryParse(text: string): SymbolReference | undefined {
    const parser: Parser = new Parser(new TextReader(text));
    const symbol: SymbolReference | undefined = parser.tryParseSymbolReference();
    if (!parser.errors.length && parser.eof) {
      return symbol;
    }
  }

  /**
   * Creates a new {@link SymbolReference} from the provided parts.
   */
  public static from(parts: SymbolReferenceLike</*With*/ false> | undefined): SymbolReference {
    const resolved: ResolvedSymbolReferenceLike | undefined = resolveSymbolReferenceLike(
      parts,
      /*fallbackSymbol*/ undefined
    );
    if (resolved === undefined) {
      return new SymbolReference(/*component*/ undefined);
    } else if (typeof resolved === 'string') {
      return SymbolReference.parse(resolved);
    } else if (resolved instanceof SymbolReference) {
      return resolved;
    } else {
      const { componentPath, meaning, overloadIndex } = resolved;
      return new SymbolReference(
        componentPath === undefined ? undefined : ComponentPath.from(componentPath),
        { meaning, overloadIndex }
      );
    }
  }

  /**
   * Returns a {@link SymbolReference} updated with the provided parts.
   * If a part is set to `undefined`, the current value is used.
   * If a part is set to `null`, the part will be removed in the result.
   * @returns This object if there were no changes; otherwise, a new object updated with the provided parts.
   */
  public with(parts: SymbolReferenceParts</*With*/ true>): SymbolReference {
    const { componentPath, meaning, overloadIndex } = resolveSymbolReferenceParts(
      parts,
      this.componentPath,
      this.meaning,
      this.overloadIndex
    );
    const resolvedComponentPath: ComponentPath | undefined =
      componentPath === undefined ? undefined : ComponentPath.from(componentPath);
    if (
      ComponentPath.equals(this.componentPath, resolvedComponentPath) &&
      this.meaning === meaning &&
      this.overloadIndex === overloadIndex
    ) {
      return this;
    } else {
      return new SymbolReference(resolvedComponentPath, { meaning, overloadIndex });
    }
  }

  /**
   * Gets a {@link SymbolReference} updated with the provided component path.
   *
   * An alias for `symbol.with({ componentPath: componentPath ?? null })`.
   *
   * @returns This object if there were no changes; otherwise, a new object updated with the provided component path.
   */
  public withComponentPath(componentPath: ComponentPath | undefined): SymbolReference {
    return this.with({ componentPath: componentPath ?? null });
  }

  /**
   * Gets a {@link SymbolReference} updated with the provided meaning.
   *
   * An alias for `symbol.with({ meaning: meaning ?? null })`.
   *
   * @returns This object if there were no changes; otherwise, a new object updated with the provided meaning.
   */
  public withMeaning(meaning: Meaning | undefined): SymbolReference {
    return this.with({ meaning: meaning ?? null });
  }

  /**
   * Gets a {@link SymbolReference} updated with the provided overload index.
   *
   * An alias for `symbol.with({ overloadIndex: overloadIndex ?? null })`.
   *
   * @returns This object if there were no changes; otherwise, a new object updated with the provided overload index.
   */
  public withOverloadIndex(overloadIndex: number | undefined): SymbolReference {
    return this.with({ overloadIndex: overloadIndex ?? null });
  }

  /**
   * Combines this {@link SymbolReference} with the provided {@link Source} to create a {@link DeclarationReference}.
   *
   * An alias for `symbol.toDeclarationReference({ source })`.
   */
  public withSource(source: Source | undefined): DeclarationReference {
    return this.toDeclarationReference({ source });
  }

  /**
   * Creates a new {@link SymbolReference} that navigates from this {@link SymbolReference} to the provided {@link Component}.
   */
  public addNavigationStep(
    navigation: Navigation,
    component: ComponentLike</*With*/ false>
  ): SymbolReference {
    if (!this.componentPath) {
      throw new Error('Cannot add a navigation step to an empty symbol reference.');
    }
    return new SymbolReference(this.componentPath.addNavigationStep(navigation, component));
  }

  /**
   * Tests whether two {@link SymbolReference} values are equivalent.
   */
  public static equals(left: SymbolReference | undefined, right: SymbolReference | undefined): boolean {
    if (left === undefined || right === undefined) {
      return left === right;
    } else {
      return (
        ComponentPath.equals(left.componentPath, right.componentPath) &&
        left.meaning === right.meaning &&
        left.overloadIndex === right.overloadIndex
      );
    }
  }

  /**
   * Tests whether this object is equivalent to `other`.
   */
  public equals(other: SymbolReference): boolean {
    return SymbolReference.equals(this, other);
  }

  /**
   * Combines this {@link SymbolReference} with the provided parts to create a {@link DeclarationReference}.
   */
  public toDeclarationReference(
    parts?: DeclarationReferenceSourceParts</*With*/ false> &
      DeclarationReferenceNavigationParts</*With*/ false>
  ): DeclarationReference {
    return DeclarationReference.from({ ...parts, symbol: this });
  }

  public toString(): string {
    let result: string = `${this.componentPath || ''}`;
    if (this.meaning && this.overloadIndex !== undefined) {
      result += `:${this.meaning}(${this.overloadIndex})`;
    } else if (this.meaning) {
      result += `:${this.meaning}`;
    } else if (this.overloadIndex !== undefined) {
      result += `:${this.overloadIndex}`;
    }
    return result;
  }

  /**
   * Creates an array of {@link DocMemberReference} objects from this symbol.
   * @internal
   */
  public toDocMemberReferences(configuration: TSDocConfiguration): DocMemberReference[] {
    const memberReferences: DocMemberReference[] = [];
    if (this.componentPath) {
      let componentRoot: ComponentPath = this.componentPath;
      const componentPathRev: ComponentNavigation[] = [];
      while (componentRoot instanceof ComponentNavigation) {
        componentPathRev.push(componentRoot);
        componentRoot = componentRoot.parent;
      }

      const selector: DocMemberSelector | undefined =
        componentPathRev.length === 0
          ? meaningToSelector(configuration, this.meaning, undefined, this.overloadIndex)
          : undefined;

      memberReferences.push(
        componentToDocMemberReference(configuration, /*hasDot*/ false, componentRoot.component, selector)
      );

      for (let i: number = componentPathRev.length - 1; i >= 0; i--) {
        const segment: ComponentNavigation = componentPathRev[i];

        const selector: DocMemberSelector | undefined =
          i === 0
            ? meaningToSelector(configuration, this.meaning, segment.navigation, this.overloadIndex)
            : undefined;

        memberReferences.push(
          componentToDocMemberReference(configuration, /*hasDot*/ true, segment.component, selector)
        );
      }
    }

    return memberReferences;
  }
}

/**
 * Parts used to compose or update a {@link SymbolReference}.
 *
 * @typeParam With - `true` if these parts are used by `with()` (which allows `null` for some parts), `false` if these parts are used by `from()` (which does not allow `null`).
 *
 * @beta
 */
export type SymbolReferenceParts<With extends boolean> = Parts<
  With,
  {
    /** The component path for the symbol */
    componentPath?: Part<With, ComponentPathLike<With>>;

    /** The meaning of the symbol */
    meaning?: Part<With, Meaning>;

    /** The overload index of the symbol */
    overloadIndex?: Part<With, number>;
  }
>;

function resolveSymbolReferenceParts(
  parts: SymbolReferenceParts</*With*/ true>,
  fallbackComponentPath: ComponentPath | undefined,
  fallbackMeaning: Meaning | undefined,
  fallbackOverloadIndex: number | undefined
): SymbolReferenceParts</*With*/ false> {
  const { componentPath, meaning = fallbackMeaning, overloadIndex = fallbackOverloadIndex } = parts;
  return {
    componentPath:
      componentPath === null
        ? undefined
        : componentPath === undefined
        ? fallbackComponentPath
        : resolveComponentPathLike(componentPath, fallbackComponentPath),
    meaning: meaning ?? undefined,
    overloadIndex: overloadIndex ?? undefined
  };
}

/**
 * A value that can be resolved to a {@link SymbolReference}.
 *
 * @typeParam With - `true` if this type is used by `with()` (which allows `null` for some parts), `false` if this value is used
 * by `from()` (which does not allow `null`).
 *
 * @beta
 */
export type SymbolReferenceLike<With extends boolean> = string | SymbolReference | SymbolReferenceParts<With>;

type ResolvedSymbolReferenceLike = string | SymbolReference | SymbolReferenceParts</*With*/ false>;

function resolveSymbolReferenceLike(
  symbol: SymbolReferenceLike</*With*/ true> | undefined,
  fallbackSymbol: SymbolReference | undefined
): ResolvedSymbolReferenceLike | undefined {
  if (symbol === undefined || symbol instanceof SymbolReference || typeof symbol === 'string') {
    return symbol;
  } else {
    const resolved: SymbolReferenceParts</*With*/ false> = resolveSymbolReferenceParts(
      symbol,
      fallbackSymbol?.componentPath,
      fallbackSymbol?.meaning,
      fallbackSymbol?.overloadIndex
    );
    if (
      resolved.componentPath !== undefined ||
      resolved.meaning !== undefined ||
      resolved.overloadIndex !== undefined ||
      fallbackSymbol !== undefined
    ) {
      return resolved;
    }
  }
}

// #endregion SymbolReference

// #region ComponentPathBase

/**
 * Abstract base class for a part of {@link ComponentPath}.
 * @beta
 */
export abstract class ComponentPathBase {
  public abstract readonly kind: string;
  public readonly component: Component;

  private declare _: never; // NOTE: This makes a ComponentPath compare nominally rather than structurally which removes its properties from completions in `ComponentPath.from({ ... })`

  public constructor(component: Component) {
    this.component = component;
  }

  /**
   * Gets the {@link ComponentRoot} at the root of the component path.
   */
  public abstract get root(): ComponentRoot;

  /**
   * Creates a new {@link ComponentNavigation} step that navigates from this {@link ComponentPath} to the provided component.
   */
  public addNavigationStep(
    this: ComponentPath,
    navigation: Navigation,
    component: ComponentLike</*With*/ false>
  ): ComponentNavigation {
    // tslint:disable-next-line:no-use-before-declare
    return new ComponentNavigation(this, navigation, Component.from(component));
  }

  /**
   * Combines this {@link ComponentPath} with a {@link Meaning} to create a new {@link SymbolReference}.
   *
   * An alias for `componentPath.toSymbolReference({ meaning })`.
   */
  public withMeaning(this: ComponentPath, meaning: Meaning | undefined): SymbolReference {
    return this.toSymbolReference({ meaning });
  }

  /**
   * Combines this {@link ComponentPath} with an overload index to create a new {@link SymbolReference}.
   *
   * An alias for `componentPath.toSymbolReference({ overloadIndex })`.
   */
  public withOverloadIndex(this: ComponentPath, overloadIndex: number | undefined): SymbolReference {
    return this.toSymbolReference({ overloadIndex });
  }

  /**
   * Combines this {@link ComponentPath} with a {@link Source} to create a new {@link DeclarationReference}.
   *
   * An alias for `componentPath.toDeclarationReference({ source })`.
   */
  public withSource(this: ComponentPath, source: Source | undefined): DeclarationReference {
    return this.toDeclarationReference({ source });
  }

  /**
   * Combines this {@link ComponentPath} with the provided parts to create a new {@link SymbolReference}.
   */
  public toSymbolReference(
    this: ComponentPath,
    parts?: Omit<SymbolReferenceParts</*With*/ false>, 'componentPath' | 'component'>
  ): SymbolReference {
    return SymbolReference.from({ ...parts, componentPath: this });
  }

  /**
   * Combines this {@link ComponentPath} with the provided parts to create a new {@link DeclarationReference}.
   */
  public toDeclarationReference(
    this: ComponentPath,
    parts?: DeclarationReferenceSourceParts</*With*/ false> &
      DeclarationReferenceNavigationParts</*With*/ false> &
      Omit<SymbolReferenceParts</*With*/ false>, 'componentPath' | 'component'>
  ): DeclarationReference {
    return DeclarationReference.from({ ...parts, componentPath: this });
  }

  /**
   * Starting with this path segment, yields each parent path segment.
   */
  public *ancestors(this: ComponentPath, includeSelf?: boolean): IterableIterator<ComponentPath> {
    let ancestor: ComponentPath | undefined = this;
    while (ancestor) {
      if (!includeSelf) {
        includeSelf = true;
      } else {
        yield ancestor;
      }
      ancestor = ancestor instanceof ComponentNavigation ? ancestor.parent : undefined;
    }
  }

  public abstract toString(): string;
}

// #endregion ComponentPathBase

// #region ComponentRoot

/**
 * Represents the root of a {@link ComponentPath}.
 * @beta
 */
export class ComponentRoot extends ComponentPathBase {
  public readonly kind: 'component-root' = 'component-root';

  /**
   * Gets the {@link ComponentRoot} at the root of the component path.
   */
  public get root(): ComponentRoot {
    return this;
  }

  /**
   * Creates a new {@link ComponentRoot} from the provided parts.
   */
  public static from(parts: ComponentRootLike</*With*/ false>): ComponentRoot {
    const resolved: ResolvedComponentRootLike = resolveComponentRootLike(
      parts,
      /*fallbackComponent*/ undefined
    );
    if (resolved instanceof ComponentRoot) {
      return resolved;
    } else {
      const { component } = resolved;
      return new ComponentRoot(Component.from(component));
    }
  }

  /**
   * Returns a {@link ComponentRoot} updated with the provided parts.
   * If a part is set to `undefined`, the current value is used.
   * @returns This object if there were no changes; otherwise, a new object updated with the provided parts.
   */
  public with(parts: ComponentRootParts</*With*/ true>): ComponentRoot {
    const { component } = resolveComponentRootParts(parts, this.component);
    const resolvedComponent: Component = Component.from(component);
    if (Component.equals(this.component, resolvedComponent)) {
      return this;
    } else {
      return new ComponentRoot(resolvedComponent);
    }
  }

  /**
   * Tests whether two {@link ComponentRoot} values are equivalent.
   */
  public static equals(left: ComponentRoot | undefined, right: ComponentRoot | undefined): boolean {
    if (left === undefined || right === undefined) {
      return left === right;
    } else {
      return Component.equals(left.component, right.component);
    }
  }

  /**
   * Tests whether this object is equivalent to `other`.
   */
  public equals(other: ComponentRoot): boolean {
    return ComponentRoot.equals(this, other);
  }

  /**
   * Returns a {@link ComponentRoot} updated with the provided component.
   * If a part is set to `undefined`, the current value is used.
   *
   * An alias for `componentRoot.with({ component })`.
   *
   * @returns This object if there were no changes; otherwise, a new object updated with the provided component.
   */
  public withComponent(component: ComponentLike</*With*/ false>): ComponentRoot {
    return this.with({ component });
  }

  public toString(): string {
    return this.component.toString();
  }
}

/**
 * Parts used to compose or update a {@link ComponentRoot}.
 *
 * @typeParam With - `true` if these parts are used by `with()` (which allows `null` for some parts), `false` if these parts are used by `from()` (which does not allow `null`).
 *
 * @beta
 */
export type ComponentRootParts<With extends boolean> = Parts<
  With,
  {
    /** The component for the {@link ComponentRoot} */
    component: ComponentLike<With>;
  }
>;

function resolveComponentRootParts(
  parts: ComponentRootParts</*With*/ true>,
  fallbackComponent: Component | undefined
): ComponentRootParts</*With*/ false> {
  const { component = fallbackComponent } = parts;
  if (component === undefined) {
    throw new TypeError("The property 'component' is required.");
  }
  return {
    component: resolveComponentLike(component, fallbackComponent)
  };
}

/**
 * A value that can be resolved to a {@link ComponentRoot}.
 *
 * @typeParam With - `true` if this type is used by `with()` (which allows `null` for some parts), `false` if this value is used
 * by `from()` (which does not allow `null`).
 *
 * @beta
 */
export type ComponentRootLike<With extends boolean> =
  | ComponentRoot
  | ComponentRootParts<With>
  | ComponentLike<With>;

type ResolvedComponentRootLike = ComponentRoot | ComponentRootParts</*With*/ false>;

function resolveComponentRootLike(
  componentRoot: ComponentRootLike</*With*/ true>,
  fallbackComponent: Component | undefined
): ResolvedComponentRootLike {
  if (componentRoot instanceof ComponentRoot) {
    return componentRoot;
  } else if (
    componentRoot instanceof ComponentString ||
    componentRoot instanceof ComponentReference ||
    componentRoot instanceof DeclarationReference ||
    typeof componentRoot === 'string'
  ) {
    return resolveComponentRootParts({ component: componentRoot }, fallbackComponent);
  }
  const { component, text, reference } = componentRoot as AllParts<typeof componentRoot>;
  if (component !== undefined) {
    if (text !== undefined) {
      throw new TypeError(`Cannot specify both 'component' and 'text'`);
    } else if (reference !== undefined) {
      throw new TypeError(`Cannot specify both 'component' and 'reference'`);
    }
    return resolveComponentRootParts({ component }, fallbackComponent);
  } else if (text !== undefined || reference !== undefined) {
    return resolveComponentRootParts({ component: { text, reference } }, fallbackComponent);
  } else {
    return resolveComponentRootParts({}, fallbackComponent);
  }
}

// #endregion ComponentRoot

// #region ComponentNavigation

/**
 * Represents a navigation step in a {@link ComponentPath}.
 * @beta
 */
export class ComponentNavigation extends ComponentPathBase {
  public readonly kind: 'component-navigation' = 'component-navigation';
  public readonly parent: ComponentPath;
  public readonly navigation: Navigation;

  public constructor(parent: ComponentPath, navigation: Navigation, component: Component) {
    super(component);
    this.parent = parent;
    this.navigation = navigation;
  }

  /**
   * Gets the {@link ComponentRoot} at the root of the component path.
   */
  public get root(): ComponentRoot {
    let parent: ComponentPath = this.parent;
    while (!(parent instanceof ComponentRoot)) {
      parent = parent.parent;
    }
    return parent;
  }

  /**
   * Creates a new {@link ComponentNavigation} from the provided parts.
   */
  public static from(parts: ComponentNavigationLike</*With*/ false>): ComponentNavigation {
    const resolved: ResolvedComponentNavigationLike = resolveComponentNavigationLike(
      parts,
      /*fallbackParent*/ undefined,
      /*fallbackNavigation*/ undefined,
      /*fallbackComponent*/ undefined
    );
    if (resolved instanceof ComponentNavigation) {
      return resolved;
    } else {
      const { parent, navigation, component } = resolved;
      return new ComponentNavigation(ComponentPath.from(parent), navigation, Component.from(component));
    }
  }

  /**
   * Returns a {@link ComponentNavigation} updated with the provided parts.
   * If a part is set to `undefined`, the current value is used.
   * @returns This object if there were no changes; otherwise, a new object updated with the provided parts.
   */
  public with(parts: ComponentNavigationParts</*With*/ true>): ComponentNavigation {
    const { parent, navigation, component } = resolveComponentNavigationParts(
      parts,
      this.parent,
      this.navigation,
      this.component
    );
    const resolvedParent: ComponentPath = ComponentPath.from(parent);
    const resolvedComponent: Component = Component.from(component);
    if (
      ComponentPath.equals(this.parent, resolvedParent) &&
      this.navigation === navigation &&
      Component.equals(this.component, resolvedComponent)
    ) {
      return this;
    } else {
      return new ComponentNavigation(resolvedParent, navigation, resolvedComponent);
    }
  }

  /**
   * Returns a {@link ComponentNavigation} updated with the provided parent.
   *
   * An alias for `componentNav.with({ parent })`.
   *
   * @returns This object if there were no changes; otherwise, a new object updated with the provided parent.
   */
  public withParent(parent: ComponentPath): ComponentNavigation {
    return this.with({ parent });
  }

  /**
   * Returns a {@link ComponentNavigation} updated with the provided navigation.
   *
   * An alias for `componentNav.with({ navigation })`.
   *
   * @returns This object if there were no changes; otherwise, a new object updated with the provided navigation.
   */
  public withNavigation(navigation: Navigation): ComponentNavigation {
    return this.with({ navigation });
  }

  /**
   * Returns a {@link ComponentNavigation} updated with the provided component.
   *
   * An alias for `componentNav.with({ component })`.
   *
   * @returns This object if there were no changes; otherwise, a new object updated with the provided component.
   */
  public withComponent(component: ComponentLike</*With*/ false>): ComponentNavigation {
    return this.with({ component });
  }

  /**
   * Tests whether two {@link ComponentNavigation} values are equivalent.
   */
  public static equals(
    left: ComponentNavigation | undefined,
    right: ComponentNavigation | undefined
  ): boolean {
    if (left === undefined || right === undefined) {
      return left === right;
    } else {
      return (
        ComponentPath.equals(left.parent, right.parent) &&
        left.navigation === right.navigation &&
        Component.equals(left.component, right.component)
      );
    }
  }

  /**
   * Tests whether this object is equivalent to `other`.
   */
  public equals(other: ComponentNavigation): boolean {
    return ComponentNavigation.equals(this, other);
  }

  public toString(): string {
    return `${this.parent}${formatNavigation(this.navigation)}${this.component}`;
  }
}

/**
 * Parts used to compose or update a {@link ComponentNavigation}.
 *
 * @typeParam With - `true` if these parts are used by `with()` (which allows `null` for some parts), `false` if these parts are used by `from()` (which does not allow `null`).
 *
 * @beta
 */
export type ComponentNavigationParts<With extends boolean> = Parts<
  With,
  {
    /** The parent {@link ComponentPath} segment for this navigation step. */
    parent: ComponentPathLike<With>;

    /** The kind of navigation for this navigation step. */
    navigation: Navigation;

    /** The component for this navigation step. */
    component: ComponentLike<With>;
  }
>;

function resolveComponentNavigationParts(
  parts: ComponentNavigationParts</*With*/ true>,
  fallbackParent: ComponentPath | undefined,
  fallbackNavigation: Navigation | undefined,
  fallbackComponent: Component | undefined
): ComponentNavigationParts</*With*/ false> {
  const {
    parent = fallbackParent,
    navigation = fallbackNavigation,
    component = fallbackComponent
  } = parts as AllParts<typeof parts>;
  if (parent === undefined) {
    throw new TypeError("The 'parent' property is required");
  }
  if (navigation === undefined) {
    throw new TypeError("The 'navigation' property is required");
  }
  if (component === undefined) {
    throw new TypeError("The 'component' property is required");
  }
  return {
    parent: resolveComponentPathLike(parent, fallbackParent),
    navigation,
    component: resolveComponentLike(component, fallbackComponent)
  };
}

/**
 * A value that can be resolved to a {@link ComponentNavigation}.
 *
 * @typeParam With - `true` if this type is used by `with()` (which allows `null` for some parts), `false` if this value is used
 * by `from()` (which does not allow `null`).
 *
 * @beta
 */
export type ComponentNavigationLike<With extends boolean> =
  | ComponentNavigation
  | ComponentNavigationParts<With>;

type ResolvedComponentNavigationLike = ComponentNavigation | ComponentNavigationParts</*With*/ false>;

function resolveComponentNavigationLike(
  value: ComponentNavigationLike</*With*/ true>,
  fallbackParent: ComponentPath | undefined,
  fallbackNavigation: Navigation | undefined,
  fallbackComponent: Component | undefined
): ResolvedComponentNavigationLike {
  if (value instanceof ComponentNavigation) {
    return value;
  } else {
    return resolveComponentNavigationParts(value, fallbackParent, fallbackNavigation, fallbackComponent);
  }
}

// #endregion ComponentNavigation

// #region ComponentPath

/**
 * The path used to traverse a root symbol to a specific declaration.
 * @beta
 */
export type ComponentPath = ComponentRoot | ComponentNavigation;

/**
 * @beta
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ComponentPath {
  /**
   * Parses a {@link SymbolReference} from the supplied text.
   */
  export function parse(text: string): ComponentPath {
    const parser: Parser = new Parser(new TextReader(text));
    const componentPath: ComponentPath = parser.parseComponentPath();
    if (parser.errors.length) {
      throw new SyntaxError(`Invalid ComponentPath '${text}':\n  ${parser.errors.join('\n  ')}`);
    } else if (!parser.eof || componentPath === undefined) {
      throw new SyntaxError(`Invalid ComponentPath '${text}'`);
    } else {
      return componentPath;
    }
  }

  /**
   * Creates a new {@link ComponentPath} from the provided parts.
   */
  export function from(parts: ComponentPathLike</*With*/ false>): ComponentPath {
    const resolved: ResolvedComponentPathLike = resolveComponentPathLike(
      parts,
      /*fallbackComponentPath*/ undefined
    );
    if (resolved instanceof ComponentRoot || resolved instanceof ComponentNavigation) {
      return resolved;
    } else if (typeof resolved === 'string') {
      return parse(resolved);
    } else if ('navigation' in resolved) {
      return ComponentNavigation.from(resolved);
    } else {
      return ComponentRoot.from(resolved);
    }
  }

  /**
   * Tests whether two {@link ComponentPath} values are equivalent.
   */
  export function equals(left: ComponentPath | undefined, right: ComponentPath | undefined): boolean {
    if (left === undefined || right === undefined) {
      return left === right;
    } else if (left instanceof ComponentRoot) {
      return right instanceof ComponentRoot && ComponentRoot.equals(left, right);
    } else {
      return right instanceof ComponentNavigation && ComponentNavigation.equals(left, right);
    }
  }
}

/**
 * Parts that can be used to compose or update a {@link ComponentPath}.
 *
 * @typeParam With - `true` if these parts are used by `with()` (which allows `null` for some parts), `false` if these parts are used by `from()` (which does not allow `null`).
 *
 * @beta
 */
export type ComponentPathParts<With extends boolean> =
  | ComponentRootParts<With>
  | ComponentNavigationParts<With>;

function resolveComponentPathParts(
  parts: ComponentPathParts</*With*/ true>,
  fallbackComponentPath: ComponentPath | undefined
): ComponentPathParts</*With*/ false> {
  const { component, navigation, parent } = parts as AllParts<typeof parts>;
  if (navigation !== undefined || parent !== undefined) {
    const fallbackComponent: ComponentNavigation | undefined = tryCast(
      fallbackComponentPath,
      ComponentNavigation
    );
    return resolveComponentNavigationParts(
      { component, navigation, parent },
      fallbackComponent?.parent,
      fallbackComponent?.navigation,
      fallbackComponent?.component
    );
  } else {
    const fallbackComponent: ComponentRoot | undefined = tryCast(fallbackComponentPath, ComponentRoot);
    return resolveComponentRootParts({ component }, fallbackComponent?.component);
  }
}

/**
 * A value that can be resolved to a {@link ComponentPath}.
 *
 * @typeParam With - `true` if this type is used by `with()` (which allows `null` for some parts), `false` if this value is used
 * by `from()` (which does not allow `null`).
 *
 * @beta
 */
export type ComponentPathLike<With extends boolean> =
  | Exclude<ComponentRootLike<With>, string>
  | ComponentNavigationLike<With>
  | string;

type ResolvedComponentPathLike =
  | ComponentPath
  | ComponentRootParts</*With*/ false>
  | ComponentNavigationParts</*With*/ false>
  | string;

function resolveComponentPathLike(
  value: ComponentPathLike</*With*/ true>,
  fallbackComponentPath: ComponentPath | undefined
): ResolvedComponentPathLike {
  if (value instanceof ComponentRoot || value instanceof ComponentNavigation) {
    return value;
  } else if (value instanceof ComponentString || value instanceof ComponentReference) {
    return resolveComponentPathParts({ component: value }, fallbackComponentPath);
  } else if (value instanceof DeclarationReference) {
    return resolveComponentPathParts({ component: { reference: value } }, fallbackComponentPath);
  } else if (typeof value === 'string') {
    return value;
  }
  const { component, navigation, parent, text, reference } = value as AllParts<typeof value>;
  if (component !== undefined || navigation !== undefined || parent !== undefined) {
    if (text !== undefined || reference !== undefined) {
      const first: string =
        component !== undefined ? 'component' : navigation !== undefined ? 'navigation' : 'parent';
      if (text !== undefined) {
        throw new TypeError(`Cannot specify both '${first}' and 'text'`);
      } else {
        throw new TypeError(`Cannot specify both '${first}' and 'reference'`);
      }
    }
    return resolveComponentPathParts({ component, navigation, parent }, fallbackComponentPath);
  } else if (text !== undefined || reference !== undefined) {
    return resolveComponentPathParts({ component: { text, reference } }, fallbackComponentPath);
  } else {
    return resolveComponentPathParts({}, fallbackComponentPath);
  }
}

// #endregion ComponentPath

// #region ComponentBase

/**
 * Abstract base class for a {@link Component}.
 * @beta
 */
export abstract class ComponentBase {
  public abstract readonly kind: string;

  private declare _: never; // NOTE: This makes a Component compare nominally rather than structurally which removes its properties from completions in `Component.from({ ... })`

  /**
   * Combines this component with the provided parts to create a new {@link Component}.
   * @param parts - The parts for the component path segment. If `undefined` or an empty object, then the
   * result is a {@link ComponentRoot}. Otherwise, the result is a {@link ComponentNavigation}.
   */
  public toComponentPath(
    this: Component,
    parts?: Omit<ComponentNavigationParts</*With*/ false>, 'component'>
  ): ComponentPath {
    return ComponentPath.from({ ...parts, component: this });
  }

  public abstract toString(): string;
}

// #endregion ComponentBase

// #region ComponentString

/**
 * A {@link Component} in a component path that refers to a property name.
 * @beta
 */
export class ComponentString extends ComponentBase {
  public readonly kind: 'component-string' = 'component-string';
  public readonly text: string;

  public constructor(text: string, userEscaped?: boolean) {
    super();
    this.text = this instanceof ParsedComponentString ? text : escapeComponentIfNeeded(text, userEscaped);
  }

  /**
   * Creates a new {@link ComponentString} from the provided parts.
   */
  public static from(parts: ComponentStringLike): ComponentString {
    if (parts instanceof ComponentString) {
      return parts;
    } else if (typeof parts === 'string') {
      return new ComponentString(parts);
    } else {
      return new ComponentString(parts.text);
    }
  }

  /**
   * Tests whether two {@link ComponentString} values are equivalent.
   */
  public static equals(left: ComponentString | undefined, right: ComponentString | undefined): boolean {
    if (left === undefined || right === undefined) {
      return left === right;
    } else {
      return left.text === right.text;
    }
  }

  /**
   * Tests whether this component is equivalent to `other`.
   */
  public equals(other: ComponentString): boolean {
    return ComponentString.equals(this, other);
  }

  public toString(): string {
    return this.text;
  }
}

class ParsedComponentString extends ComponentString {
  public constructor(text: string, userEscaped?: boolean) {
    super(text, userEscaped);
    try {
      setPrototypeOf?.(this, ComponentString.prototype);
    } catch {
      // ignored
    }
  }
}

/**
 * Parts that can be used to compose or update a {@link ComponentString}.
 *
 * @beta
 */
export type ComponentStringParts = Parts<
  /*With*/ false,
  {
    /** The text for a {@link ComponentString}. */
    text: string;
  }
>;

/**
 * A value that can be resolved to a {@link ComponentString}.
 * @beta
 */
export type ComponentStringLike = ComponentStringParts | ComponentString | string;

// #endregion ComponentString

// #region ComponentReference

/**
 * A {@link Component} in a component path that refers to a unique symbol declared on another declaration, such as `Symbol.iterator`.
 * @beta
 */
export class ComponentReference extends ComponentBase {
  public readonly kind: 'component-reference' = 'component-reference';
  public readonly reference: DeclarationReference;

  public constructor(reference: DeclarationReference) {
    super();
    this.reference = reference;
  }

  /**
   * Parses a string into a standalone {@link ComponentReference}.
   */
  public static parse(text: string): ComponentReference {
    if (isBracketed(text)) {
      return new ComponentReference(DeclarationReference.parse(text.slice(1, -1)));
    }
    throw new SyntaxError(`Invalid component reference: '${text}'`);
  }

  /**
   * Creates a new {@link ComponentReference} from the provided parts.
   */
  public static from(parts: ComponentReferenceLike</*With*/ false>): ComponentReference {
    if (parts instanceof ComponentReference) {
      return parts;
    } else if (typeof parts === 'string') {
      return ComponentReference.parse(parts);
    } else if (parts instanceof DeclarationReference) {
      return new ComponentReference(parts);
    } else {
      const { reference } = resolveComponentReferenceParts(parts, /*fallbackReference*/ undefined);
      return new ComponentReference(DeclarationReference.from(reference));
    }
  }

  /**
   * Returns a {@link ComponentReference} updated with the provided parts.
   * If a part is set to `undefined`, the current value is used.
   * @returns This object if there were no changes; otherwise, a new object updated with the provided parts.
   */
  public with(parts: ComponentReferenceParts</*With*/ true>): ComponentReference {
    const { reference } = resolveComponentReferenceParts(parts, this.reference);
    const resolvedReference: DeclarationReference = DeclarationReference.from(reference);
    if (DeclarationReference.equals(this.reference, resolvedReference)) {
      return this;
    } else {
      return new ComponentReference(resolvedReference);
    }
  }

  /**
   * Returns a {@link ComponentReference} updated with the provided reference.
   *
   * An alias for `componentRef.with({ reference })`.
   *
   * @returns This object if there were no changes; otherwise, a new object updated with the provided reference.
   */
  public withReference(reference: DeclarationReference): ComponentReference {
    return this.with({ reference });
  }

  /**
   * Tests whether two {@link ComponentReference} values are equivalent.
   */
  public static equals(left: ComponentReference | undefined, right: ComponentReference | undefined): boolean {
    if (left === undefined || right === undefined) {
      return left === right;
    } else {
      return DeclarationReference.equals(left.reference, right.reference);
    }
  }

  /**
   * Tests whether this component is equivalent to `other`.
   */
  public equals(other: ComponentReference): boolean {
    return ComponentReference.equals(this, other);
  }

  public toString(): string {
    return `[${this.reference}]`;
  }
}

/**
 * Parts that can be used to compose or update a {@link ComponentReference}.
 *
 * @typeParam With - `true` if these parts are used by `with()` (which allows `null` for some parts), `false` if these parts are used by `from()` (which does not allow `null`).
 *
 * @beta
 */
export type ComponentReferenceParts<With extends boolean> = Parts<
  With,
  {
    /** The reference for a {@link ComponentReference}. */
    reference: DeclarationReferenceLike<With>;
  }
>;

function resolveComponentReferenceParts(
  parts: ComponentReferenceParts</*With*/ true>,
  fallbackReference: DeclarationReference | undefined
): ComponentReferenceParts</*With*/ false> {
  const { reference = fallbackReference } = parts;
  const resolvedReference: ResolvedDeclarationReferenceLike | undefined = resolveDeclarationReferenceLike(
    reference,
    fallbackReference
  );
  if (resolvedReference === undefined) {
    throw new TypeError("The property 'reference' is required");
  }
  return {
    reference: resolvedReference
  };
}

/**
 * A value that can be resolved to a {@link ComponentReference}.
 *
 * @typeParam With - `true` if this type is used by `with()` (which allows `null` for some parts), `false` if this value is used
 * by `from()` (which does not allow `null`).
 *
 * @beta
 */
export type ComponentReferenceLike<With extends boolean> =
  | ComponentReference
  | ComponentReferenceParts<With>
  | DeclarationReference
  | string;

// #endregion ComponentReference

// #region Component

/**
 * A component in a {@link ComponentPath}.
 * @beta
 */
export type Component = ComponentString | ComponentReference;

/**
 * @beta
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Component {
  /**
   * Creates a new {@link Component} from the provided parts.
   */
  export function from(parts: ComponentLike</*With*/ false>): Component {
    const resolved: ResolvedComponentLike = resolveComponentLike(parts, /*fallbackComponent*/ undefined);
    if (resolved instanceof ComponentString || resolved instanceof ComponentReference) {
      return resolved;
    } else if ('text' in resolved) {
      return ComponentString.from(resolved);
    } else {
      return ComponentReference.from(resolved);
    }
  }

  /**
   * Tests whether two {@link Component} values are equivalent.
   */
  export function equals(left: Component | undefined, right: Component | undefined): boolean {
    if (left === undefined || right === undefined) {
      return left === right;
    } else if (left instanceof ComponentString) {
      return right instanceof ComponentString && ComponentString.equals(left, right);
    } else {
      return right instanceof ComponentReference && ComponentReference.equals(left, right);
    }
  }
}

function componentToDocMemberReference(
  configuration: TSDocConfiguration,
  hasDot: boolean,
  component: Component,
  selector: DocMemberSelector | undefined
): DocMemberReference {
  const memberIdentifier: DocMemberIdentifier | undefined =
    component instanceof ComponentString
      ? new DocMemberIdentifier({ configuration, identifier: component.text })
      : undefined;

  const memberSymbol: DocMemberSymbol | undefined =
    component instanceof ComponentReference
      ? new DocMemberSymbol({
          configuration,
          symbolReference: new DocDeclarationReference({
            configuration,
            declarationReference: component.reference
          })
        })
      : undefined;

  return new DocMemberReference({
    configuration,
    hasDot,
    memberIdentifier,
    memberSymbol,
    selector
  });
}

/**
 * Parts that can be used to compose a {@link Component}.
 *
 * @typeParam With - `true` if these parts are used by `with()` (which allows `null` for some parts), `false` if these parts are used by `from()` (which does not allow `null`).
 *
 * @beta
 */
export type ComponentParts<With extends boolean> = ComponentStringParts | ComponentReferenceParts<With>;

function resolveComponentParts(
  parts: ComponentParts</*With*/ true>,
  fallbackComponent: Component | undefined
): ComponentParts</*With*/ false> {
  const { text, reference } = parts as AllParts<typeof parts>;
  if (text !== undefined) {
    if (reference !== undefined) {
      throw new TypeError("Cannot specify both 'text' and 'reference'");
    }
    return { text };
  } else if (reference !== undefined) {
    return resolveComponentReferenceParts(
      { reference },
      tryCast(fallbackComponent, ComponentReference)?.reference
    );
  } else {
    if (fallbackComponent === undefined) {
      throw new TypeError("One of properties 'text' or 'reference' is required");
    }
    return fallbackComponent;
  }
}

/**
 * A value that can be resolved to a {@link Component}.
 *
 * @typeParam With - `true` if this type is used by `with()` (which allows `null` for some parts), `false` if this value is used
 * by `from()` (which does not allow `null`).
 *
 * @beta
 */
export type ComponentLike<With extends boolean> =
  | ComponentStringLike
  | Exclude<ComponentReferenceLike<With>, string>;

type ResolvedComponentLike = Component | ComponentStringParts | ComponentReferenceParts</*With*/ false>;

function resolveComponentLike(
  value: ComponentLike</*With*/ true>,
  fallbackComponent: Component | undefined
): ResolvedComponentLike {
  if (value instanceof ComponentString || value instanceof ComponentReference) {
    return value;
  } else if (value instanceof DeclarationReference) {
    return resolveComponentParts({ reference: value }, fallbackComponent);
  } else if (typeof value === 'string') {
    return resolveComponentParts({ text: value }, fallbackComponent);
  } else {
    return resolveComponentParts(value, fallbackComponent);
  }
}

// #endregion Component

// #region Navigation

/**
 * Indicates the symbol table from which to resolve the next symbol component.
 * @beta
 */
export const enum Navigation {
  Exports = '.',
  Members = '#',
  Locals = '~'
}

/**
 * @beta
 */
export type SourceNavigation = Navigation.Exports | Navigation.Locals;

function formatNavigation(navigation: Navigation | undefined): string {
  switch (navigation) {
    case Navigation.Exports:
      return '.';
    case Navigation.Members:
      return '#';
    case Navigation.Locals:
      return '~';
    default:
      return '';
  }
}

// #endregion Navigation

// #region Meaning

/**
 * @beta
 */
export const enum Meaning {
  Class = 'class', // SymbolFlags.Class
  Interface = 'interface', // SymbolFlags.Interface
  TypeAlias = 'type', // SymbolFlags.TypeAlias
  Enum = 'enum', // SymbolFlags.Enum
  Namespace = 'namespace', // SymbolFlags.Module
  Function = 'function', // SymbolFlags.Function
  Variable = 'var', // SymbolFlags.Variable
  Constructor = 'constructor', // SymbolFlags.Constructor
  Member = 'member', // SymbolFlags.ClassMember | SymbolFlags.EnumMember
  Event = 'event', //
  CallSignature = 'call', // SymbolFlags.Signature (for __call)
  ConstructSignature = 'new', // SymbolFlags.Signature (for __new)
  IndexSignature = 'index', // SymbolFlags.Signature (for __index)
  ComplexType = 'complex' // Any complex type
}

function meaningToSelector(
  configuration: TSDocConfiguration,
  meaning: Meaning | undefined,
  navigation: Navigation | undefined,
  overloadIndex: number | undefined
): DocMemberSelector | undefined {
  if (overloadIndex !== undefined) {
    return new DocMemberSelector({
      configuration,
      selector: overloadIndex.toString()
    });
  }
  switch (meaning) {
    case Meaning.Class:
    case Meaning.Interface:
    case Meaning.Namespace:
    case Meaning.TypeAlias:
    case Meaning.Function:
    case Meaning.Enum:
    case Meaning.Constructor:
      return new DocMemberSelector({
        configuration,
        selector: meaning
      });
    case Meaning.Variable:
      return new DocMemberSelector({
        configuration,
        selector: 'variable'
      });
    case Meaning.Member:
    case Meaning.Event:
      switch (navigation) {
        case Navigation.Exports:
          return new DocMemberSelector({
            configuration,
            selector: 'static'
          });
        case Navigation.Members:
          return new DocMemberSelector({
            configuration,
            selector: 'instance'
          });
      }
      break;
  }
}

// #endregion Meaning

// #region Token

const enum Token {
  None,
  EofToken,
  // Punctuator
  OpenBraceToken, // '{'
  CloseBraceToken, // '}'
  OpenParenToken, // '('
  CloseParenToken, // ')'
  OpenBracketToken, // '['
  CloseBracketToken, // ']'
  ExclamationToken, // '!'
  DotToken, // '.'
  HashToken, // '#'
  TildeToken, // '~'
  ColonToken, // ':'
  CommaToken, // ','
  AtToken, // '@'
  DecimalDigits, // '12345'
  String, // '"abc"'
  Text, // 'abc'
  ModuleSource, // 'abc/def!' (excludes '!')
  // Keywords
  ClassKeyword, // 'class'
  InterfaceKeyword, // 'interface'
  TypeKeyword, // 'type'
  EnumKeyword, // 'enum'
  NamespaceKeyword, // 'namespace'
  FunctionKeyword, // 'function'
  VarKeyword, // 'var'
  ConstructorKeyword, // 'constructor'
  MemberKeyword, // 'member'
  EventKeyword, // 'event'
  CallKeyword, // 'call'
  NewKeyword, // 'new'
  IndexKeyword, // 'index'
  ComplexKeyword // 'complex'
}

function tokenToString(token: Token): string {
  switch (token) {
    case Token.OpenBraceToken:
      return '{';
    case Token.CloseBraceToken:
      return '}';
    case Token.OpenParenToken:
      return '(';
    case Token.CloseParenToken:
      return ')';
    case Token.OpenBracketToken:
      return '[';
    case Token.CloseBracketToken:
      return ']';
    case Token.ExclamationToken:
      return '!';
    case Token.DotToken:
      return '.';
    case Token.HashToken:
      return '#';
    case Token.TildeToken:
      return '~';
    case Token.ColonToken:
      return ':';
    case Token.CommaToken:
      return ',';
    case Token.AtToken:
      return '@';
    case Token.ClassKeyword:
      return 'class';
    case Token.InterfaceKeyword:
      return 'interface';
    case Token.TypeKeyword:
      return 'type';
    case Token.EnumKeyword:
      return 'enum';
    case Token.NamespaceKeyword:
      return 'namespace';
    case Token.FunctionKeyword:
      return 'function';
    case Token.VarKeyword:
      return 'var';
    case Token.ConstructorKeyword:
      return 'constructor';
    case Token.MemberKeyword:
      return 'member';
    case Token.EventKeyword:
      return 'event';
    case Token.CallKeyword:
      return 'call';
    case Token.NewKeyword:
      return 'new';
    case Token.IndexKeyword:
      return 'index';
    case Token.ComplexKeyword:
      return 'complex';
    case Token.None:
      return '<none>';
    case Token.EofToken:
      return '<eof>';
    case Token.DecimalDigits:
      return '<decimal digits>';
    case Token.String:
      return '<string>';
    case Token.Text:
      return '<text>';
    case Token.ModuleSource:
      return '<module source>';
  }
}

// #endregion Token

// #region Scanner

interface ICharacterReader {
  readonly eof: boolean;
  mark(): number;
  rewind(marker: number): void;
  readChar(count?: number): string;
  peekChar(lookahead?: number): string;
  readFrom(marker: number): string;
}

class TextReader implements ICharacterReader {
  private _text: string;
  private _pos: number;

  public constructor(text: string) {
    this._text = text;
    this._pos = 0;
  }

  public get eof(): boolean {
    return this._pos >= this._text.length;
  }

  public mark(): number {
    return this._pos;
  }

  public rewind(marker: number): void {
    this._pos = marker;
  }

  public readChar(count: number = 1): string {
    if (count < 1) throw new RangeError('Argument out of range: count');
    let ch: string = '';
    while (count > 0) {
      if (this.eof) return '';
      ch = this._text.charAt(this._pos++);
      count--;
    }
    return ch;
  }

  public peekChar(lookahead: number = 1): string {
    if (lookahead < 1) throw new RangeError('Argument out of range: lookahead');
    const marker: number = this.mark();
    const ch: string = this.readChar(lookahead);
    this.rewind(marker);
    return ch;
  }

  public readFrom(marker: number): string {
    return this._text.substring(marker, this._pos);
  }
}

class TokenReaderNormalizer implements ICharacterReader {
  private _tokenReader: TokenReader;
  private _token: DocToken | undefined;
  private _partialTokenPos: number = 0;
  private _startMarker: number;
  private _markerSizes: { [marker: number]: number | undefined } = {};

  public constructor(tokenReader: TokenReader) {
    this._tokenReader = tokenReader;
    this._startMarker = tokenReader.createMarker();
    this._token = tokenReader.peekTokenKind() === TokenKind.EndOfInput ? undefined : tokenReader.peekToken();
    if (this._token) {
      this._markerSizes[this._startMarker] = this._token.range.length;
    }
  }

  public get eof(): boolean {
    return this._token === undefined;
  }

  public mark(): number {
    const tokenMarker: number = this._tokenReader.createMarker();

    let offset: number = 0;
    for (let i: number = this._startMarker; i < tokenMarker; i++) {
      const markerSize: number = this._markerSizes[i] ?? 1;
      offset += markerSize;
    }

    offset += this._partialTokenPos;
    return offset;
  }

  public rewind(marker: number): void {
    let tokenMarker: number = this._startMarker;
    let partialTokenPos: number = 0;

    let offset: number = 0;
    while (offset < marker) {
      const markerSize: number = this._markerSizes[tokenMarker] ?? 1;
      if (offset + markerSize < marker) {
        offset += markerSize;
        tokenMarker++;
      } else {
        partialTokenPos = marker - offset;
        break;
      }
    }

    this._tokenReader.backtrackToMarker(tokenMarker);
    this._token = this._tokenReader.peekToken();
    this._partialTokenPos = partialTokenPos;
  }

  public readChar(count: number = 1): string {
    if (count < 1) throw new RangeError('Argument out of range: count');
    let ch: string = '';
    while (count > 0) {
      if (!this._token) return '';
      if (this._partialTokenPos === this._token.range.length) {
        if (this._tokenReader.peekTokenKind() === TokenKind.EndOfInput) {
          this._token = undefined;
        } else {
          this._tokenReader.readToken();
          this._token = this._tokenReader.peekToken();
        }

        this._partialTokenPos = 0;
        if (!this._token) {
          return '';
        } else {
          const length: number = this._token.range.length;
          if (length > 1) {
            this._markerSizes[this._tokenReader.createMarker()] = length;
          }
        }
      }
      ch = this._token.toString().charAt(this._partialTokenPos++);
      count--;
    }
    return ch;
  }

  public peekChar(lookahead: number = 1): string {
    if (lookahead < 1) throw new RangeError('Argument out of range: lookahead');
    const tokenMarker: number = this._tokenReader.createMarker();
    const savedTokenReader: TokenReader = this._tokenReader;
    const savedToken: DocToken | undefined = this._token;
    const savedPartialTokenPos: number = this._partialTokenPos;
    const ch: string = this.readChar(lookahead);
    this._partialTokenPos = savedPartialTokenPos;
    this._token = savedToken;
    this._tokenReader = savedTokenReader;
    this._tokenReader.backtrackToMarker(tokenMarker);
    return ch;
  }

  public readFrom(marker: number): string {
    const currentMarker: number = this.mark();
    const savedTokenReader: TokenReader = this._tokenReader;
    this._tokenReader = savedTokenReader.clone();
    this.rewind(marker);
    let text: string = '';
    while (this.mark() < currentMarker) {
      text += this.readChar(1);
    }
    this._tokenReader = savedTokenReader;
    return text;
  }
}

class Scanner {
  private _reader: ICharacterReader;
  private _token: Token;
  private _tokenMarker: number;
  private _stringIsUnterminated: boolean;

  public constructor(reader: ICharacterReader) {
    this._reader = reader;
    this._tokenMarker = reader.mark();
    this._token = Token.None;
    this._stringIsUnterminated = false;
  }

  public get stringIsUnterminated(): boolean {
    return this._stringIsUnterminated;
  }

  public get tokenText(): string {
    return this._reader.readFrom(this._tokenMarker);
  }

  public get eof(): boolean {
    return this._reader.eof;
  }

  public token(): Token {
    return this._token;
  }

  public speculate<T>(cb: (accept: () => void) => T): T {
    const tokenMarker: number = this._tokenMarker;
    const marker: number = this._reader.mark();
    const reader: ICharacterReader = this._reader;
    const token: Token = this._token;
    const stringIsUnterminated: boolean = this._stringIsUnterminated;
    let accepted: boolean = false;
    try {
      const accept: () => void = () => {
        accepted = true;
      };
      return cb(accept);
    } finally {
      if (!accepted) {
        this._stringIsUnterminated = stringIsUnterminated;
        this._token = token;
        this._reader = reader;
        this._reader.rewind(marker);
        this._tokenMarker = tokenMarker;
      }
    }
  }

  public scan(): Token {
    if (!this.eof) {
      this._tokenMarker = this._reader.mark();
      this._stringIsUnterminated = false;
      while (!this.eof) {
        const ch: string = this._reader.readChar();
        switch (ch) {
          case '{':
            return (this._token = Token.OpenBraceToken);
          case '}':
            return (this._token = Token.CloseBraceToken);
          case '(':
            return (this._token = Token.OpenParenToken);
          case ')':
            return (this._token = Token.CloseParenToken);
          case '[':
            return (this._token = Token.OpenBracketToken);
          case ']':
            return (this._token = Token.CloseBracketToken);
          case '!':
            return (this._token = Token.ExclamationToken);
          case '.':
            return (this._token = Token.DotToken);
          case '#':
            return (this._token = Token.HashToken);
          case '~':
            return (this._token = Token.TildeToken);
          case ':':
            return (this._token = Token.ColonToken);
          case ',':
            return (this._token = Token.CommaToken);
          case '@':
            return (this._token = Token.AtToken);
          case '"':
            this.scanString();
            return (this._token = Token.String);
          default:
            this.scanText();
            return (this._token = Token.Text);
        }
      }
    }
    return (this._token = Token.EofToken);
  }

  public rescanModuleSource(): Token {
    switch (this._token) {
      case Token.ModuleSource:
      case Token.ExclamationToken:
      case Token.EofToken:
        return this._token;
    }
    return this.speculate((accept) => {
      if (!this.eof) {
        this._reader.rewind(this._tokenMarker);
        this._stringIsUnterminated = false;
        let scanned: 'string' | 'other' | 'none' = 'none';
        while (!this.eof) {
          const ch: string = this._reader.peekChar(1);
          if (ch === '!') {
            if (scanned === 'none') {
              return this._token;
            }
            accept();
            return (this._token = Token.ModuleSource);
          }
          this._reader.readChar();
          if (ch === '"') {
            if (scanned === 'other') {
              // strings not allowed after scanning any other characters
              return this._token;
            }
            scanned = 'string';
            this.scanString();
          } else {
            if (scanned === 'string') {
              // no other tokens allowed after string
              return this._token;
            }
            scanned = 'other';
            if (!isPunctuator(ch)) {
              this.scanText();
            }
          }
        }
      }
      return this._token;
    });
  }

  public rescanMeaning(): Token {
    if (this._token === Token.Text) {
      const tokenText: string = this.tokenText;
      switch (tokenText) {
        case 'class':
          return (this._token = Token.ClassKeyword);
        case 'interface':
          return (this._token = Token.InterfaceKeyword);
        case 'type':
          return (this._token = Token.TypeKeyword);
        case 'enum':
          return (this._token = Token.EnumKeyword);
        case 'namespace':
          return (this._token = Token.NamespaceKeyword);
        case 'function':
          return (this._token = Token.FunctionKeyword);
        case 'var':
          return (this._token = Token.VarKeyword);
        case 'constructor':
          return (this._token = Token.ConstructorKeyword);
        case 'member':
          return (this._token = Token.MemberKeyword);
        case 'event':
          return (this._token = Token.EventKeyword);
        case 'call':
          return (this._token = Token.CallKeyword);
        case 'new':
          return (this._token = Token.NewKeyword);
        case 'index':
          return (this._token = Token.IndexKeyword);
        case 'complex':
          return (this._token = Token.ComplexKeyword);
      }
    }
    return this._token;
  }

  public rescanDecimalDigits(): Token {
    if (this._token === Token.Text) {
      const tokenText: string = this.tokenText;
      if (/^\d+$/.test(tokenText)) {
        return (this._token = Token.DecimalDigits);
      }
    }
    return this._token;
  }

  private scanString(): void {
    while (!this.eof) {
      const ch: string = this._reader.readChar();
      switch (ch) {
        case '"':
          return;
        case '\\':
          this.scanEscapeSequence();
          break;
        default:
          if (isLineTerminator(ch)) {
            this._stringIsUnterminated = true;
            return;
          }
      }
    }
    this._stringIsUnterminated = true;
  }

  private scanEscapeSequence(): void {
    if (this.eof) {
      this._stringIsUnterminated = true;
      return;
    }

    const ch: string = this._reader.peekChar(1);

    // EscapeSequence:: CharacterEscapeSequence
    if (isCharacterEscapeSequence(ch)) {
      this._reader.readChar(1);
      return;
    }

    // EscapeSequence:: `0` [lookahead != DecimalDigit]
    if (ch === '0' && !isDecimalDigit(this._reader.peekChar(2))) {
      this._reader.readChar(1);
      return;
    }

    // EscapeSequence:: HexEscapeSequence
    if (ch === 'x' && isHexDigit(this._reader.peekChar(2)) && isHexDigit(this._reader.peekChar(3))) {
      this._reader.readChar(3);
      return;
    }

    // EscapeSequence:: UnicodeEscapeSequence
    // UnicodeEscapeSequence:: `u` Hex4Digits
    if (
      ch === 'u' &&
      isHexDigit(this._reader.peekChar(2)) &&
      isHexDigit(this._reader.peekChar(3)) &&
      isHexDigit(this._reader.peekChar(4)) &&
      isHexDigit(this._reader.peekChar(5))
    ) {
      this._reader.readChar(5);
      return;
    }

    // EscapeSequence:: UnicodeEscapeSequence
    // UnicodeEscapeSequence:: `u` `{` CodePoint `}`
    if (ch === 'u' && this._reader.peekChar(2) === '{') {
      let hexDigits: string = this._reader.peekChar(3);
      if (isHexDigit(hexDigits)) {
        for (
          let i: number = 4, ch2: string = this._reader.peekChar(i);
          ch2 !== '';
          i++, ch2 = this._reader.peekChar(i)
        ) {
          if (ch2 === '}') {
            const mv: number = parseInt(hexDigits, 16);
            if (mv <= 0x10ffff) {
              this._reader.readChar(i + 1);
              return;
            }
            break;
          }
          if (!isHexDigit(ch2)) {
            hexDigits += ch2;
            break;
          }
        }
      }
    }
    this._stringIsUnterminated = true;
  }

  private scanText(): void {
    while (!this._reader.eof) {
      const ch: string = this._reader.peekChar();
      if (isPunctuator(ch) || ch === '"') {
        return;
      }
      this._reader.readChar();
    }
  }
}

function isHexDigit(ch: string): boolean {
  switch (ch) {
    case 'a':
    case 'b':
    case 'c':
    case 'd':
    case 'e':
    case 'f':
    case 'A':
    case 'B':
    case 'C':
    case 'D':
    case 'E':
    case 'F':
      return true;
    default:
      return isDecimalDigit(ch);
  }
}

function isDecimalDigit(ch: string): boolean {
  switch (ch) {
    case '0':
    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
    case '6':
    case '7':
    case '8':
    case '9':
      return true;
    default:
      return false;
  }
}

function isCharacterEscapeSequence(ch: string): boolean {
  return isSingleEscapeCharacter(ch) || isNonEscapeCharacter(ch);
}

function isNonEscapeCharacter(ch: string): boolean {
  return !isEscapeCharacter(ch) && !isLineTerminator(ch);
}

function isEscapeCharacter(ch: string): boolean {
  switch (ch) {
    case 'x':
    case 'u':
      return true;
    default:
      return isSingleEscapeCharacter(ch) || isDecimalDigit(ch);
  }
}

function isSingleEscapeCharacter(ch: string): boolean {
  switch (ch) {
    case "'":
    case '"':
    case '\\':
    case 'b':
    case 'f':
    case 'n':
    case 'r':
    case 't':
    case 'v':
      return true;
    default:
      return false;
  }
}

function isLineTerminator(ch: string): boolean {
  switch (ch) {
    case '\r':
    case '\n':
      // TODO: <LS>, <PS>
      return true;
    default:
      return false;
  }
}

function isPunctuator(ch: string): boolean {
  switch (ch) {
    case '{':
    case '}':
    case '(':
    case ')':
    case '[':
    case ']':
    case '!':
    case '.':
    case '#':
    case '~':
    case ':':
    case ',':
    case '@':
      return true;
    default:
      return false;
  }
}

// #endregion Scanner

// #region Parser

class Parser {
  private _errors: string[];
  private _scanner: Scanner;
  private _fallback: boolean;

  public constructor(reader: ICharacterReader, fallback: boolean = false) {
    this._errors = [];
    this._fallback = fallback;
    this._scanner = new Scanner(reader);
    this._scanner.scan();
  }

  public get eof(): boolean {
    return this.token() === Token.EofToken;
  }

  public get errors(): readonly string[] {
    return this._errors;
  }

  public parseDeclarationReference(): DeclarationReference {
    let source: Source | undefined;
    let navigation: Navigation.Locals | undefined;
    if (this.optionalToken(Token.ExclamationToken)) {
      // Reference to global symbol
      source = GlobalSource.instance;
    } else if (this._scanner.rescanModuleSource() === Token.ModuleSource) {
      source = this.parseModuleSource();
      // Check for optional `~` navigation token.
      if (this.optionalToken(Token.TildeToken)) {
        navigation = Navigation.Locals;
      }
    }
    return new DeclarationReference(source, navigation, this.tryParseSymbolReference());
  }

  public parseModuleSourceString(): string {
    this._scanner.rescanModuleSource();
    return this.parseTokenString(Token.ModuleSource, 'Module source');
  }

  public parseComponentPath(): ComponentPath {
    return this.parseComponentRest(this.parseRootComponent());
  }

  public tryParseSymbolReference(): SymbolReference | undefined {
    if (this.isStartOfComponent()) {
      return this.parseSymbol();
    } else if (this.token() === Token.ColonToken) {
      return this.parseSymbolRest(new ComponentRoot(new ComponentString('', /*userEscaped*/ true)));
    }
  }

  public parseComponentString(): string {
    switch (this._scanner.token()) {
      case Token.String:
        return this.parseString();
      default:
        const text: string | undefined = this.parseComponentCharacters();
        if (text === undefined) {
          return this.fail('One or more characters expected', '');
        }
        return text;
    }
  }

  private token(): Token {
    return this._scanner.token();
  }

  private parseModuleSource(): ModuleSource | undefined {
    const source: string = this.parseModuleSourceString();
    this.expectToken(Token.ExclamationToken);
    return new ParsedModuleSource(source, /*userEscaped*/ true);
  }

  private parseSymbol(): SymbolReference {
    const component: ComponentPath = this.parseComponentPath();
    return this.parseSymbolRest(component);
  }

  private parseSymbolRest(component: ComponentPath): SymbolReference {
    let meaning: Meaning | undefined;
    let overloadIndex: number | undefined;
    if (this.optionalToken(Token.ColonToken)) {
      meaning = this.tryParseMeaning();
      overloadIndex = this.tryParseOverloadIndex(!!meaning);
    }

    return new SymbolReference(component, { meaning, overloadIndex });
  }

  private parseRootComponent(): ComponentPath {
    if (!this.isStartOfComponent()) {
      return this.fail(
        'Component expected',
        new ComponentRoot(new ComponentString('', /*userEscaped*/ true))
      );
    }

    const component: Component = this.parseComponent();
    return new ComponentRoot(component);
  }

  private parseComponentRest(component: ComponentPath): ComponentPath {
    for (;;) {
      switch (this.token()) {
        case Token.DotToken:
        case Token.HashToken:
        case Token.TildeToken:
          const navigation: Navigation = this.parseNavigation();
          const right: Component = this.parseComponent();
          component = new ComponentNavigation(component, navigation, right);
          break;
        default:
          return component;
      }
    }
  }

  private parseNavigation(): Navigation {
    switch (this._scanner.token()) {
      case Token.DotToken:
        return this._scanner.scan(), Navigation.Exports;
      case Token.HashToken:
        return this._scanner.scan(), Navigation.Members;
      case Token.TildeToken:
        return this._scanner.scan(), Navigation.Locals;
      default:
        return this.fail("Expected '.', '#', or '~'", Navigation.Exports);
    }
  }

  private tryParseMeaning(): Meaning | undefined {
    switch (this._scanner.rescanMeaning()) {
      case Token.ClassKeyword:
        return this._scanner.scan(), Meaning.Class;
      case Token.InterfaceKeyword:
        return this._scanner.scan(), Meaning.Interface;
      case Token.TypeKeyword:
        return this._scanner.scan(), Meaning.TypeAlias;
      case Token.EnumKeyword:
        return this._scanner.scan(), Meaning.Enum;
      case Token.NamespaceKeyword:
        return this._scanner.scan(), Meaning.Namespace;
      case Token.FunctionKeyword:
        return this._scanner.scan(), Meaning.Function;
      case Token.VarKeyword:
        return this._scanner.scan(), Meaning.Variable;
      case Token.ConstructorKeyword:
        return this._scanner.scan(), Meaning.Constructor;
      case Token.MemberKeyword:
        return this._scanner.scan(), Meaning.Member;
      case Token.EventKeyword:
        return this._scanner.scan(), Meaning.Event;
      case Token.CallKeyword:
        return this._scanner.scan(), Meaning.CallSignature;
      case Token.NewKeyword:
        return this._scanner.scan(), Meaning.ConstructSignature;
      case Token.IndexKeyword:
        return this._scanner.scan(), Meaning.IndexSignature;
      case Token.ComplexKeyword:
        return this._scanner.scan(), Meaning.ComplexType;
      default:
        return undefined;
    }
  }

  private tryParseOverloadIndex(hasMeaning: boolean): number | undefined {
    if (this.optionalToken(Token.OpenParenToken)) {
      const overloadIndex: number = this.parseDecimalDigits();
      this.expectToken(Token.CloseParenToken);
      return overloadIndex;
    } else if (!hasMeaning) {
      return this.parseDecimalDigits();
    }
    return undefined;
  }

  private parseDecimalDigits(): number {
    switch (this._scanner.rescanDecimalDigits()) {
      case Token.DecimalDigits:
        const value: number = +this._scanner.tokenText;
        this._scanner.scan();
        return value;
      default:
        return this.fail('Decimal digit expected', 0);
    }
  }

  private isStartOfComponent(): boolean {
    switch (this.token()) {
      case Token.Text:
      case Token.String:
      case Token.OpenBracketToken:
        return true;
      default:
        return false;
    }
  }

  private parseComponentCharacters(): string | undefined {
    let text: string | undefined;
    for (;;) {
      switch (this._scanner.token()) {
        case Token.Text:
          if (text === undefined) {
            text = '';
          }
          text += this.parseText();
          break;
        default:
          return text;
      }
    }
  }

  private parseTokenString(token: Token, tokenString?: string): string {
    if (this._scanner.token() === token) {
      const text: string = this._scanner.tokenText;
      const stringIsUnterminated: boolean = this._scanner.stringIsUnterminated;
      this._scanner.scan();
      if (stringIsUnterminated) {
        return this.fail(`${tokenString || tokenToString(token)} is unterminated`, text);
      }
      return text;
    }
    return this.fail(`${tokenString || tokenToString(token)} expected`, '');
  }

  private parseText(): string {
    const text: string = this.parseTokenString(Token.Text, 'Text');
    if (this._fallback && StringChecks.isSystemSelector(text)) {
      return this.fail('No system selectors in fallback parsing', text);
    }
    return text;
  }

  private parseString(): string {
    return this.parseTokenString(Token.String, 'String');
  }

  private parseComponent(): Component {
    switch (this._scanner.token()) {
      case Token.OpenBracketToken:
        return this.parseBracketedComponent();
      default:
        return new ParsedComponentString(this.parseComponentString(), /*userEscaped*/ true);
    }
  }

  private parseBracketedComponent(): ComponentReference {
    this.expectToken(Token.OpenBracketToken);
    const reference: DeclarationReference = this.parseDeclarationReference();
    this.expectToken(Token.CloseBracketToken);
    const component: ComponentReference = new ComponentReference(reference);
    if (this._fallback && reference.isEmpty) {
      return this.fail('No empty brackets in fallback parsing', component);
    }
    return component;
  }

  private optionalToken(token: Token): boolean {
    if (this._scanner.token() === token) {
      this._scanner.scan();
      return true;
    }
    return false;
  }

  private expectToken(token: Token, message?: string): void {
    if (this._scanner.token() !== token) {
      const expected: string = tokenToString(token);
      const actual: string = tokenToString(this._scanner.token());
      return this.fail(message || `Expected token '${expected}', received '${actual}' instead.`, undefined);
    }
    this._scanner.scan();
  }

  private fail<T>(message: string, fallback: T): T {
    this._errors.push(message);
    return fallback;
  }
}

// #endregion Parser

function escapeComponentIfNeeded(text: string, userEscaped?: boolean): string {
  if (userEscaped) {
    if (!DeclarationReference.isWellFormedComponentString(text)) {
      throw new SyntaxError(`Invalid Component '${text}'`);
    }
    return text;
  }
  return DeclarationReference.escapeComponentString(text);
}

function escapeModuleSourceIfNeeded(text: string, parsed: boolean, userEscaped: boolean): string {
  if (userEscaped) {
    if (!parsed && !DeclarationReference.isWellFormedModuleSourceString(text)) {
      throw new SyntaxError(`Invalid Module source '${text}'`);
    }
    return text;
  }
  return DeclarationReference.escapeModuleSourceString(text);
}

function isBracketed(value: string): boolean {
  return value.length > 2 && value.charAt(0) === '[' && value.charAt(value.length - 1) === ']';
}

function ensureScopeName(scopeName: string): string {
  return scopeName.length && scopeName.charAt(0) !== '@' ? `@${scopeName}` : scopeName;
}

interface ObjectConstructorWithSetPrototypeOf extends ObjectConstructor {
  setPrototypeOf?(obj: object, proto: object | null): object;
}

const setPrototypeOf:
  | ((obj: object, proto: object | null) => object)
  | undefined = (Object as ObjectConstructorWithSetPrototypeOf).setPrototypeOf;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function tryCast<T>(value: unknown, type: new (...args: any[]) => T): T | undefined {
  return value instanceof type ? value : undefined;
}

/**
 * Describes the parts that can be used in a `from()` or `with()` call.
 *
 * In a `with()` call, all optional parts can also be `null`, and all non-optional parts become optional.
 *
 * @typeParam With - If `true, indicates these parts are used in a `with()` call.
 *
 * @beta
 */
export type Parts<With extends boolean, T> = [With] extends [false]
  ? T
  : T extends unknown // NOTE: Distributes over `T`
  ? Partial<T>
  : never;

/**
 * If a part can be removed via a `with()` call, marks that part with `| null`
 *
 * @typeParam With - If `true, indicates this part is used in a `with()` call.
 *
 * @beta
 */
export type Part<With extends boolean, T> = [With] extends [false] ? T : T | null;

/**
 * Distributes over `T` to get all possible keys of `T`.
 */
type AllKeysOf<T> = T extends unknown ? keyof T : never;

/**
 * Distributes over `T` to get all possible values of `T` with the key `P`.
 */
type AllValuesOf<T, P> = T extends unknown ? (P extends keyof T ? T[P] : undefined) : never;

/**
 * Distributes over `T` to get all possible properties of every `T`.
 */
type AllParts<T> = {
  [P in AllKeysOf<T>]: AllValuesOf<T, P>;
};
