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
import { TokenSequence } from './TokenSequence';
import { Excerpt, IExcerptParameters } from './Excerpt';
import { TokenReader } from './TokenReader';
import { StringChecks } from './StringChecks';

interface IFailure {
  // (We use "failureMessage" instead of "errorMessage" here so that DocErrorText doesn't
  // accidentally implement this interface.)
  failureMessage: string;
  failureLocation: TokenSequence;
}

type ResultOrFailure<T> = T | IFailure;

function isFailure<T>(resultOrFailure: ResultOrFailure<T>): resultOrFailure is IFailure {
  return resultOrFailure !== undefined && resultOrFailure.hasOwnProperty('failureMessage');
}

/**
 * This class manages the first phase of the parser, which constructs
 * ParserContext.verbatimSection, which is a literal representation of the DocNode
 * objects as they appeared in the input stream.
 *
 * The DocCommentAssembler will then reorganize these nodes into a DocComment object.
 */
export class NodeParser {
  // https://www.w3.org/TR/html5/syntax.html#tag-name
  // https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name
  private static readonly htmlNameRegExp: RegExp = /^[a-z]+(\-[a-z]+)*$/i;

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
          this._tokenReader.readToken();
          childNodes.push(new DocSoftBreak({
            excerpt: new Excerpt({ content: this._tokenReader.extractAccumulatedSequence() })
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

    this._parserContext.verbatimSection.appendNodes(childNodes);
  }

  private _pushAccumulatedPlainText(childNodes: DocNode[]): void {
    if (!this._tokenReader.isAccumulatedSequenceEmpty()) {
      const plainTextSequence: TokenSequence = this._tokenReader.extractAccumulatedSequence();

      childNodes.push(new DocPlainText({
        text: plainTextSequence.toString(),
        excerpt: new Excerpt({ content: plainTextSequence })
      }));
    }
  }

  private _parseBackslashEscape(): DocNode {
    this._tokenReader.assertAccumulatedSequenceIsEmpty();
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

    const tokenSequence: TokenSequence = this._tokenReader.extractAccumulatedSequence();

    return new DocEscapedText({
      excerpt: new Excerpt({ content: tokenSequence }),
      escapeStyle: EscapeStyle.CommonMarkBackslash,
      text: escapedToken.toString()
    });
  }

  private _parseBlockTag(): DocNode {
    this._tokenReader.assertAccumulatedSequenceIsEmpty();
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

    // Include the "@" as part of the tagName
    let tagName: string = this._tokenReader.readToken().toString();

    if (this._tokenReader.peekTokenKind() !== TokenKind.AsciiWord) {
      return this._backtrackAndCreateError(marker,
        'Expecting a TSDoc tag name after the "@" character (or use a backslash to escape this character)');
    }

    const tagNameMarker: number = this._tokenReader.createMarker();

    while (this._tokenReader.peekTokenKind() === TokenKind.AsciiWord) {
      tagName += this._tokenReader.readToken().toString();
    }

    if (tagName.length === 0) {
      return this._backtrackAndCreateError(marker, 'Expecting an inline TSDoc tag name immediately after "{@"');
    }

    if (StringChecks.explainIfNotTSDocTagName(tagName)) {
      const failure: IFailure = this._createFailureForTokensSince(
        'A TSDoc tag name must start with a letter and contain only letters and numbers', tagNameMarker);
      return this._backtrackAndCreateErrorForFailure(marker, '', failure);
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

    return new DocBlockTag({
      excerpt: new Excerpt({ content: this._tokenReader.extractAccumulatedSequence() }),
      tagName
    });
  }

  private _parseInlineTag(): DocNode {
    this._tokenReader.assertAccumulatedSequenceIsEmpty();
    const marker: number = this._tokenReader.createMarker();

    if (this._tokenReader.peekTokenKind() !== TokenKind.LeftCurlyBracket) {
      return this._backtrackAndCreateError(marker, 'Expecting a TSDoc tag starting with "{"');
    }
    this._tokenReader.readToken();

    // For inline tags, if we handle errors by backtracking to the "{"  token, then the main loop
    // will then interpret the "@" as a block tag, which is almost certainly incorrect.  So the
    // DocErrorText needs to include both the "{" and "@" tokens.
    // We will use _backtrackAndCreateErrorRangeForFailure() for that.
    const atSignMarker: number = this._tokenReader.createMarker();

    if (this._tokenReader.peekTokenKind() !== TokenKind.AtSign) {
      return this._backtrackAndCreateError(marker, 'Expecting a TSDoc tag starting with "{@"');
    }

    // Include the "@" as part of the tagName
    const tagNameMarker: number = this._tokenReader.createMarker();
    let tagName: string = this._tokenReader.readToken().toString();

    while (this._tokenReader.peekTokenKind() === TokenKind.AsciiWord) {
      tagName += this._tokenReader.readToken().toString();
    }

    if (tagName === '@') {
      // This is an unusual case
      const failure: IFailure = this._createFailureForTokensSince(
        'Expecting a TSDoc inline tag name after the "{@" characters', tagNameMarker);
      return this._backtrackAndCreateErrorRangeForFailure(marker, atSignMarker, '', failure);
    }

    if (StringChecks.explainIfNotTSDocTagName(tagName)) {
      const failure: IFailure = this._createFailureForTokensSince(
        'A TSDoc tag name must start with a letter and contain only letters and numbers', tagNameMarker);
      return this._backtrackAndCreateErrorRangeForFailure(marker, atSignMarker, '', failure);
    }

    // We include the space in tagContent in case the implementor wants to assign some
    // special meaning to spaces for their tag.
    let tagContent: string = this._readSpacingAndNewlines();
    if (tagContent.length === 0) {
      // If there were no spaces at all, that's an error unless it's the degenerate "{@tag}" case
      if (this._tokenReader.peekTokenKind() !== TokenKind.RightCurlyBracket) {
        const failure: IFailure = this._createFailureForToken(
          'Expecting a space after the TSDoc inline tag name');
        return this._backtrackAndCreateErrorRangeForFailure(marker, atSignMarker, '', failure);
      }
    }

    let done: boolean = false;
    while (!done) {
      switch (this._tokenReader.peekTokenKind()) {
        case TokenKind.EndOfInput:
          return this._backtrackAndCreateErrorRange(marker, atSignMarker,
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
              return this._backtrackAndCreateErrorRangeForFailure(marker, atSignMarker,
                'Error reading inline TSDoc tag: ', failure);
          }

          tagContent += this._tokenReader.readToken().toString();
          break;
        case TokenKind.LeftCurlyBracket:
          {
            const failure: IFailure = this._createFailureForToken(
              'The "{" character must be escaped with a backslash when used inside a TSDoc inline tag');
              return this._backtrackAndCreateErrorRangeForFailure(marker, atSignMarker, '' , failure);
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
      excerpt: new Excerpt({ content: this._tokenReader.extractAccumulatedSequence() }),
      tagName: tagName,
      tagContent: tagContent
    });
  }

  private _parseHtmlStartTag(): DocNode {
    this._tokenReader.assertAccumulatedSequenceIsEmpty();
    const marker: number = this._tokenReader.createMarker();

    // Read the "<" delimiter
    const lessThanToken: Token = this._tokenReader.readToken();
    if (lessThanToken.kind !== TokenKind.LessThan) {
      return this._backtrackAndCreateError(marker, 'Expecting an HTML tag starting with "<"');
    }

    // NOTE: CommonMark does not permit whitespace after the "<"

    const openingDelimiterExcerptParameters: IExcerptParameters = {
      content: this._tokenReader.extractAccumulatedSequence()
    };

    // Read the element name
    const elementName: ResultOrFailure<string> = this._parseHtmlName();
    if (isFailure(elementName)) {
      return this._backtrackAndCreateErrorForFailure(marker, 'Invalid HTML element: ', elementName);
    }

    const elementNameExcerptParameters: IExcerptParameters = {
      content: this._tokenReader.extractAccumulatedSequence()
    };

    const spacingAfterElementName: string = this._readSpacingAndNewlines();
    elementNameExcerptParameters.spacingAfterContent = this._tokenReader.tryExtractAccumulatedSequence();

    const htmlAttributes: DocHtmlAttribute[] = [];

    // Read the attributes until we see a ">" or "/>"
    while (this._tokenReader.peekTokenKind() === TokenKind.AsciiWord) {
      // Read the attribute
      const attributeNode: ResultOrFailure<DocHtmlAttribute> = this._parseHtmlAttribute();
      if (isFailure(attributeNode)) {
        return this._backtrackAndCreateErrorForFailure(marker,
          'The HTML element has an invalid attribute: ', attributeNode);
      }

      htmlAttributes.push(attributeNode);
    }

    // Read the closing "/>" or ">" as the Excerpt.suffix
    this._tokenReader.assertAccumulatedSequenceIsEmpty();
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

    const closingDelimiterExcerptParameters: IExcerptParameters = {
      content: this._tokenReader.extractAccumulatedSequence()
    };

    // NOTE: We don't read excerptParameters.separator here, since if there is any it
    // will be represented as DocPlainText.

    return new DocHtmlStartTag({
      openingDelimiterExcerpt: new Excerpt(openingDelimiterExcerptParameters),

      elementNameExcerpt: new Excerpt(elementNameExcerptParameters),
      elementName,
      spacingAfterElementName,

      htmlAttributes,

      selfClosingTag,

      closingDelimiterExcerpt: new Excerpt(closingDelimiterExcerptParameters)
    });
  }

  private _parseHtmlAttribute(): ResultOrFailure<DocHtmlAttribute> {
    this._tokenReader.assertAccumulatedSequenceIsEmpty();

    // Read the attribute name
    const attributeName: ResultOrFailure<string> = this._parseHtmlName();
    if (isFailure(attributeName)) {
      return attributeName;
    }

    const attributeNameExcerptParameters: IExcerptParameters = {
      content: this._tokenReader.extractAccumulatedSequence()
    };

    const spacingAfterAttributeName: string = this._readSpacingAndNewlines();
    attributeNameExcerptParameters.spacingAfterContent = this._tokenReader.tryExtractAccumulatedSequence();

    // Read the equals
    if (this._tokenReader.peekTokenKind() !== TokenKind.Equals) {
      return this._createFailureForToken('Expecting "=" after HTML attribute name');
    }
    this._tokenReader.readToken();

    const equalsExcerptParameters: IExcerptParameters = {
      content: this._tokenReader.extractAccumulatedSequence()
    };

    const spacingAfterEquals: string = this._readSpacingAndNewlines();
    equalsExcerptParameters.spacingAfterContent = this._tokenReader.tryExtractAccumulatedSequence();

    // Read the attribute value
    const attributeValue: ResultOrFailure<string> = this._parseHtmlString();
    if (isFailure(attributeValue)) {
      return attributeValue;
    }

    const attributeValueExcerptParameters: IExcerptParameters = {
      content: this._tokenReader.extractAccumulatedSequence()
    };

    const spacingAfterAttributeValue: string = this._readSpacingAndNewlines();
    attributeValueExcerptParameters.spacingAfterContent = this._tokenReader.tryExtractAccumulatedSequence();

    return new DocHtmlAttribute({
      attributeNameExcerpt: new Excerpt(attributeNameExcerptParameters),
      attributeName,
      spacingAfterAttributeName,

      equalsExcerpt: new Excerpt(equalsExcerptParameters),
      spacingAfterEquals,

      attributeValueExcerpt: new Excerpt(attributeValueExcerptParameters),
      attributeValue,
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

    // The next attribute cannot start immedaitely after this one
    if (this._tokenReader.peekTokenKind() === TokenKind.AsciiWord) {
      return this._createFailureForToken(
        'The next character after a closing quote must be spacing or punctuation');
    }

    return textWithoutQuotes;
  }

  private _parseHtmlEndTag(): DocNode {
    this._tokenReader.assertAccumulatedSequenceIsEmpty();
    const marker: number = this._tokenReader.createMarker();

    // Read the "</" delimiter
    const lessThanToken: Token = this._tokenReader.peekToken();
    if (lessThanToken.kind !== TokenKind.LessThan) {
      return this._backtrackAndCreateError(marker, 'Expecting an HTML tag starting with "</"');
    }
    this._tokenReader.readToken();

    const slashToken: Token = this._tokenReader.peekToken();
    if (slashToken.kind !== TokenKind.Slash) {
      return this._backtrackAndCreateError(marker, 'Expecting an HTML tag starting with "</"');
    }
    this._tokenReader.readToken();

    // NOTE: Spaces are not permitted here
    // https://www.w3.org/TR/html5/syntax.html#end-tags

    const openingDelimiterExcerptParameters: IExcerptParameters = {
      content: this._tokenReader.extractAccumulatedSequence()
    };

    // Read the tag name
    const elementName: ResultOrFailure<string> = this._parseHtmlName();
    if (isFailure(elementName)) {
      return this._backtrackAndCreateErrorForFailure(marker, 'Expecting an HTML element name: ', elementName);
    }

    const elementNameExcerptParameters: IExcerptParameters = {
      content: this._tokenReader.extractAccumulatedSequence()
    };

    this._readSpacingAndNewlines();
    elementNameExcerptParameters.spacingAfterContent = this._tokenReader.tryExtractAccumulatedSequence();

    // Read the closing ">"
    if (this._tokenReader.peekTokenKind() !== TokenKind.GreaterThan) {
      const failure: IFailure = this._createFailureForToken('Expecting a closing ">" for the HTML tag');
      return this._backtrackAndCreateErrorForFailure(marker, '', failure);
    }
    this._tokenReader.readToken();

    const closingDelimiterExcerptParameters: IExcerptParameters = {
      content: this._tokenReader.extractAccumulatedSequence()
    };

    return new DocHtmlEndTag({
      openingDelimiterExcerpt: new Excerpt(openingDelimiterExcerptParameters),

      elementNameExcerpt: new Excerpt(elementNameExcerptParameters),
      elementName,

      closingDelimiterExcerpt: new Excerpt(closingDelimiterExcerptParameters)
    });
  }

  /**
   * Parses an HTML name such as an element name or attribute name.
   */
  private _parseHtmlName(): ResultOrFailure<string> {
    let htmlName: string = '';

    const marker: number = this._tokenReader.createMarker();

    if (this._tokenReader.peekTokenKind() === TokenKind.Spacing) {
      return this._createFailureForTokensSince('A space is not allowed here', marker);
    }

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
    this._tokenReader.assertAccumulatedSequenceIsEmpty();
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
    let closingBacktickMarker: number;

    // Parse the content backtick
    while (true) {
      const peekedTokenKind: TokenKind = this._tokenReader.peekTokenKind();
      // Did we find the matching token?
      if (peekedTokenKind === TokenKind.Backtick) {
        closingBacktickMarker = this._tokenReader.createMarker();
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
          'The closing backtick for a code span must be followed by whitespace', closingBacktickMarker);
        return this._backtrackAndCreateErrorForFailure(marker, 'Error parsing code span: ', failure);
    }

    return new DocCodeSpan({
      excerpt: new Excerpt({ content: this._tokenReader.extractAccumulatedSequence() }),
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

    const tokenSequence: TokenSequence = this._tokenReader.extractAccumulatedSequence();

    return new DocErrorText({
      excerpt: new Excerpt({ content: tokenSequence }),
      text: tokenSequence.toString(),
      errorMessage,
      errorLocation: tokenSequence
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
   * Rewind to the errorStartMarker, read the tokens up to and including errorInclusiveEndMarker,
   * and report it as a DocErrorText node.
   */
  private _backtrackAndCreateErrorRange(errorStartMarker: number, errorInclusiveEndMarker: number,
    errorMessage: string): DocErrorText {

    this._tokenReader.backtrackToMarker(errorStartMarker);
    while (this._tokenReader.createMarker() !== errorInclusiveEndMarker) {
      this._tokenReader.readToken();
    }
    if (this._tokenReader.peekTokenKind() !== TokenKind.EndOfInput) {
      this._tokenReader.readToken();
    }

    const tokenSequence: TokenSequence = this._tokenReader.extractAccumulatedSequence();

    return new DocErrorText({
      excerpt: new Excerpt({ content: tokenSequence }),
      text: tokenSequence.toString(),
      errorMessage: errorMessage,
      errorLocation: tokenSequence
    });
  }

  /**
   * Rewind to the specified marker, read the next token, and report it as a DocErrorText node
   * whose location is based on an IFailure.
   */
  private _backtrackAndCreateErrorForFailure(marker: number, errorMessagePrefix: string,
    failure: IFailure): DocErrorText {

    this._tokenReader.backtrackToMarker(marker);
    this._tokenReader.readToken();

    const tokenSequence: TokenSequence = this._tokenReader.extractAccumulatedSequence();

    return new DocErrorText({
      excerpt: new Excerpt({ content: tokenSequence }),
      text: tokenSequence.toString(),
      errorMessage: errorMessagePrefix + failure.failureMessage,
      errorLocation: failure.failureLocation
    });
  }

  /**
   * Rewind to the errorStartMarker, read the tokens up to and including errorInclusiveEndMarker,
   * and report it as a DocErrorText node whose location is based on an IFailure.
   */
  private _backtrackAndCreateErrorRangeForFailure(errorStartMarker: number,
    errorInclusiveEndMarker: number, errorMessagePrefix: string, failure: IFailure): DocErrorText {

    this._tokenReader.backtrackToMarker(errorStartMarker);
    while (this._tokenReader.createMarker() !== errorInclusiveEndMarker) {
      this._tokenReader.readToken();
    }
    if (this._tokenReader.peekTokenKind() !== TokenKind.EndOfInput) {
      this._tokenReader.readToken();
    }

    const tokenSequence: TokenSequence = this._tokenReader.extractAccumulatedSequence();

    return new DocErrorText({
      excerpt: new Excerpt({ content: tokenSequence }),
      text: tokenSequence.toString(),
      errorMessage: errorMessagePrefix + failure.failureMessage,
      errorLocation: failure.failureLocation
    });
  }

  /**
   * Creates an IFailure whose TokenSequence is a single token.  If a marker is not specified,
   * then it is the current token.
   */
  private _createFailureForToken(failureMessage: string, tokenMarker?: number): IFailure {
    if (!tokenMarker) {
      tokenMarker = this._tokenReader.createMarker();
    }

    const tokenSequence: TokenSequence = new TokenSequence({
      parserContext: this._parserContext,
      startIndex: tokenMarker,
      endIndex: tokenMarker + 1
    });

    return {
      failureMessage,
      failureLocation: tokenSequence
    };
  }

  /**
   * Creates an IFailure whose TokenSequence starts from the specified marker and
   * encompasses all tokens read since then.  If none were read, then the next token used.
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

    const tokenSequence: TokenSequence = new TokenSequence({
      parserContext: this._parserContext,
      startIndex: startMarker,
      endIndex: endMarker
    });

    return {
      failureMessage,
      failureLocation: tokenSequence
    };
  }
}
