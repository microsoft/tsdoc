// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

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

    public static makeSafeComponent(text: string): string {
        const parser: Parser = new Parser(text);
        parser.parseComponent();
        return parser.eof ? text : JSON.stringify(text);
    }

    public static empty(): DeclarationReference {
        return new DeclarationReference();
    }

    public static module(path: string): DeclarationReference {
        return new DeclarationReference(new ModuleSource(path));
    }

    public static global(): DeclarationReference {
        return new DeclarationReference(GlobalSource.instance);
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
            throw new Error('Cannot set a meaning on a DeclarationReference without a symbol');
        }
        return this.withSymbol(this.symbol.withMeaning(meaning));
    }

    public withOverloadIndex(overloadIndex: number | undefined): DeclarationReference {
        if (!this.symbol) {
            if (overloadIndex === undefined) {
                return this;
            }
            throw new Error('Cannot set an overloadIndex on a DeclarationReference without a symbol');
        }
        return this.withSymbol(this.symbol.withOverloadIndex(overloadIndex));
    }

    public addNavigationStep(navigation: Navigation, text: string): DeclarationReference {
        if (this.symbol) {
            return this.withSymbol(this.symbol.addNavigationStep(navigation, text));
        }
        if (navigation === Navigation.Members) {
            navigation = Navigation.Exports;
        }
        return new DeclarationReference(this.source, navigation, new SymbolReference(new RootComponent(text)));
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

    constructor(path: string, escapeIfNeeded: boolean = true) {
        this.path = escapeIfNeeded ? DeclarationReference.makeSafeComponent(path) : path;
    }

    public toString(): string {
        return `${this.path}!`;
    }
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

    constructor(text: string, escapeIfNeeded: boolean = true) {
        this.text = escapeIfNeeded ? DeclarationReference.makeSafeComponent(text) : text;
    }

    public addNavigationStep(this: Component, navigation: Navigation, text: string): Component {
        // tslint:disable-next-line:no-use-before-declare
        return new NavigationComponent(this, navigation, text);
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

    constructor(source: Component, navigation: Navigation, text: string, escapeIfNeeded: boolean = true) {
        super(text, escapeIfNeeded);
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
    TypeAlias = 'typealias',                      // SymbolFlags.TypeAlias
    Enum = 'enum',                                // SymbolFlags.Enum
    Namespace = 'namespace',                      // SymbolFlags.Module
    Function = 'function',                        // SymbolFlags.Function
    Variable = 'variable',                        // SymbolFlags.Variable
    Constructor = 'constructor',                  // SymbolFlags.Constructor
    Member = 'member',                            // SymbolFlags.ClassMember
    Event = 'event',                              //
    EnumMember = 'enummember',                    // SymbolFlags.EnumMember
    Signature = 'signature',                      // SymbolFlags.Signature
    Type = 'type',                                // Any complex type
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
    public readonly component: Component;
    public readonly meaning: Meaning | undefined;
    public readonly overloadIndex: number | undefined;

    constructor(component: Component, { meaning, overloadIndex }: ISymbolReferenceOptions = {}) {
        this.component = component;
        this.overloadIndex = overloadIndex;
        this.meaning = meaning;
    }

    public withComponent(component: Component): SymbolReference {
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

    public addNavigationStep(navigation: Navigation, text: string): SymbolReference {
        return new SymbolReference(this.component.addNavigationStep(navigation, text));
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
    TypealiasKeyword,     // 'typealias'
    EnumKeyword,          // 'enum'
    NamespaceKeyword,     // 'namespace'
    FunctionKeyword,      // 'function'
    VariableKeyword,      // 'variable'
    ConstructorKeyword,   // 'constructor'
    MemberKeyword,        // 'member'
    EventKeyword,         // 'event'
    EnumMemberKeyword,    // 'enummember'
    SignatureKeyword,     // 'signature'
    TypeKeyword           // 'type'
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
                case 'typealias': return this._token = Token.TypealiasKeyword;
                case 'enum': return this._token = Token.EnumKeyword;
                case 'namespace': return this._token = Token.NamespaceKeyword;
                case 'function': return this._token = Token.FunctionKeyword;
                case 'variable': return this._token = Token.VariableKeyword;
                case 'constructor': return this._token = Token.ConstructorKeyword;
                case 'member': return this._token = Token.MemberKeyword;
                case 'event': return this._token = Token.EventKeyword;
                case 'enummember': return this._token = Token.EnumMemberKeyword;
                case 'signature': return this._token = Token.SignatureKeyword;
                case 'type': return this._token = Token.TypeKeyword;
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
                source = new ModuleSource(root, /*escapeIfNeeded*/ false);

                // Check for optional `~` navigation token.
                if (this.optionalToken(Token.TildeToken)) {
                    navigation = Navigation.Locals;
                }

                if (this.isStartOfComponent()) {
                    symbol = this.parseSymbol();
                }
            } else {
                // Definitely a symbol
                symbol = this.parseSymbolRest(this.parseComponentRest(new RootComponent(root, /*escapeIfNeeded*/ false)));
            }
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
        return new RootComponent(text, /*escapeIfNeeded*/ false);
    }

    private parseComponentRest(component: Component): Component {
        for (;;) {
            switch (this.token()) {
                case Token.DotToken:
                case Token.HashToken:
                case Token.TildeToken:
                    const navigation: Navigation = this.parseNavigation();
                    const text: string = this.parseComponent();
                    component = new NavigationComponent(component, navigation, text, /*escapeIfNeeded*/ false);
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
            case Token.TypealiasKeyword: return this.scanner.scan(), Meaning.TypeAlias;
            case Token.EnumKeyword: return this.scanner.scan(), Meaning.Enum;
            case Token.NamespaceKeyword: return this.scanner.scan(), Meaning.Namespace;
            case Token.FunctionKeyword: return this.scanner.scan(), Meaning.Function;
            case Token.VariableKeyword: return this.scanner.scan(), Meaning.Variable;
            case Token.ConstructorKeyword: return this.scanner.scan(), Meaning.Constructor;
            case Token.MemberKeyword: return this.scanner.scan(), Meaning.Member;
            case Token.EventKeyword: return this.scanner.scan(), Meaning.Event;
            case Token.EnumMemberKeyword: return this.scanner.scan(), Meaning.EnumMember;
            case Token.SignatureKeyword: return this.scanner.scan(), Meaning.Signature;
            case Token.TypeKeyword: return this.scanner.scan(), Meaning.Type;
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
        for (;;) {
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
        for (;;) {
            switch (this.scanner.token()) {
                case Token.String:
                    text += this.parseString();
                    break;
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

    private optionalToken(token: Token): boolean {
        if (this.scanner.token() === token) {
            this.scanner.scan();
            return true;
        }
        return false;
    }

    private expectToken(token: Token, message?: string): void {
        if (this.scanner.token() !== token) {
            return this.fail(message);
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
