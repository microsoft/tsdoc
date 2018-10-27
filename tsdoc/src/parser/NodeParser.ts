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
  DocFencedCode,
  DocLinkTag,
  IDocLinkTagParameters,
  DocMemberReference,
  DocDeclarationReference,
  DocMemberSymbol,
  DocMemberIdentifier,
  DocMemberSelector,
  DocInheritDocTag,
  IDocInheritDocTagParameters,
  IDocInlineTagParsedParameters,
  DocInlineTagBase,
  IDocLinkTagParsedParameters,
  IDocMemberReferenceParsedParameters
} from '../nodes';
import { TokenSequence } from './TokenSequence';
import { TokenReader } from './TokenReader';
import { StringChecks } from './StringChecks';
import { ModifierTagSet } from '../details/ModifierTagSet';
import { TSDocParserConfiguration } from './TSDocParserConfiguration';
import {
  TSDocTagDefinition,
  TSDocTagSyntaxKind
} from './TSDocTagDefinition';
import { StandardTags } from '../details/StandardTags';
import { PlainTextEmitter } from '../emitters/PlainTextEmitter';

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
            parsed: true,
            softBreakExcerpt: tokenReader.extractAccumulatedSequence()
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
        case TokenKind.LeftCurlyBracket: {
          this._pushAccumulatedPlainText(tokenReader);

          const marker: number = tokenReader.createMarker();
          const docNode: DocNode = this._parseInlineTag(tokenReader);
          const docComment: DocComment = this._parserContext.docComment;

          if (docNode instanceof DocInheritDocTag) {
            // The @inheritDoc tag is irregular because it looks like an inline tag, but
            // it actually represents the entire comment body
            const tagEndMarker: number = tokenReader.createMarker() - 1;
            if (docComment.inheritDocTag === undefined) {
              this._parserContext.docComment.inheritDocTag = docNode;
            } else {
              this._pushParagraphNode(this._backtrackAndCreateErrorRange(tokenReader, marker, tagEndMarker,
                'A doc comment cannot have more than one @inheritDoc tag')
              );
            }
          } else {
            this._pushParagraphNode(docNode);
          }
          break;
        }
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
            this._pushSectionNode(this._parseFencedCode(tokenReader));
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
    this._performValidationChecks();
  }

  private _performValidationChecks(): void {
    const docComment: DocComment = this._parserContext.docComment;
    if (docComment.deprecatedBlock) {
      if (!PlainTextEmitter.hasAnyTextContent(docComment.deprecatedBlock)) {
        this._parserContext.log.addMessageForTokenSequence(
          `The ${docComment.deprecatedBlock.blockTag.tagName} block must include a deprecation message,`
            + ` e.g. describing the recommended alternative`,
          docComment.deprecatedBlock.blockTag.getTokenSequence(),
          docComment.deprecatedBlock
        );
      }
    }

    if (docComment.inheritDocTag) {
      if (docComment.remarksBlock) {
        this._parserContext.log.addMessageForTokenSequence(
          `A "${docComment.remarksBlock.blockTag.tagName}" block must not be used, because that`
          + ` content is provided by the @inheritDoc tag`,
          docComment.remarksBlock.blockTag.getTokenSequence(), docComment.remarksBlock.blockTag);
      }
      if (PlainTextEmitter.hasAnyTextContent(docComment.summarySection)) {
        this._parserContext.log.addMessageForTextRange(
          'The summary section must not have any content, because that'
          + ' content is provided by the @inheritDoc tag',
          this._parserContext.commentRange);
      }
    }
  }

  private _validateTagDefinition(tagDefinition: TSDocTagDefinition | undefined,
    tagName: string, expectingInlineTag: boolean,
    tokenSequenceForErrorContext: TokenSequence, nodeForErrorContext: DocNode): void {

    if (tagDefinition) {
      const isInlineTag: boolean = tagDefinition.syntaxKind === TSDocTagSyntaxKind.InlineTag;

      if (isInlineTag !== expectingInlineTag) {
        // The tag is defined, but it is used incorrectly
        if (expectingInlineTag) {
          this._parserContext.log.addMessageForTokenSequence(
            `The TSDoc tag "${tagName}" is an inline tag; it must be enclosed in "{ }" braces`,
            tokenSequenceForErrorContext, nodeForErrorContext);
        } else {
          this._parserContext.log.addMessageForTokenSequence(
            `The TSDoc tag "${tagName}" is not an inline tag; it must not be enclosed in "{ }" braces`,
            tokenSequenceForErrorContext, nodeForErrorContext);
        }
      } else {
        if (this._parserContext.configuration.validation.reportUnsupportedTags) {
          if (!this._parserContext.configuration.isTagSupported(tagDefinition)) {
            // The tag is defined, but not supported
            this._parserContext.log.addMessageForTokenSequence(
              `The TSDoc tag "${tagName}" is not supported by this tool`,
              tokenSequenceForErrorContext, nodeForErrorContext);
          }
        }
      }
    } else {
      // The tag is not defined
      if (!this._parserContext.configuration.validation.ignoreUndefinedTags) {
        this._parserContext.log.addMessageForTokenSequence(
          `The TSDoc tag "${tagName}" is not defined in this configuration`,
          tokenSequenceForErrorContext, nodeForErrorContext);
      }
    }
  }

  private _pushAccumulatedPlainText(tokenReader: TokenReader): void {
    if (!tokenReader.isAccumulatedSequenceEmpty()) {
      this._pushParagraphNode(new DocPlainText({
        parsed: true,
        textExcerpt: tokenReader.extractAccumulatedSequence()
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
    this._validateTagDefinition(tagDefinition, docBlockTag.tagName, /* expectingInlineTag */ false,
      docBlockTag.getTokenSequence(), docBlockTag);

    if (tagDefinition) {
      switch (tagDefinition.syntaxKind) {
        case TSDocTagSyntaxKind.BlockTag:
          if (docBlockTag.tagNameWithUpperCase === StandardTags.param.tagNameWithUpperCase) {
            const docParamBlock: DocParamBlock = this._parseParamBlock(tokenReader, docBlockTag);

            this._parserContext.docComment.params.add(docParamBlock);

            this._currentSection = docParamBlock.content;
            return;
          } else if (docBlockTag.tagNameWithUpperCase === StandardTags.typeParam.tagNameWithUpperCase) {
            const docParamBlock: DocParamBlock = this._parseParamBlock(tokenReader, docBlockTag);

            this._parserContext.docComment.typeParams.add(docParamBlock);

            this._currentSection = docParamBlock.content;
            return;
          } else {
            const newBlock: DocBlock = new DocBlock({
              blockTag: docBlockTag
            });

            this._addBlockToDocComment(newBlock);

            this._currentSection = newBlock.content;
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

    const spacingBeforeParameterNameExcerpt: TokenSequence | undefined = this._tryReadSpacingAndNewlines(tokenReader);

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
        docBlockTag.getTokenSequence(),
        docBlockTag
      );
      return errorParamBlock;

    }

    const parameterNameExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

    // TODO: Warn if there is no space before or after the hyphen
    const spacingAfterParameterNameExcerpt: TokenSequence | undefined = this._tryReadSpacingAndNewlines(tokenReader);

    if (tokenReader.peekTokenKind() !== TokenKind.Hyphen) {
      tokenReader.backtrackToMarker(startMarker);

      this._parserContext.log.addMessageForTokenSequence(
        'The @param block should be followed by a parameter name and then a hyphen',
        docBlockTag.getTokenSequence(),
        docBlockTag
      );

      return new DocParamBlock({
        blockTag: docBlockTag,
        parameterName: ''
      });
    }
    tokenReader.readToken();

    const hyphenExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

    // TODO: Only read one space
    const spacingAfterHyphenExcerpt: TokenSequence | undefined = this._tryReadSpacingAndNewlines(tokenReader);

    return new DocParamBlock({
      parsed: true,

      blockTag: docBlockTag,

      spacingBeforeParameterNameExcerpt,

      parameterNameExcerpt,
      parameterName,

      spacingAfterParameterNameExcerpt,

      hyphenExcerpt,

      spacingAfterHyphenExcerpt
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

    tokenReader.readToken(); // read the backslash

    if (tokenReader.peekTokenKind() === TokenKind.EndOfInput) {
      return this._backtrackAndCreateError(tokenReader, marker,
        'A backslash must precede another character that is being escaped');
    }

    const escapedToken: Token = tokenReader.readToken(); // read the escaped character

    // In CommonMark, a backslash is only allowed before a punctuation
    // character.  In all other contexts, the backslash is interpreted as a
    // literal character.
    if (!Tokenizer.isPunctuation(escapedToken.kind)) {
      return this._backtrackAndCreateError(tokenReader, marker,
        'A backslash can only be used to escape a punctuation character');
    }

    const encodedTextExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

    return new DocEscapedText({
      parsed: true,
      escapeStyle: EscapeStyle.CommonMarkBackslash,
      encodedTextExcerpt,
      decodedText: escapedToken.toString()
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
      case TokenKind.EndOfInput:
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

    if (StringChecks.explainIfInvalidTSDocTagName(tagName)) {
      const failure: IFailure = this._createFailureForTokensSince(tokenReader,
        'A TSDoc tag name must start with a letter and contain only letters and numbers', tagNameMarker);
      return this._backtrackAndCreateErrorForFailure(tokenReader, marker, '', failure);
    }

    switch (tokenReader.peekTokenKind()) {
      case TokenKind.Spacing:
      case TokenKind.Newline:
      case TokenKind.EndOfInput:
        break;
      default:
        return this._backtrackAndCreateError(tokenReader, marker,
          'A TSDoc tag must be followed by whitespace');
    }

    return new DocBlockTag({
      parsed: true,
      tagName,
      tagNameExcerpt: tokenReader.extractAccumulatedSequence()
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

    const openingDelimiterExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

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

    if (StringChecks.explainIfInvalidTSDocTagName(tagName)) {
      const failure: IFailure = this._createFailureForTokensSince(tokenReader,
        'A TSDoc tag name must start with a letter and contain only letters and numbers', atSignMarker);
      return this._backtrackAndCreateErrorRangeForFailure(tokenReader, marker, atSignMarker, '', failure);
    }

    const tagNameExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

    const spacingAfterTagNameExcerpt: TokenSequence | undefined = this._tryReadSpacingAndNewlines(tokenReader);

    if (spacingAfterTagNameExcerpt === undefined) {
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

          tokenReader.readToken();
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
          tokenReader.readToken();
          break;
      }
    }

    const tagContentExcerpt: TokenSequence | undefined = tokenReader.tryExtractAccumulatedSequence();

    // Read the right curly bracket
    tokenReader.readToken();
    const closingDelimiterExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

    const docInlineTagParsedParameters: IDocInlineTagParsedParameters = {
      parsed: true,
      openingDelimiterExcerpt,

      tagNameExcerpt,
      tagName,
      spacingAfterTagNameExcerpt,

      tagContentExcerpt,

      closingDelimiterExcerpt
    };

    const tagNameWithUpperCase: string = tagName.toUpperCase();

    // Create a new TokenReader that will reparse the tokens corresponding to the tagContent.
    const embeddedTokenReader: TokenReader = new TokenReader(this._parserContext,
      tagContentExcerpt ? tagContentExcerpt : TokenSequence.createEmpty(this._parserContext));

    let docNode: DocNode;
    switch (tagNameWithUpperCase) {
      case StandardTags.inheritDoc.tagNameWithUpperCase:
        docNode = this._parseInheritDocTag(docInlineTagParsedParameters, embeddedTokenReader);
        break;
      case StandardTags.link.tagNameWithUpperCase:
        docNode = this._parseLinkTag(docInlineTagParsedParameters, embeddedTokenReader);
        break;
      default:
        docNode = new DocInlineTag(docInlineTagParsedParameters);
    }

    // Validate the tag
    const tagDefinition: TSDocTagDefinition | undefined
      = this._parserContext.configuration.tryGetTagDefinitionWithUpperCase(tagNameWithUpperCase);

    this._validateTagDefinition(tagDefinition, tagName, /* expectingInlineTag */ true,
      tagNameExcerpt, docNode);

    return docNode;
  }

  private _parseInheritDocTag(docInlineTagParsedParameters: IDocInlineTagParsedParameters,
    embeddedTokenReader: TokenReader): DocInlineTagBase {

    // If an error occurs, then return a generic DocInlineTag instead of DocInheritDocTag
    const errorTag: DocInlineTag = new DocInlineTag(docInlineTagParsedParameters);

    const parameters: IDocInheritDocTagParameters = {
      ...docInlineTagParsedParameters
    };

    if (embeddedTokenReader.peekTokenKind() !== TokenKind.EndOfInput) {
      parameters.declarationReference = this._parseDeclarationReference(embeddedTokenReader,
        docInlineTagParsedParameters.tagNameExcerpt, errorTag);
      if (!parameters.declarationReference) {
        return errorTag;
      }

      if (embeddedTokenReader.peekTokenKind() !== TokenKind.EndOfInput) {
        embeddedTokenReader.readToken();

        this._parserContext.log.addMessageForTokenSequence('Unexpected character after declaration reference',
          embeddedTokenReader.extractAccumulatedSequence(), errorTag);
        return errorTag;
      }
    }

    return new DocInheritDocTag(parameters);
  }

  private _parseLinkTag(docInlineTagParsedParameters: IDocInlineTagParsedParameters,
    embeddedTokenReader: TokenReader): DocInlineTagBase {

      // If an error occurs, then return a generic DocInlineTag instead of DocInheritDocTag
    const errorTag: DocInlineTag = new DocInlineTag(docInlineTagParsedParameters);

    const parameters: IDocLinkTagParsedParameters = {
      ...docInlineTagParsedParameters
    };

    if (!docInlineTagParsedParameters.tagContentExcerpt) {
      this._parserContext.log.addMessageForTokenSequence('The @link tag content is missing',
        parameters.tagNameExcerpt, errorTag);

      return errorTag;
    }

    // Is the link destination a URL or a declaration reference?
    //
    // The JSDoc "@link" tag allows URLs, however supporting full URLs would be highly
    // ambiguous, for example "microsoft.windows.camera:" is an actual valid URI scheme,
    // and even the common "mailto:example.com" looks suspiciously like a declaration reference.
    // In practice JSDoc URLs are nearly always HTTP or HTTPS, so it seems fairly reasonable to
    // require the URL to have "://" and a scheme without any punctuation in it.  If a more exotic
    // URL is needed, the HTML "<a>" tag can always be used.

    // We start with a fairly broad classifier heuristic, and then the parsers will refine this:
    // 1. Does it start with "//"?
    // 2. Does it contain "://"?

    let looksLikeUrl: boolean = embeddedTokenReader.peekTokenKind() === TokenKind.Slash
      && embeddedTokenReader.peekTokenAfterKind() === TokenKind.Slash;
    const marker: number = embeddedTokenReader.createMarker();

    let done: boolean = looksLikeUrl;
    while (!done) {
      switch (embeddedTokenReader.peekTokenKind()) {
        // An URI scheme can contain letters, numbers, minus, plus, and periods
        case TokenKind.AsciiWord:
        case TokenKind.Period:
        case TokenKind.Hyphen:
        case TokenKind.Plus:
          embeddedTokenReader.readToken();
          break;
        case TokenKind.Colon:
          embeddedTokenReader.readToken();
          // Once we a reach a colon, then it's a URL only if we see "://"
          looksLikeUrl = embeddedTokenReader.peekTokenKind() === TokenKind.Slash
            && embeddedTokenReader.peekTokenAfterKind() === TokenKind.Slash;
          done = true;
          break;
        default:
          done = true;
      }
    }

    embeddedTokenReader.backtrackToMarker(marker);

    // Is the hyperlink a URL or a declaration reference?
    if (looksLikeUrl) {
      // It starts with something like "http://", so parse it as a URL
      if (!this._parseLinkTagUrlDestination(embeddedTokenReader, parameters,
        docInlineTagParsedParameters.tagNameExcerpt, errorTag)) {
        return errorTag;
      }
    } else {
      // Otherwise, assume it's a declaration reference
      if (!this._parseLinkTagCodeDestination(embeddedTokenReader, parameters,
        docInlineTagParsedParameters.tagNameExcerpt, errorTag)) {
        return errorTag;
      }
    }

    if (embeddedTokenReader.peekTokenKind() === TokenKind.Spacing) {
      // The above parser rules should have consumed any spacing before the pipe
      throw new Error('Unconsumed spacing encountered after construct');
    }

    if (embeddedTokenReader.peekTokenKind() === TokenKind.Pipe) {
      // Read the link text
      embeddedTokenReader.readToken();
      parameters.pipeExcerpt = embeddedTokenReader.extractAccumulatedSequence();

      // Read everything until the end
      // NOTE: Because we're using an embedded TokenReader, the TokenKind.EndOfInput occurs
      // when we reach the "}", not the end of the original input
      done = false;
      while (!done) {
        switch (embeddedTokenReader.peekTokenKind()) {
          case TokenKind.EndOfInput:
            done = true;
            break;
          case TokenKind.Pipe:
          case TokenKind.LeftCurlyBracket:
            const badCharacter: string = embeddedTokenReader.readToken().toString();
            this._parserContext.log.addMessageForTokenSequence(
              `The "${badCharacter}" character may not be used in the link text without escaping it`,
              embeddedTokenReader.extractAccumulatedSequence(), errorTag);
            return errorTag;
          default:
            embeddedTokenReader.readToken();
        }
      }

      if (!embeddedTokenReader.isAccumulatedSequenceEmpty()) {
        parameters.linkTextExcerpt = embeddedTokenReader.extractAccumulatedSequence();
      }
    } else if (embeddedTokenReader.peekTokenKind() !== TokenKind.EndOfInput) {
      embeddedTokenReader.readToken();

      this._parserContext.log.addMessageForTokenSequence('Unexpected character after link destination',
        embeddedTokenReader.extractAccumulatedSequence(), errorTag);
      return errorTag;
    }

    return new DocLinkTag(parameters);
  }

  private _parseLinkTagUrlDestination(embeddedTokenReader: TokenReader, parameters: IDocLinkTagParsedParameters,
    tokenSequenceForErrorContext: TokenSequence, nodeForErrorContext: DocNode): boolean {

    // Simply accumulate everything up to the next space. We won't try to implement a proper
    // URI parser here.
    let urlDestination: string = '';

    let done: boolean = false;
    while (!done) {
      switch (embeddedTokenReader.peekTokenKind()) {
        case TokenKind.Spacing:
        case TokenKind.Newline:
        case TokenKind.EndOfInput:
        case TokenKind.Pipe:
        case TokenKind.RightCurlyBracket:
          done = true;
          break;
        default:
          urlDestination += embeddedTokenReader.readToken();
          break;
      }
    }

    if (urlDestination.length === 0) {
      // This should be impossible since the caller ensures that peekTokenKind() === TokenKind.AsciiWord
      throw new Error('Missing URL in _parseLinkTagUrl()');
    }

    const urlDestinationExcerpt: TokenSequence = embeddedTokenReader.extractAccumulatedSequence();

    const invalidUrlExplanation: string | undefined = StringChecks.explainIfInvalidLinkUrl(urlDestination);
    if (invalidUrlExplanation) {
      this._parserContext.log.addMessageForTokenSequence(invalidUrlExplanation,
        urlDestinationExcerpt, nodeForErrorContext);
      return false;
    }

    parameters.urlDestinationExcerpt = urlDestinationExcerpt;
    parameters.spacingAfterDestinationExcerpt = this._tryReadSpacingAndNewlines(embeddedTokenReader);

    return true;
  }

  private _parseLinkTagCodeDestination(embeddedTokenReader: TokenReader, parameters: IDocLinkTagParameters,
    tokenSequenceForErrorContext: TokenSequence, nodeForErrorContext: DocNode): boolean {

    parameters.codeDestination = this._parseDeclarationReference(embeddedTokenReader,
      tokenSequenceForErrorContext, nodeForErrorContext);

    return !!parameters.codeDestination;
  }

  private _parseDeclarationReference(tokenReader: TokenReader,
    tokenSequenceForErrorContext: TokenSequence, nodeForErrorContext: DocNode): DocDeclarationReference | undefined {

    tokenReader.assertAccumulatedSequenceIsEmpty();

    // The package name can contain characters that look like a member reference.  This means we need to scan forwards
    // to see if there is a "#".  However, we need to be careful not to match a "#" that is part of a quoted expression.

    const marker: number = tokenReader.createMarker();
    let hasHash: boolean = false;

    // A common mistake is to forget the "#" for package name or import path.  The telltale sign
    // of this is mistake is that we see path-only characters such as "@" or "/" in the beginning
    // where this would be a syntax error for a member reference.
    let lookingForImportCharacters: boolean = true;
    let sawImportCharacters: boolean = false;

    let done: boolean = false;
    while (!done) {
      switch (tokenReader.peekTokenKind()) {
        case TokenKind.DoubleQuote:
        case TokenKind.EndOfInput:
        case TokenKind.LeftCurlyBracket:
        case TokenKind.LeftParenthesis:
        case TokenKind.LeftSquareBracket:
        case TokenKind.Newline:
        case TokenKind.Pipe:
        case TokenKind.RightCurlyBracket:
        case TokenKind.RightParenthesis:
        case TokenKind.RightSquareBracket:
        case TokenKind.SingleQuote:
        case TokenKind.Spacing:
          done = true;
          break;
        case TokenKind.PoundSymbol:
          hasHash = true;
          done = true;
          break;
        case TokenKind.Slash:
        case TokenKind.AtSign:
          if (lookingForImportCharacters) {
            sawImportCharacters = true;
          }
          tokenReader.readToken();
          break;
        case TokenKind.AsciiWord:
        case TokenKind.Period:
        case TokenKind.Hyphen:
          // It's a character that looks like part of a package name or import path,
          // so don't set lookingForImportCharacters = false
          tokenReader.readToken();
          break;
        default:
          // Once we reach something other than AsciiWord and Period, then the meaning of
          // slashes and at-signs is no longer obvious.
          lookingForImportCharacters = false;

          tokenReader.readToken();
      }
    }

    if (!hasHash && sawImportCharacters) {
      // We saw characters that will be a syntax error if interpreted as a member reference,
      // but would make sense as a package name or import path, but we did not find a "#"
      this._parserContext.log.addMessageForTokenSequence(
        'The declaration reference appears to contain a package name or import path,'
          + ' but it is missing the "#" delimiter',
        tokenReader.extractAccumulatedSequence(), nodeForErrorContext);
      return undefined;
    }

    tokenReader.backtrackToMarker(marker);

    let packageNameExcerpt: TokenSequence | undefined;
    let importPathExcerpt: TokenSequence | undefined;
    let importHashExcerpt: TokenSequence | undefined;
    let spacingAfterImportHashExcerpt: TokenSequence | undefined;

    if (hasHash) {

      // If it starts with a "." then it's a relative path, not a package name
      if (tokenReader.peekTokenKind() !== TokenKind.Period) {

        // Read the package name:
        const scopedPackageName: boolean = tokenReader.peekTokenKind() === TokenKind.AtSign;
        let finishedScope: boolean = false;

        done = false;
        while (!done) {
          switch (tokenReader.peekTokenKind()) {
            case TokenKind.EndOfInput:
              // If hasHash=true, then we are expecting to stop when we reach the hash
              throw new Error('Expecting pound symbol');
            case TokenKind.Slash:
              // Stop at the first slash, unless this is a scoped package, in which case we stop at the second slash
              if (scopedPackageName && !finishedScope) {
                tokenReader.readToken();
                finishedScope = true;
              } else {
                done = true;
              }
              break;
            case TokenKind.PoundSymbol:
              done = true;
              break;
            default:
              tokenReader.readToken();
          }
        }

        if (!tokenReader.isAccumulatedSequenceEmpty()) {
          packageNameExcerpt = tokenReader.extractAccumulatedSequence();

          // Check that the packageName is syntactically valid
          const explanation: string | undefined = StringChecks.explainIfInvalidPackageName(
            packageNameExcerpt.toString());
          if (explanation) {
            this._parserContext.log.addMessageForTokenSequence(explanation,
              packageNameExcerpt, nodeForErrorContext);
            return undefined;
          }
        }
      }

      // Read the import path:
      done = false;
      while (!done) {
        switch (tokenReader.peekTokenKind()) {
          case TokenKind.EndOfInput:
            // If hasHash=true, then we are expecting to stop when we reach the hash
            throw new Error('Expecting pound symbol');
          case TokenKind.PoundSymbol:
            done = true;
            break;
          default:
            tokenReader.readToken();
        }
      }

      if (!tokenReader.isAccumulatedSequenceEmpty()) {
        importPathExcerpt = tokenReader.extractAccumulatedSequence();

        // Check that the importPath is syntactically valid
        const explanation: string | undefined = StringChecks.explainIfInvalidImportPath(
          importPathExcerpt.toString(), !!packageNameExcerpt);
        if (explanation) {
          this._parserContext.log.addMessageForTokenSequence(explanation,
            importPathExcerpt, nodeForErrorContext);
          return undefined;
        }
      }

      // Read the import hash
      if (tokenReader.peekTokenKind() !== TokenKind.PoundSymbol) {
        // The above logic should have left us at the PoundSymbol
        throw new Error('Expecting pound symbol');
      }
      tokenReader.readToken();
      importHashExcerpt = tokenReader.extractAccumulatedSequence();

      spacingAfterImportHashExcerpt = this._tryReadSpacingAndNewlines(tokenReader);

      if (packageNameExcerpt === undefined && importPathExcerpt === undefined) {
        this._parserContext.log.addMessageForTokenSequence(
          'The hash character must be preceded by a package name or import path',
          importHashExcerpt, nodeForErrorContext);
        return undefined;
      }
    }

    // Read the member references:
    const memberReferences: DocMemberReference[] = [];

    done = false;
    while (!done) {
      switch (tokenReader.peekTokenKind()) {
        case TokenKind.Period:
        case TokenKind.LeftParenthesis:
        case TokenKind.AsciiWord:
        case TokenKind.Colon:
        case TokenKind.LeftSquareBracket:
        case TokenKind.DoubleQuote:
          const expectingDot: boolean = memberReferences.length > 0;
          const memberReference: DocMemberReference | undefined
            = this._parseMemberReference(tokenReader, expectingDot, tokenSequenceForErrorContext, nodeForErrorContext);

          if (!memberReference) {
            return undefined;
          }

          memberReferences.push(memberReference);
          break;
        default:
          done = true;
      }
    }

    if (packageNameExcerpt === undefined && importPathExcerpt === undefined && memberReferences.length === 0) {
      // We didn't find any parts of a declaration reference
      this._parserContext.log.addMessageForTokenSequence('Expecting a declaration reference',
        tokenSequenceForErrorContext, nodeForErrorContext);
      return undefined;
    }

    return new DocDeclarationReference({
      parsed: true,

      packageNameExcerpt,
      importPathExcerpt,

      importHashExcerpt,
      spacingAfterImportHashExcerpt,

      memberReferences
    });
  }

  private _parseMemberReference(tokenReader: TokenReader, expectingDot: boolean,
    tokenSequenceForErrorContext: TokenSequence, nodeForErrorContext: DocNode): DocMemberReference | undefined {

    const parameters: IDocMemberReferenceParsedParameters = {
      parsed: true
    };

    // Read the dot operator
    if (expectingDot) {
      if (tokenReader.peekTokenKind() !== TokenKind.Period) {
        this._parserContext.log.addMessageForTokenSequence('Expecting a period before the next component'
          + ' of a declaration reference', tokenSequenceForErrorContext, nodeForErrorContext);
        return undefined;
      }
      tokenReader.readToken();
      parameters.dotExcerpt = tokenReader.extractAccumulatedSequence();

      parameters.spacingAfterDotExcerpt = this._tryReadSpacingAndNewlines(tokenReader);
    }

    // Read the left parenthesis if there is one
    if (tokenReader.peekTokenKind() === TokenKind.LeftParenthesis) {
      tokenReader.readToken();
      parameters.leftParenthesisExcerpt = tokenReader.extractAccumulatedSequence();

      parameters.spacingAfterLeftParenthesisExcerpt = this._tryReadSpacingAndNewlines(tokenReader);
    }

    // Read the member identifier or symbol
    if (tokenReader.peekTokenKind() === TokenKind.LeftSquareBracket) {
      parameters.memberSymbol = this._parseMemberSymbol(tokenReader, nodeForErrorContext);
      if (!parameters.memberSymbol) {
        return undefined;
      }
    } else {
      parameters.memberIdentifier = this._parseMemberIdentifier(tokenReader,
        tokenSequenceForErrorContext, nodeForErrorContext);

      if (!parameters.memberIdentifier) {
        return undefined;
      }
    }
    parameters.spacingAfterMemberExcerpt = this._tryReadSpacingAndNewlines(tokenReader);

    // Read the colon
    if (tokenReader.peekTokenKind() === TokenKind.Colon) {
      tokenReader.readToken();

      parameters.colonExcerpt = tokenReader.extractAccumulatedSequence();

      parameters.spacingAfterColonExcerpt = this._tryReadSpacingAndNewlines(tokenReader);

      if (!parameters.leftParenthesisExcerpt) {
        // In the current TSDoc draft standard, a member reference with a selector requires the parentheses.
        // It would be reasonable to make the parentheses optional, and we are contemplating simplifying the
        // notation in the future.  But for now the parentheses are required.
        this._parserContext.log.addMessageForTokenSequence(
          'Syntax error in declaration reference: the member selector must be enclosed in parentheses',
          parameters.colonExcerpt, nodeForErrorContext);
        return undefined;
      }

      // If there is a colon, then read the selector
      parameters.selector = this._parseMemberSelector(tokenReader, parameters.colonExcerpt, nodeForErrorContext);
      if (!parameters.selector) {
        return undefined;
      }

      parameters.spacingAfterSelectorExcerpt = this._tryReadSpacingAndNewlines(tokenReader);
    } else {
      if (parameters.leftParenthesisExcerpt) {
        this._parserContext.log.addMessageForTokenSequence('Expecting a colon after the identifier because'
          + ' the expression is in parentheses', parameters.leftParenthesisExcerpt, nodeForErrorContext);
        return undefined;
      }
    }

    // Read the right parenthesis
    if (parameters.leftParenthesisExcerpt) {
      if (tokenReader.peekTokenKind() !== TokenKind.RightParenthesis) {
        this._parserContext.log.addMessageForTokenSequence('Expecting a matching right parenthesis',
        parameters.leftParenthesisExcerpt, nodeForErrorContext);
        return undefined;
      }

      tokenReader.readToken();

      parameters.rightParenthesisExcerpt = tokenReader.extractAccumulatedSequence();

      parameters.spacingAfterRightParenthesisExcerpt = this._tryReadSpacingAndNewlines(tokenReader);
    }

    return new DocMemberReference(parameters);
  }

  private _parseMemberSymbol(tokenReader: TokenReader,
    nodeForErrorContext: DocNode): DocMemberSymbol | undefined {

    // Read the "["
    if (tokenReader.peekTokenKind() !== TokenKind.LeftSquareBracket) {
      // This should be impossible since the caller ensures that peekTokenKind() === TokenKind.LeftSquareBracket
      throw new Error('Expecting "["');
    }

    tokenReader.readToken();
    const leftBracketExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

    const spacingAfterLeftBracketExcerpt: TokenSequence | undefined = this._tryReadSpacingAndNewlines(tokenReader);

    // Read the declaration reference
    const declarationReference: DocDeclarationReference | undefined
      = this._parseDeclarationReference(tokenReader, leftBracketExcerpt, nodeForErrorContext);

    if (!declarationReference) {
      this._parserContext.log.addMessageForTokenSequence('Missing declaration reference in symbol reference',
        leftBracketExcerpt, nodeForErrorContext);

      return undefined;
    }

    // (We don't need to worry about spacing here since _parseDeclarationReference() absorbs trailing spaces)

    // Read the "]"
    if (tokenReader.peekTokenKind() !== TokenKind.RightSquareBracket) {
      this._parserContext.log.addMessageForTokenSequence('Missing closing square bracket for symbol reference',
        leftBracketExcerpt, nodeForErrorContext);

      return undefined;
    }

    tokenReader.readToken();
    const rightBracketExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

    return new DocMemberSymbol({
      parsed: true,
      leftBracketExcerpt,
      spacingAfterLeftBracketExcerpt,
      symbolReference: declarationReference,
      rightBracketExcerpt
    });
  }

  private _parseMemberIdentifier(tokenReader: TokenReader,
    tokenSequenceForErrorContext: TokenSequence, nodeForErrorContext: DocNode): DocMemberIdentifier | undefined {

    let leftQuoteExcerpt: TokenSequence | undefined = undefined;
    let rightQuoteExcerpt: TokenSequence | undefined = undefined;

      // Is this a quoted identifier?
    if (tokenReader.peekTokenKind() === TokenKind.DoubleQuote) {

      // Read the opening '"'
      tokenReader.readToken();
      leftQuoteExcerpt = tokenReader.extractAccumulatedSequence();

      // Read the text inside the quotes
      while (tokenReader.peekTokenKind() !== TokenKind.DoubleQuote) {
        if (tokenReader.peekTokenKind() === TokenKind.EndOfInput) {
          this._parserContext.log.addMessageForTokenSequence('Unexpected end of input inside quoted member identifier',
            leftQuoteExcerpt, nodeForErrorContext);
          return undefined;
        }

        tokenReader.readToken();
      }

      if (tokenReader.isAccumulatedSequenceEmpty()) {
        this._parserContext.log.addMessageForTokenSequence('The quoted identifier cannot be empty',
          leftQuoteExcerpt, nodeForErrorContext);
        return undefined;
      }

      const identifierExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

      // Read the closing '""
      tokenReader.readToken();  // read the quote
      rightQuoteExcerpt = tokenReader.extractAccumulatedSequence();

      return new DocMemberIdentifier({
        parsed: true,
        leftQuoteExcerpt,
        identifierExcerpt,
        rightQuoteExcerpt
      });
    } else {
      // Otherwise assume it's a valid TypeScript identifier
      if (tokenReader.peekTokenKind() !== TokenKind.AsciiWord) {
        this._parserContext.log.addMessageForTokenSequence(
          'Syntax error in declaration reference: expecting a member identifier',
          tokenSequenceForErrorContext, nodeForErrorContext);
        return undefined;
      }

      const identifier: string = tokenReader.readToken().toString();

      const identifierExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

      const explanation: string | undefined = StringChecks.explainIfInvalidUnquotedIdentifier(identifier);
      if (explanation) {
        this._parserContext.log.addMessageForTokenSequence(explanation,
          identifierExcerpt, nodeForErrorContext);
        return undefined;
      }

      return new DocMemberIdentifier({
        parsed: true,
        leftQuoteExcerpt,
        identifierExcerpt,
        rightQuoteExcerpt
      });
    }
  }

  private _parseMemberSelector(tokenReader: TokenReader,
    tokenSequenceForErrorContext: TokenSequence, nodeForErrorContext: DocNode): DocMemberSelector | undefined {

    if (tokenReader.peekTokenKind() !== TokenKind.AsciiWord) {
      this._parserContext.log.addMessageForTokenSequence('Expecting a selector label after the colon',
        tokenSequenceForErrorContext, nodeForErrorContext);
    }

    const selector: string = tokenReader.readToken().toString();
    const selectorExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

    const docMemberSelector: DocMemberSelector = new DocMemberSelector({
      parsed: true,
      selectorExcerpt,
      selector
    });

    if (docMemberSelector.errorMessage) {
      this._parserContext.log.addMessageForTokenSequence(docMemberSelector.errorMessage,
        selectorExcerpt, nodeForErrorContext);
      return undefined;
    }

    return docMemberSelector;
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

    const openingDelimiterExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

    // Read the element name
    const nameExcerpt: ResultOrFailure<TokenSequence> = this._parseHtmlName(tokenReader);
    if (isFailure(nameExcerpt)) {
      return this._backtrackAndCreateErrorForFailure(tokenReader, marker, 'Invalid HTML element: ', nameExcerpt);
    }

    const spacingAfterNameExcerpt: TokenSequence | undefined = this._tryReadSpacingAndNewlines(tokenReader);

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

    const closingDelimiterExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

    // NOTE: We don't read excerptParameters.separator here, since if there is any it
    // will be represented as DocPlainText.

    return new DocHtmlStartTag({
      parsed: true,

      openingDelimiterExcerpt,

      nameExcerpt,
      spacingAfterNameExcerpt,

      htmlAttributes,

      selfClosingTag,

      closingDelimiterExcerpt
    });
  }

  private _parseHtmlAttribute(tokenReader: TokenReader): ResultOrFailure<DocHtmlAttribute> {
    tokenReader.assertAccumulatedSequenceIsEmpty();

    // Read the attribute name
    const nameExcerpt: ResultOrFailure<TokenSequence> = this._parseHtmlName(tokenReader);
    if (isFailure(nameExcerpt)) {
      return nameExcerpt;
    }

    const spacingAfterNameExcerpt: TokenSequence | undefined = this._tryReadSpacingAndNewlines(tokenReader);

    // Read the equals
    if (tokenReader.peekTokenKind() !== TokenKind.Equals) {
      return this._createFailureForToken(tokenReader, 'Expecting "=" after HTML attribute name');
    }
    tokenReader.readToken();

    const equalsExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

    const spacingAfterEqualsExcerpt: TokenSequence | undefined = this._tryReadSpacingAndNewlines(tokenReader);

    // Read the attribute value
    const attributeValue: ResultOrFailure<string> = this._parseHtmlString(tokenReader);
    if (isFailure(attributeValue)) {
      return attributeValue;
    }

    const valueExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

    const spacingAfterValueExcerpt: TokenSequence | undefined = this._tryReadSpacingAndNewlines(tokenReader);

    return new DocHtmlAttribute({
      parsed: true,

      nameExcerpt,
      spacingAfterNameExcerpt,

      equalsExcerpt,
      spacingAfterEqualsExcerpt,

      valueExcerpt,
      spacingAfterValueExcerpt
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

    const openingDelimiterExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

    // Read the tag name
    const nameExcerpt: ResultOrFailure<TokenSequence> = this._parseHtmlName(tokenReader);
    if (isFailure(nameExcerpt)) {
      return this._backtrackAndCreateErrorForFailure(tokenReader, marker,
        'Expecting an HTML element name: ', nameExcerpt);
    }

    const spacingAfterNameExcerpt: TokenSequence | undefined = this._tryReadSpacingAndNewlines(tokenReader);

    // Read the closing ">"
    if (tokenReader.peekTokenKind() !== TokenKind.GreaterThan) {
      const failure: IFailure = this._createFailureForToken(tokenReader,
        'Expecting a closing ">" for the HTML tag');
      return this._backtrackAndCreateErrorForFailure(tokenReader, marker, '', failure);
    }
    tokenReader.readToken();

    const closingDelimiterExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

    return new DocHtmlEndTag({
      parsed: true,

      openingDelimiterExcerpt,

      nameExcerpt,
      spacingAfterNameExcerpt,

      closingDelimiterExcerpt
    });
  }

  /**
   * Parses an HTML name such as an element name or attribute name.
   */
  private _parseHtmlName(tokenReader: TokenReader): ResultOrFailure<TokenSequence> {
    const marker: number = tokenReader.createMarker();

    if (tokenReader.peekTokenKind() === TokenKind.Spacing) {
      return this._createFailureForTokensSince(tokenReader, 'A space is not allowed here', marker);
    }

    let done: boolean = false;
    while (!done) {
      switch (tokenReader.peekTokenKind()) {
        case TokenKind.AsciiWord:
        case TokenKind.Hyphen:
          tokenReader.readToken();
          break;
        default:
          done = true;
          break;
      }
    }
    const excerpt: TokenSequence | undefined = tokenReader.tryExtractAccumulatedSequence();

    if (!excerpt) {
      return this._createFailureForToken(tokenReader, 'Expecting an HTML name');
    }

    const htmlName: string = excerpt.toString();

    const explanation: string | undefined = StringChecks.explainIfInvalidHtmlName(htmlName);

    if (explanation) {
      return this._createFailureForTokensSince(tokenReader, explanation, marker);
    }

    return excerpt;
  }

  private _parseFencedCode(tokenReader: TokenReader): DocNode {
    tokenReader.assertAccumulatedSequenceIsEmpty();

    const startMarker: number = tokenReader.createMarker();
    const endOfOpeningDelimiterMarker: number = startMarker + 2;

    switch (tokenReader.peekPreviousTokenKind()) {
      case TokenKind.Newline:
      case TokenKind.EndOfInput:
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
      // This would be a parser bug -- the caller of _parseFencedCode() should have verified this while
      // looking ahead to distinguish code spans/fences
      throw new Error('Expecting three backticks');
    }

    const openingFenceExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

    // Read any spaces after the delimiter,
    // but NOT the Newline since that goes with the spacingAfterLanguageExcerpt
    while (tokenReader.peekTokenKind() === TokenKind.Spacing) {
      tokenReader.readToken();
    }

    const spacingAfterOpeningFenceExcerpt: TokenSequence | undefined = tokenReader.tryExtractAccumulatedSequence();

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
    const restOfLineExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

    // Example: "pov-ray sdl"
    const languageExcerpt: TokenSequence = restOfLineExcerpt.getNewSequence(
      restOfLineExcerpt.startIndex, startOfPaddingMarker!);

    // Example: "    \n"
    const spacingAfterLanguageExcerpt: TokenSequence | undefined = restOfLineExcerpt.getNewSequence(
      startOfPaddingMarker!, restOfLineExcerpt.endIndex);

    // Read the code content until we see the closing ``` delimiter
    let codeEndMarker: number = -1;
    let closingFenceStartMarker: number = -1;
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
          closingFenceStartMarker = tokenReader.createMarker();
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

    // Example: "code 1\ncode 2\n  ```"
    const codeAndDelimiterExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

    // Example: "code 1\ncode 2\n"
    const codeExcerpt: TokenSequence = codeAndDelimiterExcerpt.getNewSequence(
      codeAndDelimiterExcerpt.startIndex, codeEndMarker);

    // Example: "  "
    const spacingBeforeClosingFenceExcerpt: TokenSequence | undefined = codeAndDelimiterExcerpt.getNewSequence(
      codeEndMarker, closingFenceStartMarker);

    // Example: "```"
    const closingFenceExcerpt: TokenSequence = codeAndDelimiterExcerpt.getNewSequence(
      closingFenceStartMarker, codeAndDelimiterExcerpt.endIndex);

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

    // Example: "   \n"
    const spacingAfterClosingFenceExcerpt: TokenSequence | undefined = tokenReader.tryExtractAccumulatedSequence();

    return new DocFencedCode({
      parsed: true,

      openingFenceExcerpt,
      spacingAfterOpeningFenceExcerpt,

      languageExcerpt,
      spacingAfterLanguageExcerpt,

      codeExcerpt,

      spacingBeforeClosingFenceExcerpt,
      closingFenceExcerpt,
      spacingAfterClosingFenceExcerpt
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

    tokenReader.readToken(); // read the backtick

    const openingDelimiterExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

    let codeExcerpt: TokenSequence | undefined = undefined;
    let closingDelimiterExcerpt: TokenSequence | undefined = undefined;

    // Parse the content backtick
    while (true) {
      const peekedTokenKind: TokenKind = tokenReader.peekTokenKind();
      // Did we find the matching token?
      if (peekedTokenKind === TokenKind.Backtick) {
        if (tokenReader.isAccumulatedSequenceEmpty()) {
          return this._backtrackAndCreateErrorRange(tokenReader, marker, marker + 1,
            'A code span must contain at least one character between the backticks');
        }

        codeExcerpt = tokenReader.extractAccumulatedSequence();

        tokenReader.readToken();
        closingDelimiterExcerpt = tokenReader.extractAccumulatedSequence();
        break;
      }
      if (peekedTokenKind === TokenKind.EndOfInput ||  peekedTokenKind === TokenKind.Newline) {
        return this._backtrackAndCreateError(tokenReader, marker,
          'The code span is missing its closing backtick');
      }
      tokenReader.readToken();
    }

    return new DocCodeSpan({
      parsed: true,

      openingDelimiterExcerpt,

      codeExcerpt,

      closingDelimiterExcerpt
    });
  }

  private _tryReadSpacingAndNewlines(tokenReader: TokenReader): TokenSequence | undefined {
    let done: boolean = false;
    do {
      switch (tokenReader.peekTokenKind()) {
        case TokenKind.Spacing:
        case TokenKind.Newline:
          tokenReader.readToken();
          break;
        default:
          done = true;
          break;
      }
    } while (!done);
    return tokenReader.tryExtractAccumulatedSequence();
  }

  /**
   * Read the next token, and report it as a DocErrorText node.
   */
  private _createError(tokenReader: TokenReader, errorMessage: string): DocErrorText {
    tokenReader.readToken();

    const textExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

    const docErrorText: DocErrorText = new DocErrorText({
      parsed: true,

      textExcerpt,

      errorMessage,
      errorLocation: textExcerpt
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

    const textExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

    const docErrorText: DocErrorText = new DocErrorText({
      parsed: true,

      textExcerpt,

      errorMessage: errorMessage,
      errorLocation: textExcerpt
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

    const textExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

    const docErrorText: DocErrorText = new DocErrorText({
      parsed: true,

      textExcerpt,

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

    const textExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

    const docErrorText: DocErrorText = new DocErrorText({
      parsed: true,
      textExcerpt,

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
