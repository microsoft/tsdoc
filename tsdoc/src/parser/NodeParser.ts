import { ParserContext } from './ParserContext';
import { Token, TokenKind } from './Token';
import { Tokenizer } from './Tokenizer';
import {
  DocBackslashEscape,
  DocBlockTag,
  DocDelimiter,
  DocError,
  DocHtmlAttribute,
  DocHtmlStartTag,
  DocHtmlString,
  DocNewline,
  DocNode,
  DocNodeKind,
  DocPlainText,
  DocSpacing,
  DocWord,
  DocInlineTagContent,
  DocInlineTag
} from '../nodes';
import { TextRange } from './TextRange';

export class NodeParser {
  // https://www.w3.org/TR/html5/syntax.html#tag-name
  // https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name
  private static readonly htmlNameRegExp: RegExp = /^[a-z]+(\-[a-z]+)*$/i;

  private static readonly tsdocTagNameRegExp: RegExp = /^[a-z][a-z0-9]*$/i;

  private _tokens: Token[] = [];
  // The index into the _tokens array, of the current token being processed.
  private _tokenIndex: number = 0;

  public constructor(parserContext: ParserContext) {
    this._tokens = parserContext.tokens;
  }

  public parse(): DocNode[] {
    const childNodes: DocNode[] = [];

    const accumulatedPlainTextTokens: Token[] = [];

    let done: boolean = false;
    while (!done) {
      // Extract the next token
      switch (this._peekTokenKind()) {
        case TokenKind.EndOfInput:
          done = true;
          break;
        case TokenKind.Newline:
          this._pushAccumulatedPlainText(childNodes, accumulatedPlainTextTokens);
          childNodes.push(new DocNewline({
            tokens: [ this._readToken() ]
          }));
          break;
        case TokenKind.Backslash:
          this._pushAccumulatedPlainText(childNodes, accumulatedPlainTextTokens);
          childNodes.push(this._parseBackslashEscape());
          break;
        case TokenKind.AtSign:
          this._pushAccumulatedPlainText(childNodes, accumulatedPlainTextTokens);
          childNodes.push(this._parseBlockTag());
          break;
          case TokenKind.LeftCurlyBracket:
          this._pushAccumulatedPlainText(childNodes, accumulatedPlainTextTokens);
          childNodes.push(this._parseInlineTag());
          break;
        case TokenKind.RightCurlyBracket:
          this._pushAccumulatedPlainText(childNodes, accumulatedPlainTextTokens);
          childNodes.push(this._createError(
            'The "}" character should be escaped using a backslash to avoid confusion with a TSDoc inline tag'));
          break;
        case TokenKind.LessThan:
          this._pushAccumulatedPlainText(childNodes, accumulatedPlainTextTokens);
          childNodes.push(this._parseHtmlStartTag());
          break;
        default:
          // If nobody recognized this token, then accumulate plain text
          accumulatedPlainTextTokens.push(this._readToken());
          break;
      }
    }
    this._pushAccumulatedPlainText(childNodes, accumulatedPlainTextTokens);
    return childNodes;
  }

  private _pushAccumulatedPlainText(childNodes: DocNode[],
    accumulatedPlainTextTokens: Token[]): void {
    if (accumulatedPlainTextTokens.length > 0) {
      childNodes.push(
        new DocPlainText({ tokens: accumulatedPlainTextTokens })
      );
      accumulatedPlainTextTokens.length = 0;
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

  private _parseBlockTag(): DocNode {
    const marker: number = this._createMarker();
    if (this._peekTokenKind() !== TokenKind.AtSign) {
      return this._backtrackAndCreateError(marker, 'Expecting a TSDoc tag starting with "@"');
    }

    // "@one" is a valid TSDoc tag at the start of a line, but "@one@two" is
    // a syntax error.  For two tags it should be "@one @two", or for literal text it
    // should be "\@one\@two".
    switch (this._peekPreviousTokenKind()) {
      case TokenKind.None:
      case TokenKind.Spacing:
      case TokenKind.Newline:
        break;
      default:
        return this._backtrackAndCreateError(marker, 'A TSDoc tag must be preceded by whitespace');
    }

    const tokens: Token[] = [];
    tokens.push(this._readToken()); // extract the @ sign

    // Read the words
    while (this._peekTokenKind() === TokenKind.AsciiWord) {
      const token: Token = this._readToken();
      tokens.push(token);
    }

    if (tokens.length === 1) {
      return this._backtrackAndCreateError(marker,
        'Expecting a TSDoc tag after the "@" character (or use a backslash to escape this character)');
    }

    switch (this._peekTokenKind()) {
      case TokenKind.None:
      case TokenKind.Spacing:
      case TokenKind.Newline:
      case TokenKind.EndOfInput:
        break;
      default:
        return this._backtrackAndCreateError(marker, 'A TSDoc tag must be followed by whitespace');
    }

    // The tag name is everything except the "@" character
    const tagName: TextRange = tokens[0].range.getNewRange(
      tokens[0].range.pos + 1, // skip the "@"
      tokens[tokens.length - 1].range.end
    );

    const blockTagNode: DocBlockTag = new DocBlockTag({
      tokens: tokens,
      tagName: tagName
    });

    if (!NodeParser.tsdocTagNameRegExp.test(tagName.toString())) {
      return this._backtrackAndCreateError(marker,
        'A TSDoc tag name must start with a letter and contain only letters and numbers');
    }
    return blockTagNode;
  }

  private _parseInlineTag(): DocNode {
    const marker: number = this._createMarker();
    if (this._peekTokenKind() !== TokenKind.LeftCurlyBracket) {
      return this._backtrackAndCreateError(marker, 'Expecting a TSDoc tag starting with "{"');
    }

    const openingTokens: Token[] = [];
    openingTokens.push(this._readToken());

    if (this._peekTokenKind() !== TokenKind.AtSign) {
      return this._backtrackAndCreateError(marker, 'Expecting a TSDoc tag starting with "{@"');
    }
    openingTokens.push(this._readToken());

    const childNodes: DocNode[] = [];

    // Push the "{@" opening delimiter
    childNodes.push(new DocDelimiter({
      tokens: openingTokens
    }));

    const endMarker: number = this._createMarker();

    // Read the words
    const tagNameTokens: Token[] = [];
    while (this._peekTokenKind() === TokenKind.AsciiWord) {
      tagNameTokens.push(this._readToken());
    }

    if (tagNameTokens.length === 0) {
      return this._backtrackAndCreateError(marker,
        'Expecting a TSDoc inline tag name after the "{@" characters',
        endMarker);
    }

    const tagName: TextRange = tagNameTokens[0].range.getNewRange(
      tagNameTokens[0].range.pos,
      tagNameTokens[tagNameTokens.length - 1].range.end
    );

    if (!NodeParser.tsdocTagNameRegExp.test(tagName.toString())) {
      return this._backtrackAndCreateError(marker,
        'A TSDoc tag name must start with a letter and contain only letters and numbers',
        endMarker);
    }

    childNodes.push(new DocWord({
      tokens: tagNameTokens
    }));

    // Parse the DocInlineTagContent child
    const tagContentNodes: DocNode[] = [];

    // We give the space to the DocInlineTagContent in case the implementor
    // wants to assign some special meaning to spaces for their tag.
    if (!this._parseSpacingAndNewlinesInto(tagContentNodes)) {
      if (this._peekTokenKind() !== TokenKind.RightCurlyBracket) {
        return this._backtrackAndCreateError(marker,
          'Expecting a space after the TSDoc inline tag name',
          endMarker);
      }
    }

    const accumulatedPlainText: Token[] = [];
    let done: boolean = false;
    while (!done) {
      switch (this._peekTokenKind()) {
        case TokenKind.EndOfInput:
          return this._backtrackAndCreateError(marker,
            'The TSDoc inline tag name is missing its closing "}"',
            endMarker);
        case TokenKind.Newline:
        this._pushAccumulatedPlainText(tagContentNodes, accumulatedPlainText);
          tagContentNodes.push(new DocNewline({
            tokens: [ this._readToken() ]
          }));
          break;
        case TokenKind.Backslash:
          this._pushAccumulatedPlainText(tagContentNodes, accumulatedPlainText);
          // http://usejsdoc.org/about-block-inline-tags.html
          // "If your tag's text includes a closing curly brace (}), you must escape it with
          // a leading backslash (\)."
          tagContentNodes.push(this._parseBackslashEscape());
          break;
        case TokenKind.LeftCurlyBracket:
          return this._backtrackAndCreateError(marker,
            'The "{" character must be escaped with a backslash when used inside a TSDoc inline tag',
            endMarker);
        case TokenKind.RightCurlyBracket:
          done = true;
          break;
        default:
          accumulatedPlainText.push(this._readToken());
          break;
      }
    }
    this._pushAccumulatedPlainText(tagContentNodes, accumulatedPlainText);

    const docInlineTagContent: DocInlineTagContent = new DocInlineTagContent({
      childNodes: tagContentNodes
    });

    childNodes.push(docInlineTagContent);

    // Parse the closing "}"
    childNodes.push(new DocDelimiter({
      tokens: [ this._readToken() ]
    }));

    return new DocInlineTag({
      childNodes: childNodes,
      tagName: tagName,
      tagContent: docInlineTagContent
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
        return this._backtrackAndCreateError(marker, 'Missing space before attribute name');
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
        'The HTML tag has invalid syntax; expecting an attribute or ">" or "/>"');
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

  /**
   * Returns the kind of the token immediately before the current token.
   */
  private _peekPreviousTokenKind(): TokenKind {
    if (this._tokenIndex === 0) {
      return TokenKind.None;
    }
    return this._tokens[this._tokenIndex - 1].kind;
  }

  private _createError(errorMessage: string): DocError {
    return this._backtrackAndCreateError(this._createMarker(), errorMessage);
  }

  /**
   * Rewind to the specified marker, read the next token, and report it as an error.
   * @remarks
   * If `endmarker` is specified, then the DocError will encompass the range of
   * tokens starting with `marker` up to (but not including) `endMarker`.
   * Otherwise, `endMarker` is taken to be `marker + 1`.
   */
  private _backtrackAndCreateError(marker: number, errorMessage: string,
    endMarker?: number): DocError {
    if (endMarker === undefined) {
      endMarker = marker + 1;
    }

    this._backtrack(marker);

    const tokens: Token[] = [];

    while (this._tokenIndex < endMarker) {
      tokens.push(this._readToken());
    }

    return new DocError({
      tokens: tokens,
      errorMessage,
      errorLocation: tokens[0].range
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
