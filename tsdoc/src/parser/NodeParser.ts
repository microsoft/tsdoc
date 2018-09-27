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
  EscapeStyle,
  DocComment,
  DocBlock,
  DocNodeKind,
  DocSection,
  DocParamBlock,
  DocCodeFence
} from '../nodes';
import { TokenSequence } from './TokenSequence';
import { Excerpt, IExcerptParameters } from './Excerpt';
import { TokenReader } from './TokenReader';
import { StringChecks } from './StringChecks';
import { ModifierTagSet } from '../details/ModifierTagSet';
import { TSDocParserConfiguration } from './TSDocParserConfiguration';
import {
  TSDocTagDefinition,
  TSDocTagSyntaxKind
} from './TSDocTagDefinition';
import { StandardTags } from '../details/StandardTags';

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
 * The main parser for TSDoc comments.
 */
export class NodeParser {
  // https://www.w3.org/TR/html5/syntax.html#tag-name
  // https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name
  private static readonly htmlNameRegExp: RegExp = /^[a-z]+(\-[a-z]+)*$/i;

  private readonly _parserContext: ParserContext;
  private _currentSection: DocSection;

  public constructor(parserContext: ParserContext) {
    this._parserContext = parserContext;

    this._currentSection = parserContext.docComment.summarySection;
  }

  public parse(): void {
    const tokenReader: TokenReader = new TokenReader(this._parserContext);

    let done: boolean = false;
    while (!done) {
      // Extract the next token
      switch (tokenReader.peekTokenKind()) {
        case TokenKind.EndOfInput:
          done = true;
          break;
        case TokenKind.Newline:
          this._pushAccumulatedPlainText(tokenReader);
          tokenReader.readToken();
          this._pushParagraphNode(new DocSoftBreak({
            excerpt: new Excerpt({ content: tokenReader.extractAccumulatedSequence() })
          }));
          break;
        case TokenKind.Backslash:
          this._pushAccumulatedPlainText(tokenReader);
          this._pushParagraphNode(this._parseBackslashEscape(tokenReader));
          break;
        case TokenKind.AtSign:
          this._pushAccumulatedPlainText(tokenReader);
          this._parseAndPushBlock(tokenReader);
          break;
        case TokenKind.LeftCurlyBracket:
          this._pushAccumulatedPlainText(tokenReader);
          this._pushParagraphNode(this._parseInlineTag(tokenReader));
          break;
        case TokenKind.RightCurlyBracket:
          this._pushAccumulatedPlainText(tokenReader);
          this._pushParagraphNode(this._createError(tokenReader,
            'The "}" character should be escaped using a backslash to avoid confusion with a TSDoc inline tag'));
          break;
        case TokenKind.LessThan:
          this._pushAccumulatedPlainText(tokenReader);
          // Look ahead two tokens to see if this is "<a>" or "</a>".
          if (tokenReader.peekTokenAfterKind() === TokenKind.Slash) {
            this._pushParagraphNode(this._parseHtmlEndTag(tokenReader));
          } else {
            this._pushParagraphNode(this._parseHtmlStartTag(tokenReader));
          }
          break;
        case TokenKind.GreaterThan:
          this._pushAccumulatedPlainText(tokenReader);
          this._pushParagraphNode(this._createError(tokenReader,
            'The ">" character should be escaped using a backslash to avoid confusion with an HTML tag'));
          break;
        case TokenKind.Backtick:
          this._pushAccumulatedPlainText(tokenReader);

          if (tokenReader.peekTokenAfterKind() === TokenKind.Backtick
            && tokenReader.peekTokenAfterAfterKind() === TokenKind.Backtick) {
            this._pushSectionNode(this._parseCodeFence(tokenReader));
          } else {
            this._pushParagraphNode(this._parseCodeSpan(tokenReader));
          }
          break;
        default:
          // If nobody recognized this token, then accumulate plain text
          tokenReader.readToken();
          break;
      }
    }
    this._pushAccumulatedPlainText(tokenReader);
  }

  private _pushAccumulatedPlainText(tokenReader: TokenReader): void {
    if (!tokenReader.isAccumulatedSequenceEmpty()) {
      const plainTextSequence: TokenSequence = tokenReader.extractAccumulatedSequence();

      this._pushParagraphNode(new DocPlainText({
        text: plainTextSequence.toString(),
        excerpt: new Excerpt({ content: plainTextSequence })
      }));
    }
  }

  private _parseAndPushBlock(tokenReader: TokenReader): void {
    const docComment: DocComment = this._parserContext.docComment;
    const configuration: TSDocParserConfiguration = this._parserContext.configuration;
    const modifierTagSet: ModifierTagSet = docComment.modifierTagSet;

    const parsedBlockTag: DocNode = this._parseBlockTag(tokenReader);
    if (parsedBlockTag.kind !== DocNodeKind.BlockTag) {
      this._pushParagraphNode(parsedBlockTag);
      return;
    }

    const docBlockTag: DocBlockTag = parsedBlockTag as DocBlockTag;

    // Do we have a definition for this tag?
    const tagDefinition: TSDocTagDefinition | undefined
      = configuration.tryGetTagDefinitionWithUpperCase(docBlockTag.tagNameWithUpperCase);
    if (tagDefinition) {
      switch (tagDefinition.syntaxKind) {
        case TSDocTagSyntaxKind.BlockTag:
          if (docBlockTag.tagNameWithUpperCase === StandardTags.param.tagNameWithUpperCase) {
            const docParamBlock: DocParamBlock = this._parseParamBlock(tokenReader, docBlockTag);

            this._parserContext.docComment.paramBlocks.push(docParamBlock);

            this._currentSection = docParamBlock;
            return;
          } else {
            const newBlock: DocBlock = new DocBlock({
              blockTag: docBlockTag
            });

            this._addBlockToDocComment(newBlock);

            this._currentSection = newBlock;
          }

          return;
        case TSDocTagSyntaxKind.ModifierTag:
          // The block tag was recognized as a modifier, so add it to the modifier tag set
          // and do NOT call currentSection.appendNode(parsedNode)
          modifierTagSet.addTag(docBlockTag);
          return;
      }
    }

    this._pushParagraphNode(docBlockTag);
  }

  private _addBlockToDocComment(block: DocBlock): void {
    const docComment: DocComment = this._parserContext.docComment;

    switch (block.blockTag.tagNameWithUpperCase) {
      case StandardTags.remarks.tagNameWithUpperCase:
        docComment.remarksBlock = block;
        break;
      case StandardTags.privateRemarks.tagNameWithUpperCase:
        docComment.privateRemarks = block;
        break;
      case StandardTags.deprecated.tagNameWithUpperCase:
        docComment.deprecatedBlock = block;
        break;
      case StandardTags.returns.tagNameWithUpperCase:
        docComment.returnsBlock = block;
        break;
      default:
        docComment.appendCustomBlock(block);
    }
  }

  private _parseParamBlock(tokenReader: TokenReader, docBlockTag: DocBlockTag): DocParamBlock {
    const startMarker: number = tokenReader.createMarker();

    this._readSpacingAndNewlines(tokenReader);
    const leadingWhitespaceSequence: TokenSequence | undefined = tokenReader.tryExtractAccumulatedSequence();

    let parameterName: string = '';

    let done: boolean = false;
    while (!done) {
      switch (tokenReader.peekTokenKind()) {
        case TokenKind.AsciiWord:
        case TokenKind.Period:
          parameterName += tokenReader.readToken();
          break;
        default:
          done = true;
          break;
      }
    }

    if (parameterName.length === 0) {
      tokenReader.backtrackToMarker(startMarker);

      const errorParamBlock: DocParamBlock = new DocParamBlock({
        blockTag: docBlockTag,
        parameterName: ''
      });
      this._parserContext.log.addMessageForTokenSequence(
        'The @param block should be followed by a parameter name',
        docBlockTag.excerpt!.content,
        docBlockTag
      );
      return errorParamBlock;

    }

    const parameterNameExcerptParameters: IExcerptParameters = {
      content: tokenReader.extractAccumulatedSequence()
    };

    // TODO: Warn if there is no space before or after the hyphen
    this._readSpacingAndNewlines(tokenReader);
    parameterNameExcerptParameters.spacingAfterContent = tokenReader.tryExtractAccumulatedSequence();

    if (tokenReader.peekTokenKind() !== TokenKind.Hyphen) {
      tokenReader.backtrackToMarker(startMarker);

      this._parserContext.log.addMessageForTokenSequence(
        'The @param block should be followed by a parameter name and then a hyphen',
        docBlockTag.excerpt!.content,
        docBlockTag
      );

      return new DocParamBlock({
        blockTag: docBlockTag,
        parameterName: ''
      });
    }
    tokenReader.readToken();

    const hyphenExcerptParameters: IExcerptParameters = {
      content: tokenReader.extractAccumulatedSequence()
    };

    // TODO: Only read one space
    this._readSpacingAndNewlines(tokenReader);
    hyphenExcerptParameters.spacingAfterContent = tokenReader.tryExtractAccumulatedSequence();

    if (leadingWhitespaceSequence) {
      // The leading whitespace that we parsed to the docBlockTag
      docBlockTag.updateExcerpt(new Excerpt({
        content: docBlockTag.excerpt!.content,
        spacingAfterContent: leadingWhitespaceSequence
      }));
    }

    return new DocParamBlock({
      blockTag: docBlockTag,

      parameterNameExcerpt: new Excerpt(parameterNameExcerptParameters),
      parameterName: parameterName,

      hyphenExcerpt: new Excerpt(hyphenExcerptParameters)
    });
  }

  private _pushParagraphNode(docNode: DocNode): void {
    this._currentSection.appendNodeInParagraph(docNode);
  }

  private _pushSectionNode(docNode: DocNode): void {
    this._currentSection.appendNode(docNode);
  }

  private _parseBackslashEscape(tokenReader: TokenReader): DocNode {
    tokenReader.assertAccumulatedSequenceIsEmpty();
    const marker: number = tokenReader.createMarker();

    tokenReader.readToken();

    if (tokenReader.peekTokenKind() === TokenKind.EndOfInput) {
      return this._backtrackAndCreateError(tokenReader, marker,
        'A backslash must precede another character that is being escaped');
    }

    const escapedToken: Token = tokenReader.readToken();

    // In CommonMark, a backslash is only allowed before a punctuation
    // character.  In all other contexts, the backslash is interpreted as a
    // literal character.
    if (!Tokenizer.isPunctuation(escapedToken.kind)) {
      return this._backtrackAndCreateError(tokenReader, marker,
        'A backslash can only be used to escape a punctuation character');
    }

    const tokenSequence: TokenSequence = tokenReader.extractAccumulatedSequence();

    return new DocEscapedText({
      excerpt: new Excerpt({ content: tokenSequence }),
      escapeStyle: EscapeStyle.CommonMarkBackslash,
      text: escapedToken.toString()
    });
  }

  private _parseBlockTag(tokenReader: TokenReader): DocNode {
    tokenReader.assertAccumulatedSequenceIsEmpty();
    const marker: number = tokenReader.createMarker();

    if (tokenReader.peekTokenKind() !== TokenKind.AtSign) {
      return this._backtrackAndCreateError(tokenReader, marker,
        'Expecting a TSDoc tag starting with "@"');
    }

    // "@one" is a valid TSDoc tag at the start of a line, but "@one@two" is
    // a syntax error.  For two tags it should be "@one @two", or for literal text it
    // should be "\@one\@two".
    switch (tokenReader.peekPreviousTokenKind()) {
      case TokenKind.None:
      case TokenKind.Spacing:
      case TokenKind.Newline:
        break;
      default:
        return this._backtrackAndCreateError(tokenReader, marker,
          'A TSDoc tag must be preceded by whitespace');
    }

    // Include the "@" as part of the tagName
    let tagName: string = tokenReader.readToken().toString();

    if (tokenReader.peekTokenKind() !== TokenKind.AsciiWord) {
      return this._backtrackAndCreateError(tokenReader, marker,
        'Expecting a TSDoc tag name after the "@" character (or use a backslash to escape this character)');
    }

    const tagNameMarker: number = tokenReader.createMarker();

    while (tokenReader.peekTokenKind() === TokenKind.AsciiWord) {
      tagName += tokenReader.readToken().toString();
    }

    if (tagName.length === 0) {
      return this._backtrackAndCreateError(tokenReader, marker,
        'Expecting an inline TSDoc tag name immediately after "{@"');
    }

    if (StringChecks.explainIfNotTSDocTagName(tagName)) {
      const failure: IFailure = this._createFailureForTokensSince(tokenReader,
        'A TSDoc tag name must start with a letter and contain only letters and numbers', tagNameMarker);
      return this._backtrackAndCreateErrorForFailure(tokenReader, marker, '', failure);
    }

    switch (tokenReader.peekTokenKind()) {
      case TokenKind.None:
      case TokenKind.Spacing:
      case TokenKind.Newline:
      case TokenKind.EndOfInput:
        break;
      default:
        return this._backtrackAndCreateError(tokenReader, marker,
          'A TSDoc tag must be followed by whitespace');
    }

    return new DocBlockTag({
      excerpt: new Excerpt({ content: tokenReader.extractAccumulatedSequence() }),
      tagName
    });
  }

  private _parseInlineTag(tokenReader: TokenReader): DocNode {
    tokenReader.assertAccumulatedSequenceIsEmpty();
    const marker: number = tokenReader.createMarker();

    if (tokenReader.peekTokenKind() !== TokenKind.LeftCurlyBracket) {
      return this._backtrackAndCreateError(tokenReader, marker,
        'Expecting a TSDoc tag starting with "{"');
    }
    tokenReader.readToken();

    const openingDelimiterExcerptParameters: IExcerptParameters = {
      content: tokenReader.extractAccumulatedSequence()
    };

    // For inline tags, if we handle errors by backtracking to the "{"  token, then the main loop
    // will then interpret the "@" as a block tag, which is almost certainly incorrect.  So the
    // DocErrorText needs to include both the "{" and "@" tokens.
    // We will use _backtrackAndCreateErrorRangeForFailure() for that.
    const atSignMarker: number = tokenReader.createMarker();

    if (tokenReader.peekTokenKind() !== TokenKind.AtSign) {
      return this._backtrackAndCreateError(tokenReader, marker,
        'Expecting a TSDoc tag starting with "{@"');
    }

    // Include the "@" as part of the tagName
    let tagName: string = tokenReader.readToken().toString();

    while (tokenReader.peekTokenKind() === TokenKind.AsciiWord) {
      tagName += tokenReader.readToken().toString();
    }

    if (tagName === '@') {
      // This is an unusual case
      const failure: IFailure = this._createFailureForTokensSince(tokenReader,
        'Expecting a TSDoc inline tag name after the "{@" characters', atSignMarker);
      return this._backtrackAndCreateErrorRangeForFailure(tokenReader, marker, atSignMarker, '', failure);
    }

    if (StringChecks.explainIfNotTSDocTagName(tagName)) {
      const failure: IFailure = this._createFailureForTokensSince(tokenReader,
        'A TSDoc tag name must start with a letter and contain only letters and numbers', atSignMarker);
      return this._backtrackAndCreateErrorRangeForFailure(tokenReader, marker, atSignMarker, '', failure);
    }

    const tagNameExcerptParameters: IExcerptParameters = {
      content: tokenReader.extractAccumulatedSequence()
    };

    // We include the space in tagContent in case the implementor wants to assign some
    // special meaning to spaces for their tag.
    let tagContent: string = this._readSpacingAndNewlines(tokenReader);
    if (tagContent.length === 0) {
      // If there were no spaces at all, that's an error unless it's the degenerate "{@tag}" case
      if (tokenReader.peekTokenKind() !== TokenKind.RightCurlyBracket) {
        const failure: IFailure = this._createFailureForToken(tokenReader,
          'Expecting a space after the TSDoc inline tag name');
        return this._backtrackAndCreateErrorRangeForFailure(tokenReader, marker, atSignMarker, '', failure);
      }
    }

    let done: boolean = false;
    while (!done) {
      switch (tokenReader.peekTokenKind()) {
        case TokenKind.EndOfInput:
          return this._backtrackAndCreateErrorRange(tokenReader, marker, atSignMarker,
            'The TSDoc inline tag name is missing its closing "}"');
        case TokenKind.Backslash:
          // http://usejsdoc.org/about-block-inline-tags.html
          // "If your tag's text includes a closing curly brace (}), you must escape it with
          // a leading backslash (\)."
          tokenReader.readToken(); // discard the backslash

          // In CommonMark, a backslash is only allowed before a punctuation
          // character.  In all other contexts, the backslash is interpreted as a
          // literal character.
          if (!Tokenizer.isPunctuation(tokenReader.peekTokenKind())) {
            const failure: IFailure = this._createFailureForToken(tokenReader,
              'A backslash can only be used to escape a punctuation character');
              return this._backtrackAndCreateErrorRangeForFailure(tokenReader, marker, atSignMarker,
                'Error reading inline TSDoc tag: ', failure);
          }

          tagContent += tokenReader.readToken().toString();
          break;
        case TokenKind.LeftCurlyBracket:
          {
            const failure: IFailure = this._createFailureForToken(tokenReader,
              'The "{" character must be escaped with a backslash when used inside a TSDoc inline tag');
              return this._backtrackAndCreateErrorRangeForFailure(tokenReader, marker, atSignMarker, '' , failure);
          }
        case TokenKind.RightCurlyBracket:
          done = true;
          break;
        default:
          tagContent += tokenReader.readToken().toString();
          break;
      }
    }

    let tagContentExcerpt: Excerpt | undefined;
    if (!tokenReader.isAccumulatedSequenceEmpty()) {
      tagContentExcerpt = new Excerpt({
        content: tokenReader.extractAccumulatedSequence()
      });
    }

    // Read the right curly bracket
    tokenReader.readToken();
    const closingDelimiterExcerptParameters: IExcerptParameters = {
      content: tokenReader.extractAccumulatedSequence()
    };

    return new DocInlineTag({
      openingDelimiterExcerpt: new Excerpt(openingDelimiterExcerptParameters),

      tagNameExcerpt: new Excerpt(tagNameExcerptParameters),
      tagName: tagName,

      tagContentExcerpt: tagContentExcerpt,
      tagContent: tagContent,

      closingDelimiterExcerpt: new Excerpt(closingDelimiterExcerptParameters)
    });
  }

  private _parseHtmlStartTag(tokenReader: TokenReader): DocNode {
    tokenReader.assertAccumulatedSequenceIsEmpty();
    const marker: number = tokenReader.createMarker();

    // Read the "<" delimiter
    const lessThanToken: Token = tokenReader.readToken();
    if (lessThanToken.kind !== TokenKind.LessThan) {
      return this._backtrackAndCreateError(tokenReader, marker, 'Expecting an HTML tag starting with "<"');
    }

    // NOTE: CommonMark does not permit whitespace after the "<"

    const openingDelimiterExcerptParameters: IExcerptParameters = {
      content: tokenReader.extractAccumulatedSequence()
    };

    // Read the element name
    const elementName: ResultOrFailure<string> = this._parseHtmlName(tokenReader);
    if (isFailure(elementName)) {
      return this._backtrackAndCreateErrorForFailure(tokenReader, marker, 'Invalid HTML element: ', elementName);
    }

    const elementNameExcerptParameters: IExcerptParameters = {
      content: tokenReader.extractAccumulatedSequence()
    };

    const spacingAfterElementName: string = this._readSpacingAndNewlines(tokenReader);
    elementNameExcerptParameters.spacingAfterContent = tokenReader.tryExtractAccumulatedSequence();

    const htmlAttributes: DocHtmlAttribute[] = [];

    // Read the attributes until we see a ">" or "/>"
    while (tokenReader.peekTokenKind() === TokenKind.AsciiWord) {
      // Read the attribute
      const attributeNode: ResultOrFailure<DocHtmlAttribute> = this._parseHtmlAttribute(tokenReader);
      if (isFailure(attributeNode)) {
        return this._backtrackAndCreateErrorForFailure(tokenReader, marker,
          'The HTML element has an invalid attribute: ', attributeNode);
      }

      htmlAttributes.push(attributeNode);
    }

    // Read the closing "/>" or ">" as the Excerpt.suffix
    tokenReader.assertAccumulatedSequenceIsEmpty();
    const endDelimiterMarker: number = tokenReader.createMarker();

    let selfClosingTag: boolean = false;
    if (tokenReader.peekTokenKind() === TokenKind.Slash) {
      tokenReader.readToken();
      selfClosingTag = true;
    }
    if (tokenReader.peekTokenKind() !== TokenKind.GreaterThan) {
      const failure: IFailure = this._createFailureForTokensSince(tokenReader,
        'Expecting an attribute or ">" or "/>"', endDelimiterMarker);
      return this._backtrackAndCreateErrorForFailure(tokenReader, marker,
        'The HTML tag has invalid syntax: ', failure);
    }
    tokenReader.readToken();

    const closingDelimiterExcerptParameters: IExcerptParameters = {
      content: tokenReader.extractAccumulatedSequence()
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

  private _parseHtmlAttribute(tokenReader: TokenReader): ResultOrFailure<DocHtmlAttribute> {
    tokenReader.assertAccumulatedSequenceIsEmpty();

    // Read the attribute name
    const attributeName: ResultOrFailure<string> = this._parseHtmlName(tokenReader);
    if (isFailure(attributeName)) {
      return attributeName;
    }

    const attributeNameExcerptParameters: IExcerptParameters = {
      content: tokenReader.extractAccumulatedSequence()
    };

    const spacingAfterAttributeName: string = this._readSpacingAndNewlines(tokenReader);
    attributeNameExcerptParameters.spacingAfterContent = tokenReader.tryExtractAccumulatedSequence();

    // Read the equals
    if (tokenReader.peekTokenKind() !== TokenKind.Equals) {
      return this._createFailureForToken(tokenReader, 'Expecting "=" after HTML attribute name');
    }
    tokenReader.readToken();

    const equalsExcerptParameters: IExcerptParameters = {
      content: tokenReader.extractAccumulatedSequence()
    };

    const spacingAfterEquals: string = this._readSpacingAndNewlines(tokenReader);
    equalsExcerptParameters.spacingAfterContent = tokenReader.tryExtractAccumulatedSequence();

    // Read the attribute value
    const attributeValue: ResultOrFailure<string> = this._parseHtmlString(tokenReader);
    if (isFailure(attributeValue)) {
      return attributeValue;
    }

    const attributeValueExcerptParameters: IExcerptParameters = {
      content: tokenReader.extractAccumulatedSequence()
    };

    const spacingAfterAttributeValue: string = this._readSpacingAndNewlines(tokenReader);
    attributeValueExcerptParameters.spacingAfterContent = tokenReader.tryExtractAccumulatedSequence();

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

  private _parseHtmlString(tokenReader: TokenReader): ResultOrFailure<string> {
    const marker: number = tokenReader.createMarker();
    const quoteTokenKind: TokenKind = tokenReader.peekTokenKind();
    if (quoteTokenKind !== TokenKind.DoubleQuote && quoteTokenKind !== TokenKind.SingleQuote) {
      return this._createFailureForToken(tokenReader,
        'Expecting an HTML string starting with a single-quote or double-quote character');
    }
    tokenReader.readToken();

    let textWithoutQuotes: string = '';

    while (true) {
      const peekedTokenKind: TokenKind = tokenReader.peekTokenKind();
      // Did we find the matching token?
      if (peekedTokenKind === quoteTokenKind) {
        tokenReader.readToken(); // extract the quote
        break;
      }
      if (peekedTokenKind === TokenKind.EndOfInput ||  peekedTokenKind === TokenKind.Newline) {
        return this._createFailureForToken(tokenReader, 'The HTML string is missing its closing quote', marker);
      }
      textWithoutQuotes += tokenReader.readToken().toString();
    }

    // The next attribute cannot start immediately after this one
    if (tokenReader.peekTokenKind() === TokenKind.AsciiWord) {
      return this._createFailureForToken(tokenReader,
        'The next character after a closing quote must be spacing or punctuation');
    }

    return textWithoutQuotes;
  }

  private _parseHtmlEndTag(tokenReader: TokenReader): DocNode {
    tokenReader.assertAccumulatedSequenceIsEmpty();
    const marker: number = tokenReader.createMarker();

    // Read the "</" delimiter
    const lessThanToken: Token = tokenReader.peekToken();
    if (lessThanToken.kind !== TokenKind.LessThan) {
      return this._backtrackAndCreateError(tokenReader, marker, 'Expecting an HTML tag starting with "</"');
    }
    tokenReader.readToken();

    const slashToken: Token = tokenReader.peekToken();
    if (slashToken.kind !== TokenKind.Slash) {
      return this._backtrackAndCreateError(tokenReader, marker, 'Expecting an HTML tag starting with "</"');
    }
    tokenReader.readToken();

    // NOTE: Spaces are not permitted here
    // https://www.w3.org/TR/html5/syntax.html#end-tags

    const openingDelimiterExcerptParameters: IExcerptParameters = {
      content: tokenReader.extractAccumulatedSequence()
    };

    // Read the tag name
    const elementName: ResultOrFailure<string> = this._parseHtmlName(tokenReader);
    if (isFailure(elementName)) {
      return this._backtrackAndCreateErrorForFailure(tokenReader, marker,
        'Expecting an HTML element name: ', elementName);
    }

    const elementNameExcerptParameters: IExcerptParameters = {
      content: tokenReader.extractAccumulatedSequence()
    };

    this._readSpacingAndNewlines(tokenReader);
    elementNameExcerptParameters.spacingAfterContent = tokenReader.tryExtractAccumulatedSequence();

    // Read the closing ">"
    if (tokenReader.peekTokenKind() !== TokenKind.GreaterThan) {
      const failure: IFailure = this._createFailureForToken(tokenReader,
        'Expecting a closing ">" for the HTML tag');
      return this._backtrackAndCreateErrorForFailure(tokenReader, marker, '', failure);
    }
    tokenReader.readToken();

    const closingDelimiterExcerptParameters: IExcerptParameters = {
      content: tokenReader.extractAccumulatedSequence()
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
  private _parseHtmlName(tokenReader: TokenReader): ResultOrFailure<string> {
    let htmlName: string = '';

    const marker: number = tokenReader.createMarker();

    if (tokenReader.peekTokenKind() === TokenKind.Spacing) {
      return this._createFailureForTokensSince(tokenReader, 'A space is not allowed here', marker);
    }

    let done: boolean = false;
    while (!done) {
      switch (tokenReader.peekTokenKind()) {
        case TokenKind.AsciiWord:
        case TokenKind.Hyphen:
          htmlName += tokenReader.readToken().toString();
          break;
        default:
          done = true;
          break;
      }
    }

    if (htmlName.length === 0) {
      return this._createFailureForToken(tokenReader, 'Expecting an HTML name');
    }

    if (!NodeParser.htmlNameRegExp.test(htmlName)) {
      return this._createFailureForTokensSince(tokenReader,
        'An HTML name must be a sequence of letters separated by hyphens', marker);
    }

    return htmlName;
  }

  private _parseCodeFence(tokenReader: TokenReader): DocNode {
    tokenReader.assertAccumulatedSequenceIsEmpty();

    const startMarker: number = tokenReader.createMarker();
    const endOfOpeningDelimiterMarker: number = startMarker + 2;

    switch (tokenReader.peekPreviousTokenKind()) {
      case TokenKind.Newline:
      case TokenKind.None:
        break;
      default:
        return this._backtrackAndCreateErrorRange(
          tokenReader,
          startMarker,
          // include the three backticks so they don't get reinterpreted as a code span
          endOfOpeningDelimiterMarker,
          'The opening backtick for a code fence must appear at the start of the line'
        );
    }

    // Read the opening ``` delimiter
    let openingDelimiter: string = '';
    openingDelimiter += tokenReader.readToken();
    openingDelimiter += tokenReader.readToken();
    openingDelimiter += tokenReader.readToken();

    if (openingDelimiter !== '```') {
      // This would be a parser bug -- the caller of _parseCodeFence() should have verified this while
      // looking ahead to distinguish code spans/fences
      throw new Error('Expecting three backticks');
    }

    const openingDelimiterSequence: TokenSequence = tokenReader.extractAccumulatedSequence();

    // Read any spaces after the delimiter,
    // but NOT the Newline since that goes with the language particle
    while (tokenReader.peekTokenKind() === TokenKind.Spacing) {
      tokenReader.readToken();
    }

    const openingDelimiterExcerpt: Excerpt = new Excerpt({
      content: openingDelimiterSequence,
      spacingAfterContent: tokenReader.tryExtractAccumulatedSequence()
    });

    // Read the language specifier (if present) and newline
    let done: boolean = false;
    let startOfPaddingMarker: number | undefined = undefined;
    while (!done) {
      switch (tokenReader.peekTokenKind()) {
        case TokenKind.Spacing:
        case TokenKind.Newline:
          if (startOfPaddingMarker === undefined) {
            // Starting a new run of spacing characters
            startOfPaddingMarker = tokenReader.createMarker();
          }
          if (tokenReader.peekTokenKind() === TokenKind.Newline) {
            done = true;
          }
          tokenReader.readToken();
          break;
        case TokenKind.Backtick:
          const failure: IFailure = this._createFailureForToken(tokenReader,
            'The language specifier cannot contain backtick characters');
          return this._backtrackAndCreateErrorRangeForFailure(tokenReader, startMarker, endOfOpeningDelimiterMarker,
            'Error parsing code fence: ', failure);
        case TokenKind.EndOfInput:
          const failure2: IFailure = this._createFailureForToken(tokenReader,
            'Missing closing delimiter');
          return this._backtrackAndCreateErrorRangeForFailure(tokenReader, startMarker, endOfOpeningDelimiterMarker,
            'Error parsing code fence: ', failure2);
        default:
          // more non-spacing content
          startOfPaddingMarker = undefined;
          tokenReader.readToken();
          break;
      }
    }

    // At this point, we must have accumulated at least a newline token.
    // Example: "pov-ray sdl    \n"
    const languageSequence: TokenSequence = tokenReader.extractAccumulatedSequence();

    const languageExcerpt: Excerpt = new Excerpt({
      // Example: "pov-ray sdl"
      content: languageSequence.getNewSequence(languageSequence.startIndex, startOfPaddingMarker!),
      // Example: "    \n"
      spacingAfterContent: languageSequence.getNewSequence(startOfPaddingMarker!, languageSequence.endIndex)
    });

    // Read the code content until we see the closing ``` delimiter
    let codeEndMarker: number = -1;
    done = false;
    let tokenBeforeDelimiter: Token;
    while (!done) {
      switch (tokenReader.peekTokenKind()) {
        case TokenKind.EndOfInput:
          const failure2: IFailure = this._createFailureForToken(tokenReader,
            'Missing closing delimiter');
          return this._backtrackAndCreateErrorRangeForFailure(tokenReader, startMarker, endOfOpeningDelimiterMarker,
            'Error parsing code fence: ', failure2);
        case TokenKind.Newline:
          tokenBeforeDelimiter = tokenReader.readToken();
          codeEndMarker = tokenReader.createMarker();

          while (tokenReader.peekTokenKind() === TokenKind.Spacing) {
            tokenBeforeDelimiter = tokenReader.readToken();
          }

          if (tokenReader.peekTokenKind() !== TokenKind.Backtick) {
            break;
          }
          tokenReader.readToken(); // first backtick

          if (tokenReader.peekTokenKind() !== TokenKind.Backtick) {
            break;
          }
          tokenReader.readToken(); // second backtick

          if (tokenReader.peekTokenKind() !== TokenKind.Backtick) {
            break;
          }
          tokenReader.readToken(); // third backtick

          done = true;
          break;
        default:
          tokenReader.readToken();
          break;
      }
    }

    if (tokenBeforeDelimiter!.kind !== TokenKind.Newline) {
      this._parserContext.log.addMessageForTextRange(
        'The closing delimiter for a code fence must not be indented',
        tokenBeforeDelimiter!.range);
    }

    // Example: "code 1\ncode 2\n   ```"
    const codeAndDelimiterSequence: TokenSequence = tokenReader.extractAccumulatedSequence();

    const codeExcerpt: Excerpt = new Excerpt({
      content: codeAndDelimiterSequence.getNewSequence(codeAndDelimiterSequence.startIndex, codeEndMarker)
    });

    // Read the spacing and newline after the closing delimiter
    done = false;
    while (!done) {
      switch (tokenReader.peekTokenKind()) {
        case TokenKind.Spacing:
          tokenReader.readToken();
          break;
        case TokenKind.Newline:
          done = true;
          tokenReader.readToken();
          break;
        case TokenKind.EndOfInput:
          done = true;
          break;
        default:
          this._parserContext.log.addMessageForTextRange(
            'Unexpected characters after closing delimiter for code fence',
            tokenReader.peekToken().range);
          done = true;
          break;
      }
    }

    const closingDelimiterExcerpt: Excerpt = new Excerpt({
      // Example: "```"
      content: codeAndDelimiterSequence.getNewSequence(codeEndMarker, codeAndDelimiterSequence.endIndex),
      // Example: "   \n"
      spacingAfterContent: tokenReader.tryExtractAccumulatedSequence()
    });

    return new DocCodeFence({
      openingDelimiterExcerpt: openingDelimiterExcerpt,

      languageExcerpt: languageExcerpt,
      language: languageExcerpt.content.toString(),

      codeExcerpt: codeExcerpt,
      code: codeExcerpt.content.toString(),

      closingDelimiterExcerpt: closingDelimiterExcerpt
    });
  }

  private _parseCodeSpan(tokenReader: TokenReader): DocNode {
    tokenReader.assertAccumulatedSequenceIsEmpty();
    const marker: number = tokenReader.createMarker();

    // Parse the opening backtick
    if (tokenReader.peekTokenKind() !== TokenKind.Backtick) {
      return this._createError(tokenReader,
        'Expecting a code span starting with a backtick character "`"');
    }

    switch (tokenReader.peekPreviousTokenKind()) {
      case TokenKind.Spacing:
      case TokenKind.Newline:
      case TokenKind.None:
        break;
      default:
        return this._createError(tokenReader,
          'The opening backtick for a code span must be preceded by whitespace');
    }

    tokenReader.readToken(); // read the backtick

    const openingDelimiterExcerpt: Excerpt = new Excerpt({
      content: tokenReader.extractAccumulatedSequence()
    });

    let closingBacktickMarker: number;

    let codeExcerpt: Excerpt;
    let closingDelimiterExcerpt: Excerpt;

    // Parse the content backtick
    while (true) {
      const peekedTokenKind: TokenKind = tokenReader.peekTokenKind();
      // Did we find the matching token?
      if (peekedTokenKind === TokenKind.Backtick) {
        codeExcerpt = new Excerpt({
          content: tokenReader.extractAccumulatedSequence()
        });

        closingBacktickMarker = tokenReader.createMarker();

        tokenReader.readToken();
        closingDelimiterExcerpt = new Excerpt({
          content: tokenReader.extractAccumulatedSequence()
        });
        break;
      }
      if (peekedTokenKind === TokenKind.EndOfInput ||  peekedTokenKind === TokenKind.Newline) {
        return this._backtrackAndCreateError(tokenReader, marker,
          'The code span is missing its closing backtick');
      }
      tokenReader.readToken();
    }

    // Make sure there's whitespace after
    switch (tokenReader.peekTokenKind()) {
      case TokenKind.Spacing:
      case TokenKind.EndOfInput:
      case TokenKind.Newline:
        break;
      default:
        const failure: IFailure = this._createFailureForToken(tokenReader,
          'The closing backtick for a code span must be followed by whitespace', closingBacktickMarker);
        return this._backtrackAndCreateErrorForFailure(tokenReader, marker, 'Error parsing code span: ', failure);
    }

    return new DocCodeSpan({
      openingDelimiterExcerpt,

      codeExcerpt,
      code: codeExcerpt.content.toString(),

      closingDelimiterExcerpt
    });
  }

  private _readSpacingAndNewlines(tokenReader: TokenReader): string {
    let result: string = '';

    let done: boolean = false;
    do {
      switch (tokenReader.peekTokenKind()) {
        case TokenKind.Spacing:
        case TokenKind.Newline:
          result += tokenReader.readToken().toString();
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
  private _createError(tokenReader: TokenReader, errorMessage: string): DocErrorText {
    tokenReader.readToken();

    const tokenSequence: TokenSequence = tokenReader.extractAccumulatedSequence();

    const docErrorText: DocErrorText = new DocErrorText({
      excerpt: new Excerpt({ content: tokenSequence }),
      text: tokenSequence.toString(),
      errorMessage,
      errorLocation: tokenSequence
    });
    this._parserContext.log.addMessageForDocErrorText(docErrorText);
    return docErrorText;
  }

  /**
   * Rewind to the specified marker, read the next token, and report it as a DocErrorText node.
   */
  private _backtrackAndCreateError(tokenReader: TokenReader, marker: number, errorMessage: string): DocErrorText {
    tokenReader.backtrackToMarker(marker);
    return this._createError(tokenReader, errorMessage);
  }

  /**
   * Rewind to the errorStartMarker, read the tokens up to and including errorInclusiveEndMarker,
   * and report it as a DocErrorText node.
   */
  private _backtrackAndCreateErrorRange(tokenReader: TokenReader, errorStartMarker: number,
    errorInclusiveEndMarker: number, errorMessage: string): DocErrorText {

    tokenReader.backtrackToMarker(errorStartMarker);
    while (tokenReader.createMarker() !== errorInclusiveEndMarker) {
      tokenReader.readToken();
    }
    if (tokenReader.peekTokenKind() !== TokenKind.EndOfInput) {
      tokenReader.readToken();
    }

    const tokenSequence: TokenSequence = tokenReader.extractAccumulatedSequence();

    const docErrorText: DocErrorText = new DocErrorText({
      excerpt: new Excerpt({ content: tokenSequence }),
      text: tokenSequence.toString(),
      errorMessage: errorMessage,
      errorLocation: tokenSequence
    });
    this._parserContext.log.addMessageForDocErrorText(docErrorText);
    return docErrorText;
  }

  /**
   * Rewind to the specified marker, read the next token, and report it as a DocErrorText node
   * whose location is based on an IFailure.
   */
  private _backtrackAndCreateErrorForFailure(tokenReader: TokenReader, marker: number,
    errorMessagePrefix: string, failure: IFailure): DocErrorText {

    tokenReader.backtrackToMarker(marker);
    tokenReader.readToken();

    const tokenSequence: TokenSequence = tokenReader.extractAccumulatedSequence();

    const docErrorText: DocErrorText = new DocErrorText({
      excerpt: new Excerpt({ content: tokenSequence }),
      text: tokenSequence.toString(),
      errorMessage: errorMessagePrefix + failure.failureMessage,
      errorLocation: failure.failureLocation
    });
    this._parserContext.log.addMessageForDocErrorText(docErrorText);
    return docErrorText;
  }

  /**
   * Rewind to the errorStartMarker, read the tokens up to and including errorInclusiveEndMarker,
   * and report it as a DocErrorText node whose location is based on an IFailure.
   */
  private _backtrackAndCreateErrorRangeForFailure(tokenReader: TokenReader, errorStartMarker: number,
    errorInclusiveEndMarker: number, errorMessagePrefix: string, failure: IFailure): DocErrorText {

    tokenReader.backtrackToMarker(errorStartMarker);
    while (tokenReader.createMarker() !== errorInclusiveEndMarker) {
      tokenReader.readToken();
    }
    if (tokenReader.peekTokenKind() !== TokenKind.EndOfInput) {
      tokenReader.readToken();
    }

    const tokenSequence: TokenSequence = tokenReader.extractAccumulatedSequence();

    const docErrorText: DocErrorText = new DocErrorText({
      excerpt: new Excerpt({ content: tokenSequence }),
      text: tokenSequence.toString(),
      errorMessage: errorMessagePrefix + failure.failureMessage,
      errorLocation: failure.failureLocation
    });
    this._parserContext.log.addMessageForDocErrorText(docErrorText);
    return docErrorText;
  }

  /**
   * Creates an IFailure whose TokenSequence is a single token.  If a marker is not specified,
   * then it is the current token.
   */
  private _createFailureForToken(tokenReader: TokenReader, failureMessage: string,
    tokenMarker?: number): IFailure {

    if (!tokenMarker) {
      tokenMarker = tokenReader.createMarker();
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
  private _createFailureForTokensSince(tokenReader: TokenReader, failureMessage: string,
    startMarker: number): IFailure {

    let endMarker: number = tokenReader.createMarker();
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
