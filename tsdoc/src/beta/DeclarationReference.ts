// tslint:disable:no-use-before-declare

// NOTE: See DeclarationReference.grammarkdown for information on the underlying grammar.

/**
 * Represents a reference to a declaration.
 * @beta
 */
export class DeclarationReference {
  private _source: ModuleSource | GlobalSource | undefined;
  private _navigation: Navigation.Locals | Navigation.Exports | undefined;
  private _symbol: SymbolReference | undefined;

  constructor(source?: ModuleSource | GlobalSource, navigation?: Navigation.Locals | Navigation.Exports,
    symbol?: SymbolReference) {
    this._source = source;
    this._navigation = navigation;
    this._symbol = symbol;
  }

  public get source(): ModuleSource | GlobalSource | undefined {
    return this._source;
  }

  public get navigation(): Navigation.Locals | Navigation.Exports | undefined {
    if (!this._source || !this._symbol) {
      return undefined;
    }
    if (this._source === GlobalSource.instance) {
      return Navigation.Locals;
    }
    if (this._navigation === undefined) {
      return Navigation.Exports;
    }
    return this._navigation;
  }

  public get symbol(): SymbolReference | undefined {
    return this._symbol;
  }

  public get isEmpty(): boolean {
    return this.source === undefined
      && this.symbol === undefined;
  }

  public static parse(text: string): DeclarationReference {
    const parser: Parser = new Parser(text);
    const reference: DeclarationReference = parser.parseDeclarationReference();
    if (!parser.eof) {
      throw new SyntaxError(`Invalid DeclarationReference '${text}'`);
    }
    return reference;
  }

  /**
   * Escapes a string for use as a symbol navigation component. If the string contains `!.#~:,"{}()` or starts with
   * `[`, it is enclosed in quotes.
   */
  public static escapeComponentString(text: string): string {
    if (text.length === 0) {
      return '""';
    }
    const ch: string = text.charAt(0);
    if (ch === '"' || ch === '[' || !this.isWellFormedComponentString(text)) {
      return JSON.stringify(text);
    }
    return text;
  }

  /**
   * Unescapes a string used as a symbol navigation component.
   */
  public static unescapeComponentString(text: string): string {
    if (text.length > 2 && text.charAt(0) === '"' && text.charAt(text.length - 1) === '"') {
      try {
        return JSON.parse(text);
      } catch {
        throw new SyntaxError(`Invalid Component '${text}'`);
      }
    }
    if (!this.isWellFormedComponentString(text)) {
      throw new SyntaxError(`Invalid Component '${text}'`);
    }
    return text;
  }

  /**
   * Determines whether the provided string is a well-formed symbol navigation component string.
   */
  public static isWellFormedComponentString(text: string): boolean {
    try {
      const parser: Parser = new Parser(text);
      parser.parseComponent();
      return parser.eof;
    } catch {
      return false;
    }
  }

  public static empty(): DeclarationReference {
    return new DeclarationReference();
  }

  public static package(packageName: string, importPath?: string): DeclarationReference {
    return new DeclarationReference(ModuleSource.fromPackage(packageName, importPath));
  }

  public static module(path: string, userEscaped?: boolean): DeclarationReference {
    return new DeclarationReference(new ModuleSource(path, userEscaped));
  }

  public static global(): DeclarationReference {
    return new DeclarationReference(GlobalSource.instance);
  }

  public static from(base: DeclarationReference | undefined): DeclarationReference {
    return base || this.empty();
  }

  public withSource(source: ModuleSource | GlobalSource | undefined): DeclarationReference {
    return this._source === source ? this : new DeclarationReference(source, this._navigation, this._symbol);
  }

  public withNavigation(navigation: Navigation.Locals | Navigation.Exports | undefined): DeclarationReference {
    return this._navigation === navigation ? this : new DeclarationReference(this._source, navigation, this._symbol);
  }

  public withSymbol(symbol: SymbolReference | undefined): DeclarationReference {
    return this._symbol === symbol ? this : new DeclarationReference(this._source, this._navigation, symbol);
  }

  public withComponent(component: Component): DeclarationReference {
    return this.withSymbol(this.symbol ? this.symbol.withComponent(component) : new SymbolReference(component));
  }

  public withMeaning(meaning: Meaning | undefined): DeclarationReference {
    if (!this.symbol) {
      if (meaning === undefined) {
        return this;
      }
      return this.withSymbol(SymbolReference.empty().withMeaning(meaning));
    }
    return this.withSymbol(this.symbol.withMeaning(meaning));
  }

  public withOverloadIndex(overloadIndex: number | undefined): DeclarationReference {
    if (!this.symbol) {
      if (overloadIndex === undefined) {
        return this;
      }
      return this.withSymbol(SymbolReference.empty().withOverloadIndex(overloadIndex));
    }
    return this.withSymbol(this.symbol.withOverloadIndex(overloadIndex));
  }

  public addNavigationStep(navigation: Navigation, text: string, userEscaped?: boolean): DeclarationReference {
    if (this.symbol) {
      return this.withSymbol(this.symbol.addNavigationStep(navigation, text, userEscaped));
    }
    if (navigation === Navigation.Members) {
      navigation = Navigation.Exports;
    }
    return new DeclarationReference(this.source, navigation, new SymbolReference(new RootComponent(text, userEscaped)));
  }

  public toString(): string {
    const navigation: string = this._source instanceof ModuleSource
      && this._symbol
      && this.navigation === Navigation.Locals ? '~' : '';
    return `${this.source || ''}${navigation}${this.symbol || ''}`;
  }
}

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
 * Represents a module.
 * @beta
 */
export class ModuleSource {
  public readonly path: string;

  private _pathComponents: { packageName: string, importPath: string } | undefined;

  constructor(path: string, userEscaped: boolean = true) {
    this.path = escapeIfNeeded(path, userEscaped);
  }

  public get packageName(): string {
    return this._parsePathComponents().packageName;
  }

  public get importPath(): string {
    return this._parsePathComponents().importPath;
  }

  public static fromPackage(packageName: string, importPath?: string): ModuleSource {
    if (!isValidPackageName(packageName)) {
      throw new SyntaxError(`Invalid package name '${packageName}'`);
    }

    let path: string = packageName;
    if (importPath) {
      if (invalidImportPathRegExp.test(importPath)) {
        throw new SyntaxError(`Invalid import path '${importPath}`);
      }
      path += '/' + importPath;
    }

    const source: ModuleSource = new ModuleSource(path);
    source._pathComponents = { packageName, importPath: importPath || '' };
    return source;
  }

  public toString(): string {
    return `${this.path}!`;
  }

  private _parsePathComponents(): { packageName: string, importPath: string } {
    if (!this._pathComponents) {
      const path: string = DeclarationReference.unescapeComponentString(this.path);
      const match: RegExpExecArray | null = packageNameRegExp.exec(path);
      if (match && isValidPackageName(match[1], match)) {
        this._pathComponents = {
          packageName: match[1],
          importPath: match[2] || ''
        };
      } else {
        this._pathComponents = {
          packageName: '',
          importPath: path
        };
      }
    }
    return this._pathComponents;
  }
}

// matches the following:
//   'foo'            -> ["foo", "foo", undefined, "foo", undefined]
//   'foo/bar'        -> ["foo/bar", "foo", undefined, "foo", "bar"]
//   '@scope/foo'     -> ["@scope/foo", "@scope/foo", "scope", "foo", undefined]
//   '@scope/foo/bar' -> ["@scope/foo/bar", "@scope/foo", "scope", "foo", "bar"]
// does not match:
//   '/'
//   '@/'
//   '@scope/'
// capture groups:
//   1. The package name (including scope)
//   2. The scope name (excluding the leading '@')
//   3. The unscoped package name
//   4. The package-relative import path
const packageNameRegExp: RegExp = /^((?:@([^/]+?)\/)?([^/]+?))(?:\/(.*))?$/;

// according to validate-npm-package-name:
// no leading '.'
// no leading '_'
// no leading or trailing whitespace
// no capital letters or special characters (~'!()*)
// not 'node_modules' or 'favicon.ico' (blacklisted)
const invalidPackageNameRegExp: RegExp = /^[._\s]|\s$|[A-Z~'!()*]|^(node_modules|favicon.ico)$/s;

// no leading './'
// no leading '../'
// no leading '/'
// not '.' or '..'
const invalidImportPathRegExp: RegExp = /^(\.\.?([\\/]|$)|\/)/;

function isValidPackageName(packageName: string,
  match: RegExpExecArray | null = packageNameRegExp.exec(packageName)): boolean {
  return !!match // must match the minimal pattern
    && match[1] === packageName // must not contain excess characters
    && packageName.length <= 214 // maximum length, per validate-npm-package-name
    && !invalidPackageNameRegExp.test(packageName) // must not contain invalid characters
    && (!match[2] || encodeURIComponent(match[2]) === match[2]) // scope must be URL-friendly
    && encodeURIComponent(match[3]) === match[3]; // package must be URL-friendly
}

/**
 * Represents the global scope.
 * @beta
 */
export class GlobalSource {
  public static readonly instance: GlobalSource = new GlobalSource();

  private constructor() {
  }

  public toString(): string {
    return '!';
  }
}

/**
 * @beta
 */
export type Component =
  | RootComponent
  | NavigationComponent
  ;

/**
 * @beta
 */
export abstract class ComponentBase {
  public readonly text: string;

  constructor(text: string, userEscaped?: boolean) {
    this.text = escapeIfNeeded(text, userEscaped);
  }

  public addNavigationStep(this: Component, navigation: Navigation, text: string, userEscaped?: boolean): Component {
    // tslint:disable-next-line:no-use-before-declare
    return new NavigationComponent(this, navigation, text, userEscaped);
  }

  public abstract toString(): string;
}

/**
 * @beta
 */
export class RootComponent extends ComponentBase {
  public toString(): string {
    return this.text;
  }
}

/**
 * @beta
 */
export class NavigationComponent extends ComponentBase {
  public readonly parent: Component;
  public readonly navigation: Navigation;

  constructor(source: Component, navigation: Navigation, text: string, userEscaped?: boolean) {
    super(text, userEscaped);
    this.parent = source;
    this.navigation = navigation;
  }

  public toString(): string {
    return `${this.parent}${formatNavigation(this.navigation)}${this.text}`;
  }
}

/**
 * @beta
 */
export const enum Meaning {
  Class = 'class',                              // SymbolFlags.Class
  Interface = 'interface',                      // SymbolFlags.Interface
  TypeAlias = 'type',                           // SymbolFlags.TypeAlias
  Enum = 'enum',                                // SymbolFlags.Enum
  Namespace = 'namespace',                      // SymbolFlags.Module
  Function = 'function',                        // SymbolFlags.Function
  Variable = 'var',                             // SymbolFlags.Variable
  Constructor = 'constructor',                  // SymbolFlags.Constructor
  Member = 'member',                            // SymbolFlags.ClassMember | SymbolFlags.EnumMember
  Event = 'event',                              //
  CallSignature = 'call',                       // SymbolFlags.Signature (for __call)
  ConstructSignature = 'new',                   // SymbolFlags.Signature (for __new)
  IndexSignature = 'index',                     // SymbolFlags.Signature (for __index)
  ComplexType = 'complex'                       // Any complex type
}

/**
 * @beta
 */
export interface ISymbolReferenceOptions {
  meaning?: Meaning;
  overloadIndex?: number;
}

/**
 * Represents a reference to a TypeScript symbol.
 * @beta
 */
export class SymbolReference {
  public readonly component: Component | undefined;
  public readonly meaning: Meaning | undefined;
  public readonly overloadIndex: number | undefined;

  constructor(component: Component | undefined, { meaning, overloadIndex }: ISymbolReferenceOptions = {}) {
    this.component = component;
    this.overloadIndex = overloadIndex;
    this.meaning = meaning;
  }

  public static empty(): SymbolReference {
    return new SymbolReference(/*component*/ undefined);
  }

  public withComponent(component: Component | undefined): SymbolReference {
    return this.component === component ? this : new SymbolReference(component, {
      meaning: this.meaning,
      overloadIndex: this.overloadIndex
    });
  }

  public withMeaning(meaning: Meaning | undefined): SymbolReference {
    return this.meaning === meaning ? this : new SymbolReference(this.component, {
      meaning,
      overloadIndex: this.overloadIndex
    });
  }

  public withOverloadIndex(overloadIndex: number | undefined): SymbolReference {
    return this.overloadIndex === overloadIndex ? this : new SymbolReference(this.component, {
      meaning: this.meaning,
      overloadIndex
    });
  }

  public addNavigationStep(navigation: Navigation, text: string, userEscaped?: boolean): SymbolReference {
    if (!this.component) {
        throw new Error('Cannot add a navigation step to an empty symbol reference.');
    }
    return new SymbolReference(this.component.addNavigationStep(navigation, text, userEscaped));
  }

  public toString(): string {
    let result: string = `${this.component || ''}`;
    if (this.meaning && this.overloadIndex !== undefined) {
      result += `:${this.meaning}(${this.overloadIndex})`;
    } else if (this.meaning) {
      result += `:${this.meaning}`;
    } else if (this.overloadIndex !== undefined) {
      result += `:${this.overloadIndex}`;
    }
    return result;
  }
}

const enum Token {
  None,
  EofToken,
  // Punctuator
  OpenBraceToken,       // '{'
  CloseBraceToken,      // '}'
  OpenParenToken,       // '('
  CloseParenToken,      // ')'
  OpenBracketToken,     // '['
  CloseBracketToken,    // ']'
  ExclamationToken,     // '!'
  DotToken,             // '.'
  HashToken,            // '#'
  TildeToken,           // '~'
  ColonToken,           // ':'
  CommaToken,           // ','
  DecimalDigits,        // '12345'
  String,               // '"abc"'
  Text,                 // 'abc'
  // Keywords
  ClassKeyword,         // 'class'
  InterfaceKeyword,     // 'interface'
  TypeKeyword,          // 'type'
  EnumKeyword,          // 'enum'
  NamespaceKeyword,     // 'namespace'
  FunctionKeyword,      // 'function'
  VarKeyword,           // 'var'
  ConstructorKeyword,   // 'constructor'
  MemberKeyword,        // 'member'
  EventKeyword,         // 'event'
  CallKeyword,          // 'call'
  NewKeyword,           // 'new'
  IndexKeyword,         // 'index'
  ComplexKeyword        // 'complex'
}

function tokenToString(token: Token): string {
  switch (token) {
    case Token.OpenBraceToken: return '{';
    case Token.CloseBraceToken: return '}';
    case Token.OpenParenToken: return '(';
    case Token.CloseParenToken: return ')';
    case Token.OpenBracketToken: return '[';
    case Token.CloseBracketToken: return ']';
    case Token.ExclamationToken: return '!';
    case Token.DotToken: return '.';
    case Token.HashToken: return '#';
    case Token.TildeToken: return '~';
    case Token.ColonToken: return ':';
    case Token.CommaToken: return ',';
    case Token.ClassKeyword: return 'class';
    case Token.InterfaceKeyword: return 'interface';
    case Token.TypeKeyword: return 'type';
    case Token.EnumKeyword: return 'enum';
    case Token.NamespaceKeyword: return 'namespace';
    case Token.FunctionKeyword: return 'function';
    case Token.VarKeyword: return 'var';
    case Token.ConstructorKeyword: return 'constructor';
    case Token.MemberKeyword: return 'member';
    case Token.EventKeyword: return 'event';
    case Token.CallKeyword: return 'call';
    case Token.NewKeyword: return 'new';
    case Token.IndexKeyword: return 'index';
    case Token.ComplexKeyword: return 'complex';
    case Token.None: return '<none>';
    case Token.EofToken: return '<eof>';
    case Token.DecimalDigits: return '<decimal digits>';
    case Token.String: return '<string>';
    case Token.Text: return '<text>';
  }
}

class Scanner {
  private _tokenPos: number;
  private _pos: number;
  private _text: string;
  private _token: Token;
  private _stringIsUnterminated: boolean;

  constructor(text: string) {
    this._pos = 0;
    this._tokenPos = 0;
    this._stringIsUnterminated = false;
    this._token = Token.None;
    this._text = text;
  }

  public get stringIsUnterminated(): boolean {
    return this._stringIsUnterminated;
  }

  public get text(): string {
    return this._text;
  }

  public get tokenText(): string {
    return this._text.slice(this._tokenPos, this._pos);
  }

  public get eof(): boolean {
    return this._pos >= this._text.length;
  }

  public token(): Token {
    return this._token;
  }

  public speculate<T>(cb: (accept: () => void) => T): T {
    const tokenPos: number = this._tokenPos;
    const pos: number = this._pos;
    const text: string = this._text;
    const token: Token = this._token;
    const stringIsUnterminated: boolean = this._stringIsUnterminated;
    let accepted: boolean = false;
    try {
      const accept: () => void = () => { accepted = true; };
      return cb(accept);
    } finally {
      if (!accepted) {
        this._tokenPos = tokenPos;
        this._pos = pos;
        this._text = text;
        this._token = token;
        this._stringIsUnterminated = stringIsUnterminated;
      }
    }
  }

  public scan(): Token {
    if (!this.eof) {
      this._tokenPos = this._pos;
      this._stringIsUnterminated = false;
      while (!this.eof) {
        const ch: string = this._text[this._pos++];
        switch (ch) {
          case '{': return this._token = Token.OpenBraceToken;
          case '}': return this._token = Token.CloseBraceToken;
          case '(': return this._token = Token.OpenParenToken;
          case ')': return this._token = Token.CloseParenToken;
          case '[': return this._token = Token.OpenBracketToken;
          case ']': return this._token = Token.CloseBracketToken;
          case '!': return this._token = Token.ExclamationToken;
          case '.': return this._token = Token.DotToken;
          case '#': return this._token = Token.HashToken;
          case '~': return this._token = Token.TildeToken;
          case ':': return this._token = Token.ColonToken;
          case ',': return this._token = Token.CommaToken;
          case '"':
            this.scanString();
            return this._token = Token.String;
          default:
            this.scanText();
            return this._token = Token.Text;
        }
      }
    }
    return this._token = Token.EofToken;
  }

  public rescanMeaning(): Token {
    if (this._token === Token.Text) {
      const tokenText: string = this.tokenText;
      switch (tokenText) {
        case 'class': return this._token = Token.ClassKeyword;
        case 'interface': return this._token = Token.InterfaceKeyword;
        case 'type': return this._token = Token.TypeKeyword;
        case 'enum': return this._token = Token.EnumKeyword;
        case 'namespace': return this._token = Token.NamespaceKeyword;
        case 'function': return this._token = Token.FunctionKeyword;
        case 'var': return this._token = Token.VarKeyword;
        case 'constructor': return this._token = Token.ConstructorKeyword;
        case 'member': return this._token = Token.MemberKeyword;
        case 'event': return this._token = Token.EventKeyword;
        case 'call': return this._token = Token.CallKeyword;
        case 'new': return this._token = Token.NewKeyword;
        case 'index': return this._token = Token.IndexKeyword;
        case 'complex': return this._token = Token.ComplexKeyword;
      }
    }
    return this._token;
  }

  public rescanDecimalDigits(): Token {
    if (this._token === Token.Text) {
      const tokenText: string = this.tokenText;
      if (/^\d+$/.test(tokenText)) {
        return this._token = Token.DecimalDigits;
      }
    }
    return this._token;
  }

  private scanString(): void {
    while (!this.eof) {
      const ch: string = this._text[this._pos++];
      switch (ch) {
        case '"': return;
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

    const ch: string = this._text.charAt(this._pos);

    // EscapeSequence:: CharacterEscapeSequence
    if (isCharacterEscapeSequence(ch)) {
      this._pos++;
      return;
    }

    // EscapeSequence:: `0` [lookahead != DecimalDigit]
    if (ch === '0'
      && (this._pos + 1 === this._text.length
        || !isDecimalDigit(this._text.charAt(this._pos + 1)))) {
      this._pos++;
      return;
    }

    // EscapeSequence:: HexEscapeSequence
    if (ch === 'x'
      && this._pos + 3 <= this._text.length
      && isHexDigit(this._text.charAt(this._pos + 1))
      && isHexDigit(this._text.charAt(this._pos + 2))) {
      this._pos += 3;
      return;
    }

    // EscapeSequence:: UnicodeEscapeSequence
    // UnicodeEscapeSequence:: `u` Hex4Digits
    if (ch === 'u'
      && this._pos + 5 <= this._text.length
      && isHexDigit(this._text.charAt(this._pos + 1))
      && isHexDigit(this._text.charAt(this._pos + 2))
      && isHexDigit(this._text.charAt(this._pos + 3))
      && isHexDigit(this._text.charAt(this._pos + 4))) {
      this._pos += 5;
      return;
    }

    // EscapeSequence:: UnicodeEscapeSequence
    // UnicodeEscapeSequence:: `u` `{` CodePoint `}`
    if (ch === 'u'
      && this._pos + 4 <= this._text.length
      && this._text.charAt(this._pos + 1) === '{') {
      let hexDigits: string = this._text.charAt(this._pos + 2);
      if (isHexDigit(hexDigits)) {
        for (let i: number = this._pos + 3; i < this._text.length; i++) {
          const ch2: string = this._text.charAt(i);
          if (ch2 === '}') {
            const mv: number = parseInt(hexDigits, 16);
            if (mv <= 0x10ffff) {
              this._pos = i + 1;
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
    while (this._pos < this._text.length) {
      const ch: string = this._text.charAt(this._pos);
      if (isPunctuator(ch) || ch === '"') {
        return;
      }
      this._pos++;
    }
  }
}

class Parser {
  private scanner: Scanner;

  constructor(text: string) {
    this.scanner = new Scanner(text);
    this.scanner.scan();
  }

  public get eof(): boolean {
    return this.scanner.eof;
  }

  public parseDeclarationReference(): DeclarationReference {
    let source: ModuleSource | GlobalSource | undefined;
    let navigation: Navigation.Locals | undefined;
    let symbol: SymbolReference | undefined;
    if (this.optionalToken(Token.ExclamationToken)) {
      // Reference to global symbol
      source = GlobalSource.instance;
      symbol = this.parseSymbol();
    } else if (this.isStartOfComponent()) {
      // Either path for module source or first component of symbol
      const root: string = this.parseComponent();
      if (this.optionalToken(Token.ExclamationToken)) {
        // Definitely path for module source
        source = new ModuleSource(root, /*userEscaped*/ true);

        // Check for optional `~` navigation token.
        if (this.optionalToken(Token.TildeToken)) {
          navigation = Navigation.Locals;
        }

        if (this.isStartOfComponent()) {
          symbol = this.parseSymbol();
        }
      } else {
        // Definitely a symbol
        symbol = this.parseSymbolRest(this.parseComponentRest(new RootComponent(root, /*userEscaped*/ true)));
      }
    } else if (this.token() === Token.ColonToken) {
        symbol = this.parseSymbolRest(new RootComponent(''));
    }
    return new DeclarationReference(source, navigation, symbol);
  }

  public parseComponent(): string {
    switch (this.scanner.token()) {
      case Token.String:
        return this.parseString();
      default:
        return this.parseComponentAtoms();
    }
  }

  private token(): Token {
    return this.scanner.token();
  }

  private parseSymbol(): SymbolReference {
    const component: Component = this.parseComponentRest(this.parseRootComponent());
    return this.parseSymbolRest(component);
  }

  private parseSymbolRest(component: Component): SymbolReference {
    let meaning: Meaning | undefined;
    let overloadIndex: number | undefined;
    if (this.optionalToken(Token.ColonToken)) {
      meaning = this.tryParseMeaning();
      overloadIndex = this.tryParseOverloadIndex(!!meaning);
    }

    return new SymbolReference(component, { meaning, overloadIndex });
  }

  private parseRootComponent(): Component {
    if (!this.isStartOfComponent()) {
      return this.fail();
    }

    const text: string = this.parseComponent();
    return new RootComponent(text, /*userEscaped*/ true);
  }

  private parseComponentRest(component: Component): Component {
    for (; ;) {
      switch (this.token()) {
        case Token.DotToken:
        case Token.HashToken:
        case Token.TildeToken:
          const navigation: Navigation = this.parseNavigation();
          const text: string = this.parseComponent();
          component = new NavigationComponent(component, navigation, text, /*userEscaped*/ true);
          break;
        default:
          return component;
      }
    }
  }

  private parseNavigation(): Navigation {
    switch (this.scanner.token()) {
      case Token.DotToken: return this.scanner.scan(), Navigation.Exports;
      case Token.HashToken: return this.scanner.scan(), Navigation.Members;
      case Token.TildeToken: return this.scanner.scan(), Navigation.Locals;
      default: return this.fail();
    }
  }

  private tryParseMeaning(): Meaning | undefined {
    switch (this.scanner.rescanMeaning()) {
      case Token.ClassKeyword: return this.scanner.scan(), Meaning.Class;
      case Token.InterfaceKeyword: return this.scanner.scan(), Meaning.Interface;
      case Token.TypeKeyword: return this.scanner.scan(), Meaning.TypeAlias;
      case Token.EnumKeyword: return this.scanner.scan(), Meaning.Enum;
      case Token.NamespaceKeyword: return this.scanner.scan(), Meaning.Namespace;
      case Token.FunctionKeyword: return this.scanner.scan(), Meaning.Function;
      case Token.VarKeyword: return this.scanner.scan(), Meaning.Variable;
      case Token.ConstructorKeyword: return this.scanner.scan(), Meaning.Constructor;
      case Token.MemberKeyword: return this.scanner.scan(), Meaning.Member;
      case Token.EventKeyword: return this.scanner.scan(), Meaning.Event;
      case Token.CallKeyword: return this.scanner.scan(), Meaning.CallSignature;
      case Token.NewKeyword: return this.scanner.scan(), Meaning.ConstructSignature;
      case Token.IndexKeyword: return this.scanner.scan(), Meaning.IndexSignature;
      case Token.ComplexKeyword: return this.scanner.scan(), Meaning.ComplexType;
      default: return undefined;
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
    switch (this.scanner.rescanDecimalDigits()) {
      case Token.DecimalDigits:
        const value: number = +this.scanner.tokenText;
        this.scanner.scan();
        return value;
      default:
        return this.fail();
    }
  }

  private isStartOfComponent(): boolean {
    switch (this.token()) {
      case Token.String:
      case Token.Text:
      case Token.OpenBracketToken:
        return true;
      default:
        return false;
    }
  }

  private parseComponentAtoms(): string {
    let text: string = '';
    for (; ;) {
      switch (this.scanner.token()) {
        case Token.Text:
          text += this.parseText();
          break;
        case Token.OpenBracketToken:
          text += this.parseBracketedComponent();
          break;
        default:
          return text;
      }
    }
  }

  private parseText(): string {
    if (this.scanner.token() === Token.Text) {
      const text: string = this.scanner.tokenText;
      this.scanner.scan();
      return text;
    }
    return this.fail();
  }

  private parseString(): string {
    if (this.scanner.token() === Token.String) {
      const text: string = this.scanner.tokenText;
      this.scanner.scan();
      return text;
    }
    return this.fail();
  }

  private parseBracketedComponent(): string {
    this.expectToken(Token.OpenBracketToken);
    const text: string = this.parseBracketedAtoms();
    this.expectToken(Token.CloseBracketToken);
    return `[${text}]`;
  }

  private parseBracketedAtoms(): string {
    let text: string = '';
    for (; ;) {
      switch (this.scanner.token()) {
        case Token.DotToken:
          text += '.';
          this.scanner.scan();
          continue;
        case Token.String:
          text += this.parseString();
          continue;
        case Token.Text:
          text += this.parseText();
          continue;
        case Token.OpenBracketToken:
          text += this.parseBracketedComponent();
          continue;
        default:
          return text;
      }
    }
  }

  private optionalToken(token: Token): boolean {
    if (this.scanner.token() === token) {
      this.scanner.scan();
      return true;
    }
    return false;
  }

  private expectToken(token: Token, message?: string): void {
    if (this.scanner.token() !== token) {
      const expected: string = tokenToString(token);
      const actual: string = tokenToString(this.scanner.token());
      return this.fail(message || `Expected token '${expected}', received '${actual}' instead.`);
    }
    this.scanner.scan();
  }

  private fail(message?: string): never {
    throw new SyntaxError(`Invalid DeclarationReference '${this.scanner.text}'${message ? `: ${message}` : ''}`);
  }
}

function formatNavigation(navigation: Navigation | undefined): string {
  switch (navigation) {
    case Navigation.Exports: return '.';
    case Navigation.Members: return '#';
    case Navigation.Locals: return '~';
    default: return '';
  }
}

function isCharacterEscapeSequence(ch: string): boolean {
  return isSingleEscapeCharacter(ch)
    || isNonEscapeCharacter(ch);
}

function isSingleEscapeCharacter(ch: string): boolean {
  switch (ch) {
    case '\'':
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

function isNonEscapeCharacter(ch: string): boolean {
  return !isEscapeCharacter(ch)
    && !isLineTerminator(ch);
}

function isEscapeCharacter(ch: string): boolean {
  switch (ch) {
    case 'x':
    case 'u':
      return true;
    default:
      return isSingleEscapeCharacter(ch)
        || isDecimalDigit(ch);
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
      return true;
    default:
      return false;
  }
}

function escapeIfNeeded(text: string, userEscaped?: boolean): string {
  if (userEscaped) {
    if (!DeclarationReference.isWellFormedComponentString(text)) {
      throw new SyntaxError(`Invalid Component '${text}'`);
    }
    return text;
  }
  return DeclarationReference.escapeComponentString(text);
}