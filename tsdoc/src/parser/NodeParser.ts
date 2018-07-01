import { ParserContext } from './ParserContext';
import { Token, TokenKind } from './Token';
import { Tokenizer } from './Tokenizer';
import {
  DocDelimiter,
  DocNode,
  DocPlainText,
  DocBackslashEscape,
  DocError,
  DocHtmlStartTag,
  DocNodeKind,
  DocWord,
  DocSpacing,
  DocNewline,
  DocHtmlAttribute,
  DocHtmlString
} from '../nodes';

export class NodeParser {
  // https://www.w3.org/TR/html5/syntax.html#tag-name
  // https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name
  private static readonly htmlNameRegExp: RegExp = /^[a-z]+(\-[a-z]+)*$/i;

  private _tokens: Token[] = [];
  // The index into the _tokens array, of the current token being processed.
  private _tokenIndex: number = 0;

  /**
   * When we are accumulating a DocPlainText node, these are the tokens.
   */
  private _accumulatedPlainText: Token[];

  public constructor(parserContext: ParserContext) {
    this._tokens = parserContext.tokens;
    this._accumulatedPlainText = [];
  }

  public parse(): DocNode[] {
    const childNodes: DocNode[] = [];

    let done: boolean = false;
    while (!done) {
      // Extract the next token
      switch (this._peekTokenKind()) {
        case TokenKind.EndOfInput:
          done = true;
          break;
        case TokenKind.Newline:
          this._pushAccumulatedPlainText(childNodes);
          childNodes.push(new DocNewline({
            tokens: [ this._readToken() ]
          }));
          break;
        case TokenKind.Backslash:
          this._pushAccumulatedPlainText(childNodes);
          childNodes.push(this._parseBackslashEscape());
          break;
        case TokenKind.LessThan:
          this._pushAccumulatedPlainText(childNodes);
          childNodes.push(this._parseHtmlStartTag());
          break;
        default:
          // If nobody recognized this token, then accumulate plain text
          this._accumulatedPlainText.push(this._readToken());
          break;
      }
    }
    this._pushAccumulatedPlainText(childNodes);
    return childNodes;
  }

  private _pushAccumulatedPlainText(childNodes: DocNode[]): void {
    if (this._accumulatedPlainText.length > 0) {
      childNodes.push(
        new DocPlainText({ tokens: this._accumulatedPlainText })
      );
      this._accumulatedPlainText = [];
    }
  }

  private _parseBackslashEscape(): DocNode {
    const marker: number = this._createMarker();

    const backslashToken: Token = this._readToken();

    if (this._peekTokenKind() === TokenKind.EndOfInput) {
      return this._backtrackAndCreateError(marker,
        'A backslash must precede another character that is being escaped');
    }

    const escapedToken: Token = this._readToken();

    // In CommonMark, a backslash is only allowed before a punctuation
    // character.  In all other contexts, the backslash is interpreted as a
    // literal character.
    if (!Tokenizer.isPunctuation(escapedToken.kind)) {
      // In this situation we still want the token to be escaped, but we represent it
      // as an error rather than as
      return new DocError({
        tokens: [ backslashToken, escapedToken ],
        errorMessage: 'A backslash can only be used to escape a punctuation character',
        errorLocation: backslashToken.range
      });
    }

    return new DocBackslashEscape({
      tokens: [ backslashToken, escapedToken ]
    });
  }

  private _parseHtmlStartTag(): DocNode {
    const marker: number = this._createMarker();

    const childNodes: DocNode[] = [];

    // Read the "<" delimiter
    const lessThanToken: Token = this._readToken();
    if (lessThanToken.kind !== TokenKind.LessThan) {
      return this._backtrackAndCreateError(marker, 'Expecting an HTML tag starting with "<"');
    }
    childNodes.push(new DocDelimiter({
      tokens: [ lessThanToken ]
    }));

    // Read the tag name
    const tagNameNode: DocNode = this._parseHtmlWord();
    if (tagNameNode.kind === DocNodeKind.Error) {
      return this._backtrackAndCreateParentError(marker,
        'Expecting an HTML tag name', tagNameNode);
    }
    childNodes.push(tagNameNode);

    // Read the attributes until we see a ">" or "/>"
    while (true) {
      const parsedSpaces: boolean = this._parseSpacingAndNewlinesInto(childNodes);

      if (this._peekTokenKind() !== TokenKind.AsciiWord) {
        break;
      }

      if (!parsedSpaces) {
        return this._backtrackAndCreateError(marker, 'Missing space before attribute name',
          this._readToken());
      }

      // Read the attribute
      const attributeNode: DocNode = this._parseHtmlAttribute();
      if (attributeNode.kind === DocNodeKind.Error) {
        return this._backtrackAndPropagateError(marker, attributeNode);
      }
      childNodes.push(attributeNode);
    }

    // Read the closing "/>" or ">"
    const delimiterTokens: Token[] = [];
    let selfClosingTag: boolean = false;
    if (this._peekTokenKind() === TokenKind.Slash) {
      delimiterTokens.push(this._readToken());
      selfClosingTag = true;
    }
    if (this._peekTokenKind() !== TokenKind.GreaterThan) {
      return this._backtrackAndCreateError(marker,
        'The HTML tag has invalid syntax; expecting an attribute or ">" or "/>"',
        this._readToken());
    }
    delimiterTokens.push(this._readToken());

    childNodes.push(new DocDelimiter({
      tokens: delimiterTokens
    }));

    return new DocHtmlStartTag({
      childNodes: childNodes,
      selfClosingTag: selfClosingTag
    });
  }

  private _parseHtmlAttribute(): DocNode {
    const marker: number = this._createMarker();
    const childNodes: DocNode[] = [];

    // Read the attribute name
    const attributeNameNode: DocNode = this._parseHtmlWord();
    if (attributeNameNode.kind === DocNodeKind.Error) {
      return this._backtrackAndCreateParentError(marker,
        'Expecting an HTML tag name', attributeNameNode);
    }
    childNodes.push(attributeNameNode);

    this._parseSpacingAndNewlinesInto(childNodes);

    if (this._peekTokenKind() !== TokenKind.Equals) {
      return this._createError('Expecting "=" after HTML attribute name');
    }

    childNodes.push(new DocDelimiter({
      tokens: [ this._readToken() ]
    }));

    this._parseSpacingAndNewlinesInto(childNodes);

    const htmlStringNode: DocNode = this._parseHtmlString();
    if (htmlStringNode.kind === DocNodeKind.Error) {
      return this._backtrackAndPropagateError(marker, htmlStringNode);
    }
    childNodes.push(htmlStringNode);

    return new DocHtmlAttribute({ childNodes });
  }

  private _parseHtmlString(): DocNode {
    const marker: number = this._createMarker();

    const quoteTokenKind: TokenKind = this._peekTokenKind();
    if (quoteTokenKind !== TokenKind.DoubleQuote && quoteTokenKind !== TokenKind.SingleQuote) {
      return this._createError('Expecting an HTML string starting with a single-quote or double-quote character');
    }
    const tokens: Token[] = [];
    tokens.push(this._readToken()); // extract the quote

    while (true) {
      const peekedTokenKind: TokenKind = this._peekTokenKind();
      // Did we find the matching token?
      if (peekedTokenKind === quoteTokenKind) {
        tokens.push(this._readToken()); // extract the quote
        break;
      }
      if (peekedTokenKind === TokenKind.EndOfInput ||  peekedTokenKind === TokenKind.Newline) {
        return this._backtrackAndCreateError(marker,
          'The HTML string is missing its closing quote');
      }
      tokens.push(this._readToken());
    }

    return new DocHtmlString({
      tokens: tokens
    });
  }

  private _parseHtmlWord(): DocNode {
    const tokens: Token[] = [];

    const marker: number = this._createMarker();

    let done: boolean = false;
    while (!done) {
      switch (this._peekTokenKind()) {
        case TokenKind.AsciiWord:
        case TokenKind.Hyphen:
          tokens.push(this._readToken());
          break;
        default:
          done = true;
          break;
      }
    }

    if (tokens.length === 0) {
      return this._backtrackAndCreateError(marker, 'Expecting an HTML name');
    }

    const word: DocWord = new DocWord({
      tokens: tokens
    });

    if (!NodeParser.htmlNameRegExp.test(word.toString())) {
      return this._backtrackAndCreateError(marker,
        'An HTML name must be a sequence of letters separated by hyphens');
    }

    return word;
  }

  private _parseSpacingAndNewlinesInto(childNodes: DocNode[]): boolean {
    let nodesPushed: boolean = false;
    const spacingTokens: Token[] = [];

    while (true) {
      if (this._peekTokenKind() === TokenKind.Newline) {
        if (spacingTokens.length > 0) {
          childNodes.push(new DocSpacing({ tokens: spacingTokens }));
          spacingTokens.length = 0;
        }
        childNodes.push(new DocNewline({
          tokens: [ this._readToken() ]
        }));
        nodesPushed = true;
      } else if (this._peekTokenKind() === TokenKind.Spacing) {
        spacingTokens.push(this._readToken());
        nodesPushed = true;
      } else {
        break;
      }
    }

    if (spacingTokens.length > 0) {
      childNodes.push(new DocSpacing({ tokens: spacingTokens }));
      spacingTokens.length = 0;
      nodesPushed = true;
    }

    return nodesPushed;
  }

  private _peekTokenKind(): TokenKind {
    return this._tokens[this._tokenIndex].kind;
  }

  private _readToken(): Token {
    if (this._tokenIndex >= this._tokens.length) {
      // If this happens, it's a parser bug
      throw new Error('Cannot read past end of stream');
    }
    return this._tokens[this._tokenIndex++];
  }

  private _createError(errorMessage: string): DocError {
    return this._backtrackAndCreateError(this._createMarker(), errorMessage);
  }

  /**
   * Rewind to the specified marker, read the next token, and report it as an error.
   */
  private _backtrackAndCreateError(marker: number, errorMessage: string,
    errorLocationToken?: Token): DocError {

    this._backtrack(marker);
    const token: Token = this._readToken();

    return new DocError({
      tokens: [ token ],
      errorMessage,
      errorLocation: errorLocationToken !== undefined ? errorLocationToken.range : token.range
    });
  }

  /**
   * Rewind to the specified marker, read the next token, and report an error that
   * was encountered later in the input stream.
   */
  private _backtrackAndPropagateError(marker: number, innerError: DocNode): DocError {
    if (innerError.kind !== DocNodeKind.Error) {
      // If this happens, it's a parser bug
      throw new Error('innerError must be a DocError');
    }
    const casted: DocError = innerError as DocError;

    this._backtrack(marker);
    const token: Token = this._readToken();

    return new DocError({
      tokens: [ token ],
      errorMessage: casted.errorMessage,
      errorLocation: casted.errorLocation
    });
  }

  /**
   * Rewind to the specified marker, read the next token, and report it as an error.
   */
  private _backtrackAndCreateParentError(marker: number, errorMessage: string,
    innerError: DocNode): DocError {

    if (innerError.kind !== DocNodeKind.Error) {
      // If this happens, it's a parser bug
      throw new Error('innerError must be a DocError');
    }
    const casted: DocError = innerError as DocError;

    this._backtrack(marker);
    const token: Token = this._readToken();

    return new DocError({
      tokens: [ token ],
      errorMessage: errorMessage + ': ' + casted.errorMessage,
      errorLocation: casted.errorLocation
    });
  }

  private _createMarker(): number {
    return this._tokenIndex;
  }

  private _backtrack(marker: number): void {
    if (marker > this._tokenIndex) {
      // If this happens, it's a parser bug
      throw new Error('The marker has expired');
    }
    this._tokenIndex = marker;
  }
}
