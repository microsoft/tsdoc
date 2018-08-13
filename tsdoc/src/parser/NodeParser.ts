import { ParserContext } from './ParserContext';
import { Token, TokenKind } from './Token';
import { Tokenizer } from './Tokenizer';
import {
  DocBlockTag,
  DocCodeSpan,
  DocErrorText,
  DocEscapedText,
  DocHtmlAttribute,
  DocHtmlEndTag,
  DocHtmlStartTag,
  DocInlineTag,
  DocNode,
  DocPlainText,
  DocSoftBreak,
  EscapeStyle
} from '../nodes';
import { TokenRange } from './TokenRange';
import { Excerpt, IExcerptParameters } from './Excerpt';
import { TokenReader } from './TokenReader';
import { DocSection } from '../nodes/DocSection';

interface IFailure {
  // (We use "failureMessage" instead of "errorMessage" here so that DocErrorText doesn't
  // accidentally implement this interface.)
  failureMessage: string;
  failureLocation: TokenRange;
}

type ResultOrFailure<T> = T | IFailure;

function isFailure<T>(resultOrFailure: ResultOrFailure<T>): resultOrFailure is IFailure {
  return resultOrFailure !== undefined && resultOrFailure.hasOwnProperty('failureMessage');
}

export class NodeParser {
  // https://www.w3.org/TR/html5/syntax.html#tag-name
  // https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name
  private static readonly htmlNameRegExp: RegExp = /^[a-z]+(\-[a-z]+)*$/i;

  private static readonly tsdocTagNameRegExp: RegExp = /^[a-z][a-z0-9]*$/i;

  private readonly _parserContext: ParserContext;
  private readonly _tokenReader: TokenReader;

  public constructor(parserContext: ParserContext) {
    this._parserContext = parserContext;
    this._tokenReader = new TokenReader(parserContext);
  }

  public parse(): void {
    const childNodes: DocNode[] = [];

    let done: boolean = false;
    while (!done) {
      // Extract the next token
      switch (this._tokenReader.peekTokenKind()) {
        case TokenKind.EndOfInput:
          done = true;
          break;
        case TokenKind.Newline:
          this._pushAccumulatedPlainText(childNodes);
          const marker: number = this._tokenReader.createMarker();
          this._tokenReader.readToken();
          const tokenRange: TokenRange = this._createTokenRange(marker, this._tokenReader.createMarker());
          childNodes.push(new DocSoftBreak({
            excerpt: new Excerpt({ prefix: tokenRange })
          }));
          break;
        case TokenKind.Backslash:
          this._pushAccumulatedPlainText(childNodes);
          childNodes.push(this._parseBackslashEscape());
          break;
        case TokenKind.AtSign:
          this._pushAccumulatedPlainText(childNodes);
          childNodes.push(this._parseBlockTag());
          break;
        case TokenKind.LeftCurlyBracket:
          this._pushAccumulatedPlainText(childNodes);
          childNodes.push(this._parseInlineTag());
          break;
        case TokenKind.RightCurlyBracket:
          this._pushAccumulatedPlainText(childNodes);
          childNodes.push(this._createError(
            'The "}" character should be escaped using a backslash to avoid confusion with a TSDoc inline tag'));
          break;
        case TokenKind.LessThan:
          this._pushAccumulatedPlainText(childNodes);
          // Look ahead two tokens to see if this is "<a>" or "</a>".
          if (this._tokenReader.peekTokenAfterKind() === TokenKind.Slash) {
            childNodes.push(this._parseHtmlEndTag());
          } else {
            childNodes.push(this._parseHtmlStartTag());
          }
          break;
        case TokenKind.GreaterThan:
          this._pushAccumulatedPlainText(childNodes);
          childNodes.push(this._createError(
            'The ">" character should be escaped using a backslash to avoid confusion with an HTML tag'));
          break;
        case TokenKind.Backtick:
          this._pushAccumulatedPlainText(childNodes);
          childNodes.push(this._parseCodeSpan());
          break;
        default:
          // If nobody recognized this token, then accumulate plain text
          this._tokenReader.readToken();
          break;
      }
    }
    this._pushAccumulatedPlainText(childNodes);

    // TODO: Split the content into the appropriate sections.
    const remarksSection: DocSection = this._parserContext.docComment.remarks;
    for (const childNode of childNodes) {
      remarksSection.appendNode(childNode);
    }
  }

  private _pushAccumulatedPlainText(childNodes: DocNode[]): void {
    if (!this._tokenReader.isQueueEmpty()) {
      const plainTextRange: TokenRange = this._tokenReader.extractQueue();

      childNodes.push(new DocPlainText({
        text: plainTextRange.toString(),
        excerpt: new Excerpt({ prefix: plainTextRange })
      }));
    }
  }

  private _parseBackslashEscape(): DocNode {
    this._tokenReader.assertQueueEmpty();
    const marker: number = this._tokenReader.createMarker();

    this._tokenReader.readToken();

    if (this._tokenReader.peekTokenKind() === TokenKind.EndOfInput) {
      return this._backtrackAndCreateError(marker,
        'A backslash must precede another character that is being escaped');
    }

    const escapedToken: Token = this._tokenReader.readToken();

    // In CommonMark, a backslash is only allowed before a punctuation
    // character.  In all other contexts, the backslash is interpreted as a
    // literal character.
    if (!Tokenizer.isPunctuation(escapedToken.kind)) {
      return this._backtrackAndCreateError(marker,
        'A backslash can only be used to escape a punctuation character');
    }

    const tokenRange: TokenRange = this._tokenReader.extractQueue();

    return new DocEscapedText({
      excerpt: new Excerpt({ prefix: tokenRange }),
      escapeStyle: EscapeStyle.CommonMarkBackslash,
      text: escapedToken.toString()
    });
  }

  private _parseBlockTag(): DocNode {
    this._tokenReader.assertQueueEmpty();
    const marker: number = this._tokenReader.createMarker();

    if (this._tokenReader.peekTokenKind() !== TokenKind.AtSign) {
      return this._backtrackAndCreateError(marker, 'Expecting a TSDoc tag starting with "@"');
    }

    // "@one" is a valid TSDoc tag at the start of a line, but "@one@two" is
    // a syntax error.  For two tags it should be "@one @two", or for literal text it
    // should be "\@one\@two".
    switch (this._tokenReader.peekPreviousTokenKind()) {
      case TokenKind.None:
      case TokenKind.Spacing:
      case TokenKind.Newline:
        break;
      default:
        return this._backtrackAndCreateError(marker, 'A TSDoc tag must be preceded by whitespace');
    }

    // extract the @ sign
    let tagName: string = this._tokenReader.readToken().toString();

    while (this._tokenReader.peekTokenKind() === TokenKind.AsciiWord) {
      tagName += this._tokenReader.readToken().toString();
    }

    if (this._tokenReader.peekTokenKind() !== TokenKind.AsciiWord) {
      return this._backtrackAndCreateError(marker,
        'Expecting a TSDoc tag after the "@" character (or use a backslash to escape this character)');
    }

    switch (this._tokenReader.peekTokenKind()) {
      case TokenKind.None:
      case TokenKind.Spacing:
      case TokenKind.Newline:
      case TokenKind.EndOfInput:
        break;
      default:
        return this._backtrackAndCreateError(marker, 'A TSDoc tag must be followed by whitespace');
    }

    if (!NodeParser.tsdocTagNameRegExp.test(tagName)) {
      return this._backtrackAndCreateError(marker,
        'A TSDoc tag name must start with a letter and contain only letters and numbers');
    }

    return new DocBlockTag({
      excerpt: new Excerpt({ prefix: this._tokenReader.extractQueue() }),
      tagName
    });
  }

  private _parseInlineTag(): DocNode {
    this._tokenReader.assertQueueEmpty();
    const marker: number = this._tokenReader.createMarker();

    if (this._tokenReader.peekTokenKind() !== TokenKind.LeftCurlyBracket) {
      return this._backtrackAndCreateError(marker, 'Expecting a TSDoc tag starting with "{"');
    }
    this._tokenReader.readToken();

    if (this._tokenReader.peekTokenKind() !== TokenKind.AtSign) {
      return this._backtrackAndCreateError(marker, 'Expecting a TSDoc tag starting with "{@"');
    }

    // Read the tagName
    const tagNameMarker: number = this._tokenReader.createMarker();
    let tagName: string = this._tokenReader.readToken().toString();

    while (this._tokenReader.peekTokenKind() === TokenKind.AsciiWord) {
      tagName += this._tokenReader.readToken().toString();
    }

    if (tagName.length === 0) {
      const failure: IFailure = this._createFailureForTokensSince(
        'Expecting a TSDoc inline tag name after the "{@" characters', tagNameMarker);
      return this._backtrackAndCreateErrorForFailure(marker, '', failure);
    }

    if (!NodeParser.tsdocTagNameRegExp.test(tagName)) {
      const failure: IFailure = this._createFailureForTokensSince(
        'A TSDoc tag name must start with a letter and contain only letters and numbers', tagNameMarker);
      return this._backtrackAndCreateErrorForFailure(marker, '', failure);
    }

    // We include the space in tagContent in case the implementor wants to assign some
    // special meaning to spaces for their tag.
    let tagContent: string = this._readSpacingAndNewlines();
    if (tagContent.length === 0) {
      // If there were no spaces at all, that's an error unless it's the degenerate "{@tag}" case
      if (this._tokenReader.peekTokenKind() !== TokenKind.RightCurlyBracket) {
        const failure: IFailure = this._createFailureForToken(
          'Expecting a space after the TSDoc inline tag name');
        return this._backtrackAndCreateErrorForFailure(marker, '', failure);
      }
    }

    let done: boolean = false;
    while (!done) {
      switch (this._tokenReader.peekTokenKind()) {
        case TokenKind.EndOfInput:
          return this._backtrackAndCreateError(marker,
            'The TSDoc inline tag name is missing its closing "}"');
        case TokenKind.Backslash:
          // http://usejsdoc.org/about-block-inline-tags.html
          // "If your tag's text includes a closing curly brace (}), you must escape it with
          // a leading backslash (\)."
          this._tokenReader.readToken(); // discard the backslash

          // In CommonMark, a backslash is only allowed before a punctuation
          // character.  In all other contexts, the backslash is interpreted as a
          // literal character.
          if (!Tokenizer.isPunctuation(this._tokenReader.peekTokenKind())) {
            const failure: IFailure = this._createFailureForToken(
              'A backslash can only be used to escape a punctuation character');
            return this._backtrackAndCreateErrorForFailure(marker, 'Error reading inline TSDoc tag: ', failure);
          }

          tagContent += this._tokenReader.readToken().toString();
          break;
        case TokenKind.LeftCurlyBracket:
          {
            const failure: IFailure = this._createFailureForToken(
              'The "{" character must be escaped with a backslash when used inside a TSDoc inline tag');
            return this._backtrackAndCreateErrorForFailure(marker, '' , failure);
          }
        case TokenKind.RightCurlyBracket:
          this._tokenReader.readToken();
          done = true;
          break;
        default:
          tagContent += this._tokenReader.readToken().toString();
          break;
      }
    }

    return new DocInlineTag({
      excerpt: new Excerpt({ prefix: this._tokenReader.extractQueue() }),
      tagName: tagName,
      tagContent: tagContent
    });
  }

  private _parseHtmlStartTag(): DocNode {
    this._tokenReader.assertQueueEmpty();
    const marker: number = this._tokenReader.createMarker();

    // Read the "<" delimiter
    const lessThanToken: Token = this._tokenReader.readToken();
    if (lessThanToken.kind !== TokenKind.LessThan) {
      return this._backtrackAndCreateError(marker, 'Expecting an HTML tag starting with "<"');
    }

    // NOTE: CommonMark does not permit whitespace after the "<"

    const elementName: ResultOrFailure<string> = this._parseHtmlName();
    if (isFailure(elementName)) {
      return this._backtrackAndCreateErrorForFailure(marker, 'Expecting an HTML element name: ', elementName);
    }

    const spacingAfterElementName: string = this._readSpacingAndNewlines();

    // Extract everything from the "<" up to the start of the first attribute and make that
    // the Excerpt prefix.  Example: "<table "
    const excerptParameters: IExcerptParameters = {
      prefix: this._tokenReader.extractQueue()
    };

    const htmlAttributes: DocHtmlAttribute[] = [];

    // Read the attributes until we see a ">" or "/>"
    while (true) {
      if (this._tokenReader.peekTokenAfterKind() !== TokenKind.AsciiWord) {
        break;
      }

      // Read the attribute
      const attributeNode: ResultOrFailure<DocHtmlAttribute> = this._parseHtmlAttribute();
      if (isFailure(attributeNode)) {
        return this._backtrackAndCreateErrorForFailure(marker, 'Problem parsing HTML attribute: ', attributeNode);
      }

      htmlAttributes.push(attributeNode);
    }

    // Read the closing "/>" or ">" as the Excerpt.suffix
    this._tokenReader.assertQueueEmpty();
    const endDelimiterMarker: number = this._tokenReader.createMarker();

    let selfClosingTag: boolean = false;
    if (this._tokenReader.peekTokenKind() === TokenKind.Slash) {
      this._tokenReader.readToken();
      selfClosingTag = true;
    }
    if (this._tokenReader.peekTokenKind() !== TokenKind.GreaterThan) {
      const failure: IFailure = this._createFailureForTokensSince(
        'Expecting an attribute or ">" or "/>"', endDelimiterMarker);
      return this._backtrackAndCreateErrorForFailure(marker, 'The HTML tag has invalid syntax: ', failure);
    }
    this._tokenReader.readToken();
    excerptParameters.suffix = this._tokenReader.extractQueue();

    // NOTE: We don't read excerptParameters.separator here, since if there is any it
    // will be represented as DocPlainText.

    return new DocHtmlStartTag({
      excerpt: new Excerpt(excerptParameters),
      elementName,
      spacingAfterElementName,
      htmlAttributes,
      selfClosingTag
    });
  }

  private _parseHtmlAttribute(): ResultOrFailure<DocHtmlAttribute> {
    // Read the attribute name
    const attributeName: ResultOrFailure<string> = this._parseHtmlName();
    if (isFailure(attributeName)) {
      return attributeName;
    }

    const spacingAfterAttributeName: string = this._readSpacingAndNewlines();

    if (this._tokenReader.peekTokenKind() !== TokenKind.Equals) {
      return this._createFailureForToken('Expecting "=" after HTML attribute name');
    }
    this._tokenReader.readToken();

    const spacingBeforeAttributeValue: string = this._readSpacingAndNewlines();

    const attributeValue: ResultOrFailure<string> = this._parseHtmlString();
    if (isFailure(attributeValue)) {
      return attributeValue;
    }

    const excerptParameters: IExcerptParameters = {
      prefix: this._tokenReader.extractQueue()
    };

    const spacingAfterAttributeValue: string = this._readSpacingAndNewlines();
    excerptParameters.separator = this._tokenReader.extractQueue();

    return new DocHtmlAttribute({
      excerpt: new Excerpt(excerptParameters),
      attributeName,
      spacingAfterAttributeName,
      attributeValue,
      spacingBeforeAttributeValue,
      spacingAfterAttributeValue
    });
  }

  private _parseHtmlString(): ResultOrFailure<string> {
    const marker: number = this._tokenReader.createMarker();
    const quoteTokenKind: TokenKind = this._tokenReader.peekTokenKind();
    if (quoteTokenKind !== TokenKind.DoubleQuote && quoteTokenKind !== TokenKind.SingleQuote) {
      return this._createFailureForToken(
        'Expecting an HTML string starting with a single-quote or double-quote character');
    }
    this._tokenReader.readToken();

    let textWithoutQuotes: string = '';

    while (true) {
      const peekedTokenKind: TokenKind = this._tokenReader.peekTokenKind();
      // Did we find the matching token?
      if (peekedTokenKind === quoteTokenKind) {
        this._tokenReader.readToken(); // extract the quote
        break;
      }
      if (peekedTokenKind === TokenKind.EndOfInput ||  peekedTokenKind === TokenKind.Newline) {
        return this._createFailureForToken('The HTML string is missing its closing quote', marker);
      }
      textWithoutQuotes += this._tokenReader.readToken().toString();
    }

    return textWithoutQuotes;
  }

  private _parseHtmlEndTag(): DocNode {
    this._tokenReader.assertQueueEmpty();
    const marker: number = this._tokenReader.createMarker();

    // Read the "<" delimiter
    const lessThanToken: Token = this._tokenReader.readToken();
    if (lessThanToken.kind !== TokenKind.LessThan) {
      return this._backtrackAndCreateError(marker, 'Expecting an HTML tag starting with "</"');
    }
    const slashToken: Token = this._tokenReader.peekToken();
    if (slashToken.kind !== TokenKind.Slash) {
      return this._backtrackAndCreateError(marker, 'Expecting an HTML tag starting with "</"');
    }

    // NOTE: Spaces are not permitted here
    // https://www.w3.org/TR/html5/syntax.html#end-tags

    // Read the tag name
    const elementName: ResultOrFailure<string> = this._parseHtmlName();
    if (isFailure(elementName)) {
      return this._backtrackAndCreateErrorForFailure(marker, 'Expecting an HTML element name: ', elementName);
    }

    this._readSpacingAndNewlines();

    // Read the closing ">"
    if (this._tokenReader.peekTokenKind() !== TokenKind.GreaterThan) {
      return this._backtrackAndCreateError(marker, 'Expecting a closing ">" for the HTML tag');
    }

    return new DocHtmlEndTag({
      excerpt: new Excerpt({ prefix: this._tokenReader.extractQueue() }),
      elementName
    });
  }

  /**
   * Parses an HTML name such as an element name or attribute name.
   */
  private _parseHtmlName(): ResultOrFailure<string> {
    let htmlName: string = '';

    const marker: number = this._tokenReader.createMarker();

    let done: boolean = false;
    while (!done) {
      switch (this._tokenReader.peekTokenKind()) {
        case TokenKind.AsciiWord:
        case TokenKind.Hyphen:
          htmlName += this._tokenReader.readToken().toString();
          break;
        default:
          done = true;
          break;
      }
    }

    if (htmlName.length === 0) {
      return this._createFailureForToken('Expecting an HTML name');
    }

    if (!NodeParser.htmlNameRegExp.test(htmlName)) {
      return this._createFailureForTokensSince(
        'An HTML name must be a sequence of letters separated by hyphens', marker);
    }

    return htmlName;
  }

  private _parseCodeSpan(): DocNode {
    this._tokenReader.assertQueueEmpty();
    const marker: number = this._tokenReader.createMarker();

    // Parse the opening backtick
    if (this._tokenReader.peekTokenKind() !== TokenKind.Backtick) {
      return this._createError('Expecting a code span starting with a backtick character "`"');
    }

    switch (this._tokenReader.peekPreviousTokenKind()) {
      case TokenKind.Spacing:
      case TokenKind.Newline:
      case TokenKind.None:
        break;
      default:
        return this._createError('The opening backtick for a code span must be preceded by whitespace');
    }

    this._tokenReader.readToken(); // read the backtick

    let text: string = '';

    // Parse the content backtick
    while (true) {
      const peekedTokenKind: TokenKind = this._tokenReader.peekTokenKind();
      // Did we find the matching token?
      if (peekedTokenKind === TokenKind.Backtick) {
        this._tokenReader.readToken();
        break;
      }
      if (peekedTokenKind === TokenKind.EndOfInput ||  peekedTokenKind === TokenKind.Newline) {
        return this._backtrackAndCreateError(marker,
          'The code span is missing its closing backtick');
      }
      text += this._tokenReader.readToken().toString();
    }

    // Make sure there's whitespace after
    switch (this._tokenReader.peekTokenKind()) {
      case TokenKind.Spacing:
      case TokenKind.EndOfInput:
      case TokenKind.Newline:
        break;
      default:
        const failure: IFailure = this._createFailureForToken(
          'The closing backtick for a code span must be followed by whitespace');
        return this._backtrackAndCreateErrorForFailure(marker, 'Error parsing code span: ', failure);
    }

    return new DocCodeSpan({
      excerpt: new Excerpt({ prefix: this._tokenReader.extractQueue() }),
      text
    });
  }

  private _readSpacingAndNewlines(): string {
    let result: string = '';

    let done: boolean = false;
    do {
      switch (this._tokenReader.peekTokenKind()) {
        case TokenKind.Spacing:
        case TokenKind.Newline:
          result += this._tokenReader.readToken().toString();
          break;
        default:
          done = true;
          break;
      }
    } while (!done);

    return result;
  }

  /**
   * Read the next token, and report it as a DocErrorText node.
   */
  private _createError(errorMessage: string): DocErrorText {
    this._tokenReader.readToken();

    const tokenRange: TokenRange = this._tokenReader.extractQueue();

    return new DocErrorText({
      excerpt: new Excerpt({ prefix: tokenRange }),
      text: tokenRange.toString(),
      errorMessage,
      errorLocation: tokenRange
    });
  }

  /**
   * Rewind to the specified marker, read the next token, and report it as a DocErrorText node.
   */
  private _backtrackAndCreateError(marker: number, errorMessage: string): DocErrorText {
    this._tokenReader.backtrackToMarker(marker);
    return this._createError(errorMessage);
  }

  /**
   * Rewind to the specified marker, read the next token, and report it as a DocErrorText node
   * whose location is based on an IFailure.
   */
  private _backtrackAndCreateErrorForFailure(marker: number, errorMessagePrefix: string,
    failure: IFailure): DocErrorText {

    this._tokenReader.backtrackToMarker(marker);
    this._tokenReader.readToken();

    const tokenRange: TokenRange = this._tokenReader.extractQueue();

    return new DocErrorText({
      excerpt: new Excerpt({ prefix: tokenRange }),
      text: tokenRange.toString(),
      errorMessage: errorMessagePrefix + failure.failureMessage,
      errorLocation: failure.failureLocation
    });
  }

  /**
   * Creates an IFailure whose TokenRange is a single token.  If a marker is not specified,
   * then it is the current token.
   */
  private _createFailureForToken(failureMessage: string, tokenMarker?: number): IFailure {
    if (!tokenMarker) {
      tokenMarker = this._tokenReader.createMarker();
    }
    return {
      failureMessage,
      failureLocation: this._createTokenRange(tokenMarker, tokenMarker + 1)
    };
  }

  /**
   * Creates an IFailure whose TokenRange starts from the specified marker and
   * encompases all tokens read since then.  If none were read, then the next token used.
   */
  private _createFailureForTokensSince(failureMessage: string, startMarker: number): IFailure {
    let endMarker: number = this._tokenReader.createMarker();
    if (endMarker < startMarker) {
      // This would be a parser bug
      throw new Error('Invalid startMarker');
    }
    if (endMarker === startMarker) {
      ++endMarker;
    }
    return {
      failureMessage,
      failureLocation: this._createTokenRange(startMarker, endMarker)
    };
  }

  private _createTokenRange(pos: number, end: number): TokenRange {
    return new TokenRange({ parserContext: this._parserContext, pos, end });
  }
}
