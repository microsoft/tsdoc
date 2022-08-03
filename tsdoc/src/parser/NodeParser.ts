/* eslint-disable max-lines */

import { ParserContext } from './ParserContext';
import { Token, TokenKind } from './Token';
import { Tokenizer } from './Tokenizer';
import {
  DocBlockTag,
  DocCodeSpan,
  DocErrorText,
  DocEscapedText,
  DocXmlAttribute,
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
import { TSDocConfiguration } from '../configuration/TSDocConfiguration';
import { TSDocTagDefinition, TSDocTagSyntaxKind } from '../configuration/TSDocTagDefinition';
import { StandardTags } from '../details/StandardTags';
import { PlainTextEmitter } from '../emitters/PlainTextEmitter';
import { TSDocMessageId } from './TSDocMessageId';
import { DocXmlElement } from '../nodes/DocXmlElement';

interface IFailure {
  // (We use "failureMessage" instead of "errorMessage" here so that DocErrorText doesn't
  // accidentally implement this interface.)
  failureMessageId: TSDocMessageId;
  failureMessage: string;
  failureLocation: TokenSequence;
}

type ResultOrFailure<T> = T | IFailure;

function isFailure<T>(resultOrFailure: ResultOrFailure<T>): resultOrFailure is IFailure {
  return resultOrFailure !== undefined && Object.hasOwnProperty.call(resultOrFailure, 'failureMessage');
}

/**
 * The main parser for TSDoc comments.
 */
export class NodeParser {
  private readonly _parserContext: ParserContext;
  private readonly _configuration: TSDocConfiguration;
  private _currentSection: DocSection;
  private _currentElement: DocXmlElement | undefined;

  public constructor(parserContext: ParserContext) {
    this._parserContext = parserContext;
    this._configuration = parserContext.configuration;

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
          this._pushNode(
            new DocSoftBreak({
              parsed: true,
              configuration: this._configuration,
              softBreakExcerpt: tokenReader.extractAccumulatedSequence()
            })
          );
          break;
        case TokenKind.Backslash:
          this._pushAccumulatedPlainText(tokenReader);
          this._pushNode(this._parseBackslashEscape(tokenReader));
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
              this._pushNode(
                this._backtrackAndCreateErrorRange(
                  tokenReader,
                  marker,
                  tagEndMarker,
                  TSDocMessageId.ExtraInheritDocTag,
                  'A doc comment cannot have more than one @inheritDoc tag'
                )
              );
            }
          } else {
            this._pushNode(docNode);
          }
          break;
        }
        case TokenKind.RightCurlyBracket:
          this._pushAccumulatedPlainText(tokenReader);
          this._pushNode(
            this._createError(
              tokenReader,
              TSDocMessageId.EscapeRightBrace,
              'The "}" character should be escaped using a backslash to avoid confusion with a TSDoc inline tag'
            )
          );
          break;
        case TokenKind.LessThan:
          this._pushAccumulatedPlainText(tokenReader);
          this._pushNode(this._parseXmlElement(tokenReader));
          break;
        case TokenKind.GreaterThan:
          this._pushAccumulatedPlainText(tokenReader);
          this._pushNode(
            this._createError(
              tokenReader,
              TSDocMessageId.EscapeGreaterThan,
              'The ">" character should be escaped using a backslash to avoid confusion with an HTML tag'
            )
          );
          break;
        case TokenKind.Backtick:
          this._pushAccumulatedPlainText(tokenReader);

          if (
            tokenReader.peekTokenAfterKind() === TokenKind.Backtick &&
            tokenReader.peekTokenAfterAfterKind() === TokenKind.Backtick
          ) {
            this._pushNode(this._parseFencedCode(tokenReader));
          } else {
            this._pushNode(this._parseCodeSpan(tokenReader));
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
          TSDocMessageId.MissingDeprecationMessage,
          `The ${docComment.deprecatedBlock.blockTag.tagName} block must include a deprecation message,` +
            ` e.g. describing the recommended alternative`,
          docComment.deprecatedBlock.blockTag.getTokenSequence(),
          docComment.deprecatedBlock
        );
      }
    }

    if (docComment.inheritDocTag) {
      if (docComment.remarksBlock) {
        this._parserContext.log.addMessageForTokenSequence(
          TSDocMessageId.InheritDocIncompatibleTag,
          `A "${docComment.remarksBlock.blockTag.tagName}" block must not be used, because that` +
            ` content is provided by the @inheritDoc tag`,
          docComment.remarksBlock.blockTag.getTokenSequence(),
          docComment.remarksBlock.blockTag
        );
      }
      if (PlainTextEmitter.hasAnyTextContent(docComment.summarySection)) {
        this._parserContext.log.addMessageForTextRange(
          TSDocMessageId.InheritDocIncompatibleSummary,
          'The summary section must not have any content, because that' +
            ' content is provided by the @inheritDoc tag',
          this._parserContext.commentRange
        );
      }
    }
  }

  private _validateTagDefinition(
    tagDefinition: TSDocTagDefinition | undefined,
    tagName: string,
    expectingInlineTag: boolean,
    tokenSequenceForErrorContext: TokenSequence,
    nodeForErrorContext: DocNode
  ): void {
    if (tagDefinition) {
      const isInlineTag: boolean = tagDefinition.syntaxKind === TSDocTagSyntaxKind.InlineTag;

      if (isInlineTag !== expectingInlineTag) {
        // The tag is defined, but it is used incorrectly
        if (expectingInlineTag) {
          this._parserContext.log.addMessageForTokenSequence(
            TSDocMessageId.TagShouldNotHaveBraces,
            `The TSDoc tag "${tagName}" is not an inline tag; it must not be enclosed in "{ }" braces`,
            tokenSequenceForErrorContext,
            nodeForErrorContext
          );
        } else {
          this._parserContext.log.addMessageForTokenSequence(
            TSDocMessageId.InlineTagMissingBraces,
            `The TSDoc tag "${tagName}" is an inline tag; it must be enclosed in "{ }" braces`,
            tokenSequenceForErrorContext,
            nodeForErrorContext
          );
        }
      } else {
        if (this._parserContext.configuration.validation.reportUnsupportedTags) {
          if (!this._parserContext.configuration.isTagSupported(tagDefinition)) {
            // The tag is defined, but not supported
            this._parserContext.log.addMessageForTokenSequence(
              TSDocMessageId.UnsupportedTag,
              `The TSDoc tag "${tagName}" is not supported by this tool`,
              tokenSequenceForErrorContext,
              nodeForErrorContext
            );
          }
        }
      }
    } else {
      // The tag is not defined
      if (!this._parserContext.configuration.validation.ignoreUndefinedTags) {
        this._parserContext.log.addMessageForTokenSequence(
          TSDocMessageId.UndefinedTag,
          `The TSDoc tag "${tagName}" is not defined in this configuration`,
          tokenSequenceForErrorContext,
          nodeForErrorContext
        );
      }
    }
  }

  private _pushAccumulatedPlainText(tokenReader: TokenReader): void {
    if (!tokenReader.isAccumulatedSequenceEmpty()) {
      this._pushNode(
        new DocPlainText({
          parsed: true,
          configuration: this._configuration,
          textExcerpt: tokenReader.extractAccumulatedSequence()
        })
      );
    }
  }

  private _parseAndPushBlock(tokenReader: TokenReader): void {
    const docComment: DocComment = this._parserContext.docComment;
    const configuration: TSDocConfiguration = this._parserContext.configuration;
    const modifierTagSet: ModifierTagSet = docComment.modifierTagSet;

    const parsedBlockTag: DocNode = this._parseBlockTag(tokenReader);
    if (parsedBlockTag.kind !== DocNodeKind.BlockTag) {
      this._pushNode(parsedBlockTag);
      return;
    }

    const docBlockTag: DocBlockTag = parsedBlockTag as DocBlockTag;

    // Do we have a definition for this tag?
    const tagDefinition: TSDocTagDefinition | undefined = configuration.tryGetTagDefinitionWithUpperCase(
      docBlockTag.tagNameWithUpperCase
    );
    this._validateTagDefinition(
      tagDefinition,
      docBlockTag.tagName,
      /* expectingInlineTag */ false,
      docBlockTag.getTokenSequence(),
      docBlockTag
    );

    if (tagDefinition) {
      switch (tagDefinition.syntaxKind) {
        case TSDocTagSyntaxKind.BlockTag:
          if (docBlockTag.tagNameWithUpperCase === StandardTags.param.tagNameWithUpperCase) {
            const docParamBlock: DocParamBlock = this._parseParamBlock(
              tokenReader,
              docBlockTag,
              StandardTags.param.tagName
            );

            this._parserContext.docComment.params.add(docParamBlock);

            this._currentSection = docParamBlock.content;
            return;
          } else if (docBlockTag.tagNameWithUpperCase === StandardTags.typeParam.tagNameWithUpperCase) {
            const docParamBlock: DocParamBlock = this._parseParamBlock(
              tokenReader,
              docBlockTag,
              StandardTags.typeParam.tagName
            );

            this._parserContext.docComment.typeParams.add(docParamBlock);

            this._currentSection = docParamBlock.content;
            return;
          } else {
            const newBlock: DocBlock = new DocBlock({
              configuration: this._configuration,
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

    this._pushNode(docBlockTag);
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
      case StandardTags.see.tagNameWithUpperCase:
        docComment._appendSeeBlock(block);
        break;
      default:
        docComment.appendCustomBlock(block);
    }
  }

  /**
   * Used by `_parseParamBlock()`, this parses a JSDoc expression remainder like `string}` or `="]"]` from
   * an input like `@param {string} [x="]"] - the X value`.  It detects nested balanced pairs of delimiters
   * and escaped string literals.
   */
  private _tryParseJSDocTypeOrValueRest(
    tokenReader: TokenReader,
    openKind: TokenKind,
    closeKind: TokenKind,
    startMarker: number
  ): TokenSequence | undefined {
    let quoteKind: TokenKind | undefined;
    let openCount: number = 1;
    while (openCount > 0) {
      let tokenKind: TokenKind = tokenReader.peekTokenKind();
      switch (tokenKind) {
        case openKind:
          // ignore open bracket/brace inside of a quoted string
          if (quoteKind === undefined) openCount++;
          break;
        case closeKind:
          // ignore close bracket/brace inside of a quoted string
          if (quoteKind === undefined) openCount--;
          break;
        case TokenKind.Backslash:
          // ignore backslash outside of quoted string
          if (quoteKind !== undefined) {
            // skip the backslash and the next character.
            tokenReader.readToken();
            tokenKind = tokenReader.peekTokenKind();
          }
          break;
        case TokenKind.DoubleQuote:
        case TokenKind.SingleQuote:
        case TokenKind.Backtick:
          if (quoteKind === tokenKind) {
            // exit quoted string if quote character matches.
            quoteKind = undefined;
          } else if (quoteKind === undefined) {
            // start quoted string if not in a quoted string.
            quoteKind = tokenKind;
          }
          break;
      }
      // give up at end of input and backtrack to start.
      if (tokenKind === TokenKind.EndOfInput) {
        tokenReader.backtrackToMarker(startMarker);
        return undefined;
      }
      tokenReader.readToken();
    }
    return tokenReader.tryExtractAccumulatedSequence();
  }

  /**
   * Used by `_parseParamBlock()`, this parses a JSDoc expression like `{string}` from
   * an input like `@param {string} x - the X value`.
   */
  private _tryParseUnsupportedJSDocType(
    tokenReader: TokenReader,
    docBlockTag: DocBlockTag,
    tagName: string
  ): TokenSequence | undefined {
    tokenReader.assertAccumulatedSequenceIsEmpty();

    // do not parse `{@...` as a JSDoc type
    if (
      tokenReader.peekTokenKind() !== TokenKind.LeftCurlyBracket ||
      tokenReader.peekTokenAfterKind() === TokenKind.AtSign
    ) {
      return undefined;
    }

    const startMarker: number = tokenReader.createMarker();
    tokenReader.readToken(); // read the "{"

    let jsdocTypeExcerpt: TokenSequence | undefined = this._tryParseJSDocTypeOrValueRest(
      tokenReader,
      TokenKind.LeftCurlyBracket,
      TokenKind.RightCurlyBracket,
      startMarker
    );

    if (jsdocTypeExcerpt) {
      this._parserContext.log.addMessageForTokenSequence(
        TSDocMessageId.ParamTagWithInvalidType,
        'The ' + tagName + " block should not include a JSDoc-style '{type}'",
        jsdocTypeExcerpt,
        docBlockTag
      );

      const spacingAfterJsdocTypeExcerpt: TokenSequence | undefined = this._tryReadSpacingAndNewlines(
        tokenReader
      );
      if (spacingAfterJsdocTypeExcerpt) {
        jsdocTypeExcerpt = jsdocTypeExcerpt.getNewSequence(
          jsdocTypeExcerpt.startIndex,
          spacingAfterJsdocTypeExcerpt.endIndex
        );
      }
    }
    return jsdocTypeExcerpt;
  }

  /**
   * Used by `_parseParamBlock()`, this parses a JSDoc expression remainder like `=[]]` from
   * an input like `@param {string} [x=[]] - the X value`.
   */
  private _tryParseJSDocOptionalNameRest(tokenReader: TokenReader): TokenSequence | undefined {
    tokenReader.assertAccumulatedSequenceIsEmpty();
    if (tokenReader.peekTokenKind() !== TokenKind.EndOfInput) {
      const startMarker: number = tokenReader.createMarker();
      return this._tryParseJSDocTypeOrValueRest(
        tokenReader,
        TokenKind.LeftSquareBracket,
        TokenKind.RightSquareBracket,
        startMarker
      );
    }
    return undefined;
  }

  private _parseParamBlock(
    tokenReader: TokenReader,
    docBlockTag: DocBlockTag,
    tagName: string
  ): DocParamBlock {
    const startMarker: number = tokenReader.createMarker();

    const spacingBeforeParameterNameExcerpt: TokenSequence | undefined = this._tryReadSpacingAndNewlines(
      tokenReader
    );

    // Skip past a JSDoc type (i.e., '@param {type} paramName') if found, and report a warning.
    const unsupportedJsdocTypeBeforeParameterNameExcerpt:
      | TokenSequence
      | undefined = this._tryParseUnsupportedJSDocType(tokenReader, docBlockTag, tagName);

    // Parse opening of invalid JSDoc optional parameter name (e.g., '[')
    let unsupportedJsdocOptionalNameOpenBracketExcerpt: TokenSequence | undefined;
    if (tokenReader.peekTokenKind() === TokenKind.LeftSquareBracket) {
      tokenReader.readToken(); // read the "["
      unsupportedJsdocOptionalNameOpenBracketExcerpt = tokenReader.extractAccumulatedSequence();
    }

    let parameterName: string = '';

    let done: boolean = false;
    while (!done) {
      switch (tokenReader.peekTokenKind()) {
        case TokenKind.AsciiWord:
        case TokenKind.Period:
        case TokenKind.DollarSign:
          parameterName += tokenReader.readToken();
          break;
        default:
          done = true;
          break;
      }
    }

    const explanation: string | undefined = StringChecks.explainIfInvalidUnquotedIdentifier(parameterName);

    if (explanation !== undefined) {
      tokenReader.backtrackToMarker(startMarker);

      const errorParamBlock: DocParamBlock = new DocParamBlock({
        configuration: this._configuration,
        blockTag: docBlockTag,
        parameterName: ''
      });
      const errorMessage: string =
        parameterName.length > 0
          ? 'The ' + tagName + ' block should be followed by a valid parameter name: ' + explanation
          : 'The ' + tagName + ' block should be followed by a parameter name';

      this._parserContext.log.addMessageForTokenSequence(
        TSDocMessageId.ParamTagWithInvalidName,
        errorMessage,
        docBlockTag.getTokenSequence(),
        docBlockTag
      );
      return errorParamBlock;
    }

    const parameterNameExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

    // Parse closing of invalid JSDoc optional parameter name (e.g., ']', '=default]').
    let unsupportedJsdocOptionalNameRestExcerpt: TokenSequence | undefined;
    if (unsupportedJsdocOptionalNameOpenBracketExcerpt) {
      unsupportedJsdocOptionalNameRestExcerpt = this._tryParseJSDocOptionalNameRest(tokenReader);

      let errorSequence: TokenSequence | undefined = unsupportedJsdocOptionalNameOpenBracketExcerpt;
      if (unsupportedJsdocOptionalNameRestExcerpt) {
        errorSequence = docBlockTag
          .getTokenSequence()
          .getNewSequence(
            unsupportedJsdocOptionalNameOpenBracketExcerpt.startIndex,
            unsupportedJsdocOptionalNameRestExcerpt.endIndex
          );
      }

      this._parserContext.log.addMessageForTokenSequence(
        TSDocMessageId.ParamTagWithInvalidOptionalName,
        'The ' +
          tagName +
          " should not include a JSDoc-style optional name; it must not be enclosed in '[ ]' brackets.",
        errorSequence,
        docBlockTag
      );
    }

    const spacingAfterParameterNameExcerpt: TokenSequence | undefined = this._tryReadSpacingAndNewlines(
      tokenReader
    );

    // Skip past a trailing JSDoc type (i.e., '@param paramName {type}') if found, and report a warning.
    const unsupportedJsdocTypeAfterParameterNameExcerpt:
      | TokenSequence
      | undefined = this._tryParseUnsupportedJSDocType(tokenReader, docBlockTag, tagName);

    // TODO: Warn if there is no space before or after the hyphen
    let hyphenExcerpt: TokenSequence | undefined;
    let spacingAfterHyphenExcerpt: TokenSequence | undefined;
    let unsupportedJsdocTypeAfterHyphenExcerpt: TokenSequence | undefined;
    if (tokenReader.peekTokenKind() === TokenKind.Hyphen) {
      tokenReader.readToken();
      hyphenExcerpt = tokenReader.extractAccumulatedSequence();
      // TODO: Only read one space
      spacingAfterHyphenExcerpt = this._tryReadSpacingAndNewlines(tokenReader);

      // Skip past a JSDoc type (i.e., '@param paramName - {type}') if found, and report a warning.
      unsupportedJsdocTypeAfterHyphenExcerpt = this._tryParseUnsupportedJSDocType(
        tokenReader,
        docBlockTag,
        tagName
      );
    } else {
      this._parserContext.log.addMessageForTokenSequence(
        TSDocMessageId.ParamTagMissingHyphen,
        'The ' + tagName + ' block should be followed by a parameter name and then a hyphen',
        docBlockTag.getTokenSequence(),
        docBlockTag
      );
    }

    return new DocParamBlock({
      parsed: true,
      configuration: this._configuration,

      blockTag: docBlockTag,

      spacingBeforeParameterNameExcerpt,

      unsupportedJsdocTypeBeforeParameterNameExcerpt,
      unsupportedJsdocOptionalNameOpenBracketExcerpt,

      parameterNameExcerpt,
      parameterName,

      unsupportedJsdocOptionalNameRestExcerpt,

      spacingAfterParameterNameExcerpt,

      unsupportedJsdocTypeAfterParameterNameExcerpt,

      hyphenExcerpt,

      spacingAfterHyphenExcerpt,

      unsupportedJsdocTypeAfterHyphenExcerpt
    });
  }

  private _pushNode(docNode: DocNode): void {
    if (this._configuration.docNodeManager.isAllowedChild(DocNodeKind.Paragraph, docNode.kind)) {
      this._currentSection.appendNodeInParagraph(docNode);
    } else {
      this._currentSection.appendNode(docNode);
    }
  }

  private _parseBackslashEscape(tokenReader: TokenReader): DocNode {
    tokenReader.assertAccumulatedSequenceIsEmpty();
    const marker: number = tokenReader.createMarker();

    tokenReader.readToken(); // read the backslash

    if (tokenReader.peekTokenKind() === TokenKind.EndOfInput) {
      return this._backtrackAndCreateError(
        tokenReader,
        marker,
        TSDocMessageId.UnnecessaryBackslash,
        'A backslash must precede another character that is being escaped'
      );
    }

    const escapedToken: Token = tokenReader.readToken(); // read the escaped character

    // In CommonMark, a backslash is only allowed before a punctuation
    // character.  In all other contexts, the backslash is interpreted as a
    // literal character.
    if (!Tokenizer.isPunctuation(escapedToken.kind)) {
      return this._backtrackAndCreateError(
        tokenReader,
        marker,
        TSDocMessageId.UnnecessaryBackslash,
        'A backslash can only be used to escape a punctuation character'
      );
    }

    const encodedTextExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

    return new DocEscapedText({
      parsed: true,
      configuration: this._configuration,

      escapeStyle: EscapeStyle.CommonMarkBackslash,
      encodedTextExcerpt,
      decodedText: escapedToken.toString()
    });
  }

  private _parseBlockTag(tokenReader: TokenReader): DocNode {
    tokenReader.assertAccumulatedSequenceIsEmpty();
    const marker: number = tokenReader.createMarker();

    if (tokenReader.peekTokenKind() !== TokenKind.AtSign) {
      return this._backtrackAndCreateError(
        tokenReader,
        marker,
        TSDocMessageId.MissingTag,
        'Expecting a TSDoc tag starting with "@"'
      );
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
        return this._backtrackAndCreateError(
          tokenReader,
          marker,
          TSDocMessageId.AtSignInWord,
          'The "@" character looks like part of a TSDoc tag; use a backslash to escape it'
        );
    }

    // Include the "@" as part of the tagName
    let tagName: string = tokenReader.readToken().toString();

    if (tokenReader.peekTokenKind() !== TokenKind.AsciiWord) {
      return this._backtrackAndCreateError(
        tokenReader,
        marker,
        TSDocMessageId.AtSignWithoutTagName,
        'Expecting a TSDoc tag name after "@"; if it is not a tag, use a backslash to escape this character'
      );
    }

    const tagNameMarker: number = tokenReader.createMarker();

    while (tokenReader.peekTokenKind() === TokenKind.AsciiWord) {
      tagName += tokenReader.readToken().toString();
    }

    switch (tokenReader.peekTokenKind()) {
      case TokenKind.Spacing:
      case TokenKind.Newline:
      case TokenKind.EndOfInput:
        break;
      default:
        const badCharacter: string = tokenReader.peekToken().range.toString()[0];
        return this._backtrackAndCreateError(
          tokenReader,
          marker,
          TSDocMessageId.CharactersAfterBlockTag,
          `The token "${tagName}" looks like a TSDoc tag but contains an invalid character` +
            ` ${JSON.stringify(badCharacter)}; if it is not a tag, use a backslash to escape the "@"`
        );
    }

    if (StringChecks.explainIfInvalidTSDocTagName(tagName)) {
      const failure: IFailure = this._createFailureForTokensSince(
        tokenReader,
        TSDocMessageId.MalformedTagName,
        'A TSDoc tag name must start with a letter and contain only letters and numbers',
        tagNameMarker
      );
      return this._backtrackAndCreateErrorForFailure(tokenReader, marker, '', failure);
    }

    return new DocBlockTag({
      parsed: true,
      configuration: this._configuration,

      tagName,
      tagNameExcerpt: tokenReader.extractAccumulatedSequence()
    });
  }

  private _parseInlineTag(tokenReader: TokenReader): DocNode {
    tokenReader.assertAccumulatedSequenceIsEmpty();
    const marker: number = tokenReader.createMarker();

    if (tokenReader.peekTokenKind() !== TokenKind.LeftCurlyBracket) {
      return this._backtrackAndCreateError(
        tokenReader,
        marker,
        TSDocMessageId.MissingTag,
        'Expecting a TSDoc tag starting with "{"'
      );
    }
    tokenReader.readToken();

    const openingDelimiterExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

    // For inline tags, if we handle errors by backtracking to the "{"  token, then the main loop
    // will then interpret the "@" as a block tag, which is almost certainly incorrect.  So the
    // DocErrorText needs to include both the "{" and "@" tokens.
    // We will use _backtrackAndCreateErrorRangeForFailure() for that.
    const atSignMarker: number = tokenReader.createMarker();

    if (tokenReader.peekTokenKind() !== TokenKind.AtSign) {
      return this._backtrackAndCreateError(
        tokenReader,
        marker,
        TSDocMessageId.MalformedInlineTag,
        'Expecting a TSDoc tag starting with "{@"'
      );
    }

    // Include the "@" as part of the tagName
    let tagName: string = tokenReader.readToken().toString();

    while (tokenReader.peekTokenKind() === TokenKind.AsciiWord) {
      tagName += tokenReader.readToken().toString();
    }

    if (tagName === '@') {
      // This is an unusual case
      const failure: IFailure = this._createFailureForTokensSince(
        tokenReader,
        TSDocMessageId.MalformedInlineTag,
        'Expecting a TSDoc inline tag name after the "{@" characters',
        atSignMarker
      );
      return this._backtrackAndCreateErrorRangeForFailure(tokenReader, marker, atSignMarker, '', failure);
    }

    if (StringChecks.explainIfInvalidTSDocTagName(tagName)) {
      const failure: IFailure = this._createFailureForTokensSince(
        tokenReader,
        TSDocMessageId.MalformedTagName,
        'A TSDoc tag name must start with a letter and contain only letters and numbers',
        atSignMarker
      );
      return this._backtrackAndCreateErrorRangeForFailure(tokenReader, marker, atSignMarker, '', failure);
    }

    const tagNameExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

    const spacingAfterTagNameExcerpt: TokenSequence | undefined = this._tryReadSpacingAndNewlines(
      tokenReader
    );

    if (spacingAfterTagNameExcerpt === undefined) {
      // If there were no spaces at all, that's an error unless it's the degenerate "{@tag}" case
      if (tokenReader.peekTokenKind() !== TokenKind.RightCurlyBracket) {
        const badCharacter: string = tokenReader.peekToken().range.toString()[0];
        const failure: IFailure = this._createFailureForToken(
          tokenReader,
          TSDocMessageId.CharactersAfterInlineTag,
          `The character ${JSON.stringify(
            badCharacter
          )} cannot appear after the TSDoc tag name; expecting a space`
        );
        return this._backtrackAndCreateErrorRangeForFailure(tokenReader, marker, atSignMarker, '', failure);
      }
    }

    let done: boolean = false;
    while (!done) {
      switch (tokenReader.peekTokenKind()) {
        case TokenKind.EndOfInput:
          return this._backtrackAndCreateErrorRange(
            tokenReader,
            marker,
            atSignMarker,
            TSDocMessageId.InlineTagMissingRightBrace,
            'The TSDoc inline tag name is missing its closing "}"'
          );
        case TokenKind.Backslash:
          // http://usejsdoc.org/about-block-inline-tags.html
          // "If your tag's text includes a closing curly brace (}), you must escape it with
          // a leading backslash (\)."
          tokenReader.readToken(); // discard the backslash

          // In CommonMark, a backslash is only allowed before a punctuation
          // character.  In all other contexts, the backslash is interpreted as a
          // literal character.
          if (!Tokenizer.isPunctuation(tokenReader.peekTokenKind())) {
            const failure: IFailure = this._createFailureForToken(
              tokenReader,
              TSDocMessageId.UnnecessaryBackslash,
              'A backslash can only be used to escape a punctuation character'
            );
            return this._backtrackAndCreateErrorRangeForFailure(
              tokenReader,
              marker,
              atSignMarker,
              'Error reading inline TSDoc tag: ',
              failure
            );
          }

          tokenReader.readToken();
          break;
        case TokenKind.LeftCurlyBracket: {
          const failure: IFailure = this._createFailureForToken(
            tokenReader,
            TSDocMessageId.InlineTagUnescapedBrace,
            'The "{" character must be escaped with a backslash when used inside a TSDoc inline tag'
          );
          return this._backtrackAndCreateErrorRangeForFailure(tokenReader, marker, atSignMarker, '', failure);
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
      configuration: this._configuration,

      openingDelimiterExcerpt,

      tagNameExcerpt,
      tagName,
      spacingAfterTagNameExcerpt,

      tagContentExcerpt,

      closingDelimiterExcerpt
    };

    const tagNameWithUpperCase: string = tagName.toUpperCase();

    // Create a new TokenReader that will reparse the tokens corresponding to the tagContent.
    const embeddedTokenReader: TokenReader = new TokenReader(
      this._parserContext,
      tagContentExcerpt ? tagContentExcerpt : TokenSequence.createEmpty(this._parserContext)
    );

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
    const tagDefinition:
      | TSDocTagDefinition
      | undefined = this._parserContext.configuration.tryGetTagDefinitionWithUpperCase(tagNameWithUpperCase);

    this._validateTagDefinition(
      tagDefinition,
      tagName,
      /* expectingInlineTag */ true,
      tagNameExcerpt,
      docNode
    );

    return docNode;
  }

  private _parseInheritDocTag(
    docInlineTagParsedParameters: IDocInlineTagParsedParameters,
    embeddedTokenReader: TokenReader
  ): DocInlineTagBase {
    // If an error occurs, then return a generic DocInlineTag instead of DocInheritDocTag
    const errorTag: DocInlineTag = new DocInlineTag(docInlineTagParsedParameters);

    const parameters: IDocInheritDocTagParameters = {
      ...docInlineTagParsedParameters
    };

    if (embeddedTokenReader.peekTokenKind() !== TokenKind.EndOfInput) {
      parameters.declarationReference = this._parseDeclarationReference(
        embeddedTokenReader,
        docInlineTagParsedParameters.tagNameExcerpt,
        errorTag
      );
      if (!parameters.declarationReference) {
        return errorTag;
      }

      if (embeddedTokenReader.peekTokenKind() !== TokenKind.EndOfInput) {
        embeddedTokenReader.readToken();

        this._parserContext.log.addMessageForTokenSequence(
          TSDocMessageId.InheritDocTagSyntax,
          'Unexpected character after declaration reference',
          embeddedTokenReader.extractAccumulatedSequence(),
          errorTag
        );
        return errorTag;
      }
    }

    return new DocInheritDocTag(parameters);
  }

  private _parseLinkTag(
    docInlineTagParsedParameters: IDocInlineTagParsedParameters,
    embeddedTokenReader: TokenReader
  ): DocInlineTagBase {
    // If an error occurs, then return a generic DocInlineTag instead of DocInheritDocTag
    const errorTag: DocInlineTag = new DocInlineTag(docInlineTagParsedParameters);

    const parameters: IDocLinkTagParsedParameters = {
      ...docInlineTagParsedParameters
    };

    if (!docInlineTagParsedParameters.tagContentExcerpt) {
      this._parserContext.log.addMessageForTokenSequence(
        TSDocMessageId.LinkTagEmpty,
        'The @link tag content is missing',
        parameters.tagNameExcerpt,
        errorTag
      );

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

    let looksLikeUrl: boolean =
      embeddedTokenReader.peekTokenKind() === TokenKind.Slash &&
      embeddedTokenReader.peekTokenAfterKind() === TokenKind.Slash;
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
          looksLikeUrl =
            embeddedTokenReader.peekTokenKind() === TokenKind.Slash &&
            embeddedTokenReader.peekTokenAfterKind() === TokenKind.Slash;
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
      if (
        !this._parseLinkTagUrlDestination(
          embeddedTokenReader,
          parameters,
          docInlineTagParsedParameters.tagNameExcerpt,
          errorTag
        )
      ) {
        return errorTag;
      }
    } else {
      // Otherwise, assume it's a declaration reference
      if (
        !this._parseLinkTagCodeDestination(
          embeddedTokenReader,
          parameters,
          docInlineTagParsedParameters.tagNameExcerpt,
          errorTag
        )
      ) {
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
      parameters.spacingAfterPipeExcerpt = this._tryReadSpacingAndNewlines(embeddedTokenReader);

      // Read everything until the end
      // NOTE: Because we're using an embedded TokenReader, the TokenKind.EndOfInput occurs
      // when we reach the "}", not the end of the original input
      done = false;
      let spacingAfterLinkTextMarker: number | undefined = undefined;
      while (!done) {
        switch (embeddedTokenReader.peekTokenKind()) {
          case TokenKind.EndOfInput:
            done = true;
            break;
          case TokenKind.Pipe:
          case TokenKind.LeftCurlyBracket:
            const badCharacter: string = embeddedTokenReader.readToken().toString();
            this._parserContext.log.addMessageForTokenSequence(
              TSDocMessageId.LinkTagUnescapedText,
              `The "${badCharacter}" character may not be used in the link text without escaping it`,
              embeddedTokenReader.extractAccumulatedSequence(),
              errorTag
            );
            return errorTag;
          case TokenKind.Spacing:
          case TokenKind.Newline:
            embeddedTokenReader.readToken();
            break;
          default:
            // We found a non-spacing character, so move the spacingAfterLinkTextMarker
            spacingAfterLinkTextMarker = embeddedTokenReader.createMarker() + 1;
            embeddedTokenReader.readToken();
        }
      }

      const linkTextAndSpacing:
        | TokenSequence
        | undefined = embeddedTokenReader.tryExtractAccumulatedSequence();
      if (linkTextAndSpacing) {
        if (spacingAfterLinkTextMarker === undefined) {
          // We never found any non-spacing characters, so everything is trailing spacing
          parameters.spacingAfterLinkTextExcerpt = linkTextAndSpacing;
        } else if (spacingAfterLinkTextMarker >= linkTextAndSpacing.endIndex) {
          // We found no trailing spacing, so everything we found is the text
          parameters.linkTextExcerpt = linkTextAndSpacing;
        } else {
          // Split the trailing spacing from the link text
          parameters.linkTextExcerpt = linkTextAndSpacing.getNewSequence(
            linkTextAndSpacing.startIndex,
            spacingAfterLinkTextMarker
          );
          parameters.spacingAfterLinkTextExcerpt = linkTextAndSpacing.getNewSequence(
            spacingAfterLinkTextMarker,
            linkTextAndSpacing.endIndex
          );
        }
      }
    } else if (embeddedTokenReader.peekTokenKind() !== TokenKind.EndOfInput) {
      embeddedTokenReader.readToken();

      this._parserContext.log.addMessageForTokenSequence(
        TSDocMessageId.LinkTagDestinationSyntax,
        'Unexpected character after link destination',
        embeddedTokenReader.extractAccumulatedSequence(),
        errorTag
      );
      return errorTag;
    }

    return new DocLinkTag(parameters);
  }

  private _parseLinkTagUrlDestination(
    embeddedTokenReader: TokenReader,
    parameters: IDocLinkTagParsedParameters,
    tokenSequenceForErrorContext: TokenSequence,
    nodeForErrorContext: DocNode
  ): boolean {
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
      throw new Error('Missing URL in _parseLinkTagUrlDestination()');
    }

    const urlDestinationExcerpt: TokenSequence = embeddedTokenReader.extractAccumulatedSequence();

    const invalidUrlExplanation: string | undefined = StringChecks.explainIfInvalidLinkUrl(urlDestination);
    if (invalidUrlExplanation) {
      this._parserContext.log.addMessageForTokenSequence(
        TSDocMessageId.LinkTagInvalidUrl,
        invalidUrlExplanation,
        urlDestinationExcerpt,
        nodeForErrorContext
      );
      return false;
    }

    parameters.urlDestinationExcerpt = urlDestinationExcerpt;
    parameters.spacingAfterDestinationExcerpt = this._tryReadSpacingAndNewlines(embeddedTokenReader);

    return true;
  }

  private _parseLinkTagCodeDestination(
    embeddedTokenReader: TokenReader,
    parameters: IDocLinkTagParameters,
    tokenSequenceForErrorContext: TokenSequence,
    nodeForErrorContext: DocNode
  ): boolean {
    parameters.codeDestination = this._parseDeclarationReference(
      embeddedTokenReader,
      tokenSequenceForErrorContext,
      nodeForErrorContext
    );

    return !!parameters.codeDestination;
  }

  private _parseDeclarationReference(
    tokenReader: TokenReader,
    tokenSequenceForErrorContext: TokenSequence,
    nodeForErrorContext: DocNode
  ): DocDeclarationReference | undefined {
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
        TSDocMessageId.ReferenceMissingHash,
        'The declaration reference appears to contain a package name or import path,' +
          ' but it is missing the "#" delimiter',
        tokenReader.extractAccumulatedSequence(),
        nodeForErrorContext
      );
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
            packageNameExcerpt.toString()
          );
          if (explanation) {
            this._parserContext.log.addMessageForTokenSequence(
              TSDocMessageId.ReferenceMalformedPackageName,
              explanation,
              packageNameExcerpt,
              nodeForErrorContext
            );
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
          importPathExcerpt.toString(),
          !!packageNameExcerpt
        );
        if (explanation) {
          this._parserContext.log.addMessageForTokenSequence(
            TSDocMessageId.ReferenceMalformedImportPath,
            explanation,
            importPathExcerpt,
            nodeForErrorContext
          );
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
          TSDocMessageId.ReferenceHashSyntax,
          'The hash character must be preceded by a package name or import path',
          importHashExcerpt,
          nodeForErrorContext
        );
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
          const memberReference: DocMemberReference | undefined = this._parseMemberReference(
            tokenReader,
            expectingDot,
            tokenSequenceForErrorContext,
            nodeForErrorContext
          );

          if (!memberReference) {
            return undefined;
          }

          memberReferences.push(memberReference);
          break;
        default:
          done = true;
      }
    }

    if (
      packageNameExcerpt === undefined &&
      importPathExcerpt === undefined &&
      memberReferences.length === 0
    ) {
      // We didn't find any parts of a declaration reference
      this._parserContext.log.addMessageForTokenSequence(
        TSDocMessageId.MissingReference,
        'Expecting a declaration reference',
        tokenSequenceForErrorContext,
        nodeForErrorContext
      );
      return undefined;
    }

    return new DocDeclarationReference({
      parsed: true,
      configuration: this._configuration,

      packageNameExcerpt,
      importPathExcerpt,

      importHashExcerpt,
      spacingAfterImportHashExcerpt,

      memberReferences
    });
  }

  private _parseMemberReference(
    tokenReader: TokenReader,
    expectingDot: boolean,
    tokenSequenceForErrorContext: TokenSequence,
    nodeForErrorContext: DocNode
  ): DocMemberReference | undefined {
    const parameters: IDocMemberReferenceParsedParameters = {
      parsed: true,
      configuration: this._configuration
    };

    // Read the dot operator
    if (expectingDot) {
      if (tokenReader.peekTokenKind() !== TokenKind.Period) {
        this._parserContext.log.addMessageForTokenSequence(
          TSDocMessageId.ReferenceMissingDot,
          'Expecting a period before the next component of a declaration reference',
          tokenSequenceForErrorContext,
          nodeForErrorContext
        );
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
      parameters.memberIdentifier = this._parseMemberIdentifier(
        tokenReader,
        tokenSequenceForErrorContext,
        nodeForErrorContext
      );

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
          TSDocMessageId.ReferenceSelectorMissingParens,
          'Syntax error in declaration reference: the member selector must be enclosed in parentheses',
          parameters.colonExcerpt,
          nodeForErrorContext
        );
        return undefined;
      }

      // If there is a colon, then read the selector
      parameters.selector = this._parseMemberSelector(
        tokenReader,
        parameters.colonExcerpt,
        nodeForErrorContext
      );
      if (!parameters.selector) {
        return undefined;
      }

      parameters.spacingAfterSelectorExcerpt = this._tryReadSpacingAndNewlines(tokenReader);
    } else {
      if (parameters.leftParenthesisExcerpt) {
        this._parserContext.log.addMessageForTokenSequence(
          TSDocMessageId.ReferenceMissingColon,
          'Expecting a colon after the identifier because the expression is in parentheses',
          parameters.leftParenthesisExcerpt,
          nodeForErrorContext
        );
        return undefined;
      }
    }

    // Read the right parenthesis
    if (parameters.leftParenthesisExcerpt) {
      if (tokenReader.peekTokenKind() !== TokenKind.RightParenthesis) {
        this._parserContext.log.addMessageForTokenSequence(
          TSDocMessageId.ReferenceMissingRightParen,
          'Expecting a matching right parenthesis',
          parameters.leftParenthesisExcerpt,
          nodeForErrorContext
        );
        return undefined;
      }

      tokenReader.readToken();

      parameters.rightParenthesisExcerpt = tokenReader.extractAccumulatedSequence();

      parameters.spacingAfterRightParenthesisExcerpt = this._tryReadSpacingAndNewlines(tokenReader);
    }

    return new DocMemberReference(parameters);
  }

  private _parseMemberSymbol(
    tokenReader: TokenReader,
    nodeForErrorContext: DocNode
  ): DocMemberSymbol | undefined {
    // Read the "["
    if (tokenReader.peekTokenKind() !== TokenKind.LeftSquareBracket) {
      // This should be impossible since the caller ensures that peekTokenKind() === TokenKind.LeftSquareBracket
      throw new Error('Expecting "["');
    }

    tokenReader.readToken();
    const leftBracketExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

    const spacingAfterLeftBracketExcerpt: TokenSequence | undefined = this._tryReadSpacingAndNewlines(
      tokenReader
    );

    // Read the declaration reference
    const declarationReference: DocDeclarationReference | undefined = this._parseDeclarationReference(
      tokenReader,
      leftBracketExcerpt,
      nodeForErrorContext
    );

    if (!declarationReference) {
      this._parserContext.log.addMessageForTokenSequence(
        TSDocMessageId.ReferenceSymbolSyntax,
        'Missing declaration reference in symbol reference',
        leftBracketExcerpt,
        nodeForErrorContext
      );

      return undefined;
    }

    // (We don't need to worry about spacing here since _parseDeclarationReference() absorbs trailing spaces)

    // Read the "]"
    if (tokenReader.peekTokenKind() !== TokenKind.RightSquareBracket) {
      this._parserContext.log.addMessageForTokenSequence(
        TSDocMessageId.ReferenceMissingRightBracket,
        'Missing closing square bracket for symbol reference',
        leftBracketExcerpt,
        nodeForErrorContext
      );

      return undefined;
    }

    tokenReader.readToken();
    const rightBracketExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

    return new DocMemberSymbol({
      parsed: true,
      configuration: this._configuration,

      leftBracketExcerpt,
      spacingAfterLeftBracketExcerpt,
      symbolReference: declarationReference,
      rightBracketExcerpt
    });
  }

  private _parseMemberIdentifier(
    tokenReader: TokenReader,
    tokenSequenceForErrorContext: TokenSequence,
    nodeForErrorContext: DocNode
  ): DocMemberIdentifier | undefined {
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
          this._parserContext.log.addMessageForTokenSequence(
            TSDocMessageId.ReferenceMissingQuote,
            'Unexpected end of input inside quoted member identifier',
            leftQuoteExcerpt,
            nodeForErrorContext
          );
          return undefined;
        }

        tokenReader.readToken();
      }

      if (tokenReader.isAccumulatedSequenceEmpty()) {
        this._parserContext.log.addMessageForTokenSequence(
          TSDocMessageId.ReferenceEmptyIdentifier,
          'The quoted identifier cannot be empty',
          leftQuoteExcerpt,
          nodeForErrorContext
        );
        return undefined;
      }

      const identifierExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

      // Read the closing '""
      tokenReader.readToken(); // read the quote
      rightQuoteExcerpt = tokenReader.extractAccumulatedSequence();

      return new DocMemberIdentifier({
        parsed: true,
        configuration: this._configuration,

        leftQuoteExcerpt,
        identifierExcerpt,
        rightQuoteExcerpt
      });
    } else {
      // Otherwise assume it's a valid TypeScript identifier

      let done: boolean = false;
      while (!done) {
        switch (tokenReader.peekTokenKind()) {
          case TokenKind.AsciiWord:
          case TokenKind.DollarSign:
            tokenReader.readToken();
            break;
          default:
            done = true;
            break;
        }
      }

      if (tokenReader.isAccumulatedSequenceEmpty()) {
        this._parserContext.log.addMessageForTokenSequence(
          TSDocMessageId.ReferenceMissingIdentifier,
          'Syntax error in declaration reference: expecting a member identifier',
          tokenSequenceForErrorContext,
          nodeForErrorContext
        );
        return undefined;
      }

      const identifierExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();
      const identifier: string = identifierExcerpt.toString();

      const explanation: string | undefined = StringChecks.explainIfInvalidUnquotedMemberIdentifier(
        identifier
      );
      if (explanation) {
        this._parserContext.log.addMessageForTokenSequence(
          TSDocMessageId.ReferenceUnquotedIdentifier,
          explanation,
          identifierExcerpt,
          nodeForErrorContext
        );
        return undefined;
      }

      return new DocMemberIdentifier({
        parsed: true,
        configuration: this._configuration,

        leftQuoteExcerpt,
        identifierExcerpt,
        rightQuoteExcerpt
      });
    }
  }

  private _parseMemberSelector(
    tokenReader: TokenReader,
    tokenSequenceForErrorContext: TokenSequence,
    nodeForErrorContext: DocNode
  ): DocMemberSelector | undefined {
    if (tokenReader.peekTokenKind() !== TokenKind.AsciiWord) {
      this._parserContext.log.addMessageForTokenSequence(
        TSDocMessageId.ReferenceMissingLabel,
        'Expecting a selector label after the colon',
        tokenSequenceForErrorContext,
        nodeForErrorContext
      );
    }

    const selector: string = tokenReader.readToken().toString();
    const selectorExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

    const docMemberSelector: DocMemberSelector = new DocMemberSelector({
      parsed: true,
      configuration: this._configuration,

      selectorExcerpt,
      selector
    });

    if (docMemberSelector.errorMessage) {
      this._parserContext.log.addMessageForTokenSequence(
        TSDocMessageId.ReferenceSelectorSyntax,
        docMemberSelector.errorMessage,
        selectorExcerpt,
        nodeForErrorContext
      );
      return undefined;
    }

    return docMemberSelector;
  }

  private _parseXmlElement(tokenReader: TokenReader): DocNode {
    tokenReader.assertAccumulatedSequenceIsEmpty();

    // Read the "<" delimiter
    const startTagLessThanToken: Token = tokenReader.readToken();
    if (startTagLessThanToken.kind !== TokenKind.LessThan) {
      // This would be a parser bug -- the caller of _parseXmlElement() should have verified this while
      // looking ahead
      throw new Error('Expecting an XML tag starting with "<"');
    }

    // Skip over opening "<"
    const startTagOpeningDelimiterExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();
    const startTagNameMarker: number = tokenReader.createMarker();

    // Read the element name
    const startTagNameExcerpt: ResultOrFailure<TokenSequence> = this._parseXmlName(tokenReader);
    if (isFailure(startTagNameExcerpt)) {
      return this._backtrackAndCreateErrorForFailure(
        tokenReader,
        startTagNameMarker,
        'Invalid XML tag name: ',
        startTagNameExcerpt
      );
    }

    const spacingAfterStartTagNameExcerpt: TokenSequence | undefined = this._tryReadSpacingAndNewlines(
      tokenReader
    );
    const xmlAttributes: DocXmlAttribute[] = [];

    // Read the attributes until we see a ">" or "/>"
    while (tokenReader.peekTokenKind() === TokenKind.AsciiWord) {
      const attributeMarker: number = tokenReader.createMarker();
      // Read the attribute
      const attributeNode: ResultOrFailure<DocXmlAttribute> = this._parseXmlAttribute(tokenReader);
      if (isFailure(attributeNode)) {
        return this._backtrackAndCreateErrorForFailure(
          tokenReader,
          attributeMarker,
          'Invalid XML attribute: ',
          attributeNode
        );
      }

      xmlAttributes.push(attributeNode);
    }

    tokenReader.assertAccumulatedSequenceIsEmpty();
    const startTagEndDelimiterMarker: number = tokenReader.createMarker();

    let selfClosingTag: boolean = false;
    if (tokenReader.peekTokenKind() === TokenKind.Slash) {
      tokenReader.readToken();
      selfClosingTag = true;
    }

    if (tokenReader.peekTokenKind() !== TokenKind.GreaterThan) {
      return this._backtrackAndCreateError(
        tokenReader,
        startTagEndDelimiterMarker,
        TSDocMessageId.XmlTagMissingGreaterThan,
        'Expecting an attribute or ">" or "/>"'
      );
    }
    tokenReader.readToken();

    // Capture start closing delimiter
    const startTagClosingDelimiterExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

    if (selfClosingTag) {
      // We're finished parsing the element here since self closing tags don't have
      // any children or a dedicated closing tag.
      return new DocXmlElement({
        parsed: true,
        configuration: this._configuration,
        nameExcerpt: startTagNameExcerpt,
        spacingAfterStartTagNameExcerpt,
        startTagOpeningDelimiterExcerpt,
        startTagClosingDelimiterExcerpt,
        spacingAfterElementExcerpt: this._tryReadSpacingAndNewlines(tokenReader),
        xmlAttributes,
        selfClosingTag,
        childNodes: []
      });
    }

    // Read out any whitespace between the parent and the child node.
    const spacingBetweenStartTagAndChildExcerpt: TokenSequence | undefined = this._tryReadSpacingAndNewlines(
      tokenReader
    );

    const childNodes: DocNode[] = [];

    // Loop through elements until we hit the closing tag.
    while (
      (tokenReader.peekTokenKind() === TokenKind.LessThan &&
        tokenReader.peekTokenAfterKind() !== TokenKind.Slash) ||
      tokenReader.peekTokenKind() === TokenKind.AsciiWord
    ) {
      // Scenario 1: We're parsing plaintext child
      if (tokenReader.peekTokenKind() === TokenKind.AsciiWord) {
        tokenReader.readToken();
        // Accumulate chars until there are none left.
        while (tokenReader.peekTokenKind() !== TokenKind.LessThan) {
          tokenReader.readToken();
        }

        const textExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();
        childNodes.push(
          new DocPlainText({
            parsed: true,
            configuration: this._configuration,
            textExcerpt
          })
        );
        // Consume spacing between child nodes
        this._tryReadSpacingAndNewlines(tokenReader);
      } else {
        // Scenario 2: We're parsing and XML element child

        // Recurse into the child element to generate all nested child nodes.
        const childNode: DocNode = this._parseXmlElement(tokenReader);

        if (childNode.kind === DocNodeKind.ErrorText) {
          break;
        }

        // Parse out all of the child nodes
        childNodes.push(childNode);
      }
    }

    const endMarker: number = tokenReader.createMarker();

    const endTagLessThanToken: Token = tokenReader.peekToken();
    if (endTagLessThanToken.kind !== TokenKind.LessThan) {
      return this._backtrackAndCreateError(
        tokenReader,
        // Note there's an edge case here that can cause the parser to fail
        // The input `<a><b/>` causes the next token to be EOI since it considers
        // `<b/>` to be a valid child element. After the child is parsed we will then
        // find out the the next token isn't a "<" and and try to backtrack to and read an EOI token.
        endTagLessThanToken.kind === TokenKind.EndOfInput ? endMarker - 1 : endMarker,
        TSDocMessageId.MissingXmlEndTag,
        'Expecting a closing tag starting with "</"'
      );
    }
    tokenReader.readToken();

    // Read the preceding "/" from the closing tag
    const slashToken: Token = tokenReader.peekToken();
    if (slashToken.kind !== TokenKind.Slash) {
      return this._backtrackAndCreateError(
        tokenReader,
        endMarker,
        TSDocMessageId.MissingXmlEndTag,
        'Expecting an XML tag starting with "</"'
      );
    }

    tokenReader.readToken();

    const endTagOpeningDelimiterExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

    const endTagNameExcerpt: ResultOrFailure<TokenSequence> = this._parseXmlName(tokenReader);
    if (isFailure(endTagNameExcerpt)) {
      return this._backtrackAndCreateErrorForFailure(
        tokenReader,
        endMarker,
        'Invalid XML end tag name: ',
        endTagNameExcerpt
      );
    }

    // Verify that the tag names are matching, if they aren't create a failure.
    if (endTagNameExcerpt.toString() !== startTagNameExcerpt.toString()) {
      return this._backtrackAndCreateError(
        tokenReader,
        endMarker,
        TSDocMessageId.XmlTagNameMismatch,
        `Expecting closing tag name to match opening tag name, got "${endTagNameExcerpt.toString()}" but expected "${startTagNameExcerpt.toString()}"`
      );
    }

    // Check for closing ">" delimiter
    const endTagGreaterThanToken: Token = tokenReader.readToken();
    if (endTagGreaterThanToken.kind !== TokenKind.GreaterThan) {
      return this._backtrackAndCreateError(
        tokenReader,
        endMarker,
        TSDocMessageId.XmlTagMissingGreaterThan,
        'Expecting a closing ">" delimiter for the end tag'
      );
    }

    const endTagClosingDelimiterExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

    // Consume any whitespace after the closing tag
    const spacingAfterEndTagExcerpt: TokenSequence | undefined = this._tryReadSpacingAndNewlines(tokenReader);

    const element: DocXmlElement = new DocXmlElement({
      parsed: true,
      configuration: this._configuration,
      startTagOpeningDelimiterExcerpt,
      startTagClosingDelimiterExcerpt,
      spacingBetweenStartTagAndChildExcerpt,
      spacingAfterStartTagNameExcerpt,
      spacingAfterEndTagExcerpt,
      endTagOpeningDelimiterExcerpt,
      endTagClosingDelimiterExcerpt,
      nameExcerpt: startTagNameExcerpt,
      xmlAttributes: xmlAttributes,
      selfClosingTag,
      childNodes
    });

    return element;
  }

  private _parseXmlAttribute(tokenReader: TokenReader): ResultOrFailure<DocXmlAttribute> {
    tokenReader.assertAccumulatedSequenceIsEmpty();

    // Read the attribute name
    const nameExcerpt: ResultOrFailure<TokenSequence> = this._parseXmlName(tokenReader);
    if (isFailure(nameExcerpt)) {
      return nameExcerpt;
    }

    const spacingAfterNameExcerpt: TokenSequence | undefined = this._tryReadSpacingAndNewlines(tokenReader);

    // Read the equals
    if (tokenReader.peekTokenKind() !== TokenKind.Equals) {
      return this._createFailureForToken(
        tokenReader,
        TSDocMessageId.XmlTagMissingEquals,
        'Expecting "=" after XML attribute name'
      );
    }
    tokenReader.readToken();

    const equalsExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

    const spacingAfterEqualsExcerpt: TokenSequence | undefined = this._tryReadSpacingAndNewlines(tokenReader);

    // Read the attribute value
    const attributeValue: ResultOrFailure<string> = this._parseXmlString(tokenReader);
    if (isFailure(attributeValue)) {
      return attributeValue;
    }

    const valueExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

    const spacingAfterValueExcerpt: TokenSequence | undefined = this._tryReadSpacingAndNewlines(tokenReader);

    return new DocXmlAttribute({
      parsed: true,
      configuration: this._configuration,

      nameExcerpt,
      spacingAfterNameExcerpt,

      equalsExcerpt,
      spacingAfterEqualsExcerpt,

      valueExcerpt,
      spacingAfterValueExcerpt
    });
  }

  private _parseXmlString(tokenReader: TokenReader): ResultOrFailure<string> {
    const marker: number = tokenReader.createMarker();
    const quoteTokenKind: TokenKind = tokenReader.peekTokenKind();
    if (quoteTokenKind !== TokenKind.DoubleQuote && quoteTokenKind !== TokenKind.SingleQuote) {
      return this._createFailureForToken(
        tokenReader,
        TSDocMessageId.XmlTagMissingString,
        'Expecting an XML string starting with a single-quote or double-quote character'
      );
    }
    tokenReader.readToken();

    let textWithoutQuotes: string = '';

    for (;;) {
      const peekedTokenKind: TokenKind = tokenReader.peekTokenKind();
      // Did we find the matching token?
      if (peekedTokenKind === quoteTokenKind) {
        tokenReader.readToken(); // extract the quote
        break;
      }
      if (peekedTokenKind === TokenKind.EndOfInput || peekedTokenKind === TokenKind.Newline) {
        return this._createFailureForToken(
          tokenReader,
          TSDocMessageId.XmlStringMissingQuote,
          'The XML string is missing its closing quote',
          marker
        );
      }
      textWithoutQuotes += tokenReader.readToken().toString();
    }

    // The next attribute cannot start immediately after this one
    if (tokenReader.peekTokenKind() === TokenKind.AsciiWord) {
      return this._createFailureForToken(
        tokenReader,
        TSDocMessageId.TextAfterXmlString,
        'The next character after a closing quote must be spacing or punctuation'
      );
    }

    return textWithoutQuotes;
  }

  /**
   * Parses an XML name such as an element name or attribute name.
   */
  private _parseXmlName(tokenReader: TokenReader): ResultOrFailure<TokenSequence> {
    const marker: number = tokenReader.createMarker();

    if (tokenReader.peekTokenKind() === TokenKind.Spacing) {
      return this._createFailureForTokensSince(
        tokenReader,
        TSDocMessageId.MalformedXmlName,
        'A space is not allowed here',
        marker
      );
    }

    let done: boolean = false;
    while (!done) {
      switch (tokenReader.peekTokenKind()) {
        case TokenKind.Hyphen:
        case TokenKind.Period:
        case TokenKind.AsciiWord:
          tokenReader.readToken();
          break;
        default:
          done = true;
          break;
      }
    }
    const excerpt: TokenSequence | undefined = tokenReader.tryExtractAccumulatedSequence();

    if (!excerpt) {
      return this._createFailureForToken(
        tokenReader,
        TSDocMessageId.MalformedXmlName,
        'Expecting an XML name'
      );
    }

    const xmlName: string = excerpt.toString();

    const explanation: string | undefined = StringChecks.explainIfInvalidXmlName(xmlName);

    if (explanation) {
      return this._createFailureForTokensSince(
        tokenReader,
        TSDocMessageId.MalformedXmlName,
        explanation,
        marker
      );
    }

    if (
      this._configuration.validation.reportUnsupportedXmlElements &&
      !this._configuration.isXmlElementSupported(xmlName)
    ) {
      return this._createFailureForToken(
        tokenReader,
        TSDocMessageId.UnsupportedXmlElementName,
        `The XML element name ${JSON.stringify(xmlName)} is not defined by your TSDoc configuration`,
        marker
      );
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
          TSDocMessageId.CodeFenceOpeningIndent,
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

    const spacingAfterOpeningFenceExcerpt:
      | TokenSequence
      | undefined = tokenReader.tryExtractAccumulatedSequence();

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
          const failure: IFailure = this._createFailureForToken(
            tokenReader,
            TSDocMessageId.CodeFenceSpecifierSyntax,
            'The language specifier cannot contain backtick characters'
          );
          return this._backtrackAndCreateErrorRangeForFailure(
            tokenReader,
            startMarker,
            endOfOpeningDelimiterMarker,
            'Error parsing code fence: ',
            failure
          );
        case TokenKind.EndOfInput:
          const failure2: IFailure = this._createFailureForToken(
            tokenReader,
            TSDocMessageId.CodeFenceMissingDelimiter,
            'Missing closing delimiter'
          );
          return this._backtrackAndCreateErrorRangeForFailure(
            tokenReader,
            startMarker,
            endOfOpeningDelimiterMarker,
            'Error parsing code fence: ',
            failure2
          );
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
      restOfLineExcerpt.startIndex,
      startOfPaddingMarker!
    );

    // Example: "    \n"
    const spacingAfterLanguageExcerpt: TokenSequence | undefined = restOfLineExcerpt.getNewSequence(
      startOfPaddingMarker!,
      restOfLineExcerpt.endIndex
    );

    // Read the code content until we see the closing ``` delimiter
    let codeEndMarker: number = -1;
    let closingFenceStartMarker: number = -1;
    done = false;
    let tokenBeforeDelimiter: Token;
    while (!done) {
      switch (tokenReader.peekTokenKind()) {
        case TokenKind.EndOfInput:
          const failure2: IFailure = this._createFailureForToken(
            tokenReader,
            TSDocMessageId.CodeFenceMissingDelimiter,
            'Missing closing delimiter'
          );
          return this._backtrackAndCreateErrorRangeForFailure(
            tokenReader,
            startMarker,
            endOfOpeningDelimiterMarker,
            'Error parsing code fence: ',
            failure2
          );
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
        TSDocMessageId.CodeFenceClosingIndent,
        'The closing delimiter for a code fence must not be indented',
        tokenBeforeDelimiter!.range
      );
    }

    // Example: "code 1\ncode 2\n  ```"
    const codeAndDelimiterExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

    // Example: "code 1\ncode 2\n"
    const codeExcerpt: TokenSequence = codeAndDelimiterExcerpt.getNewSequence(
      codeAndDelimiterExcerpt.startIndex,
      codeEndMarker
    );

    // Example: "  "
    const spacingBeforeClosingFenceExcerpt:
      | TokenSequence
      | undefined = codeAndDelimiterExcerpt.getNewSequence(codeEndMarker, closingFenceStartMarker);

    // Example: "```"
    const closingFenceExcerpt: TokenSequence = codeAndDelimiterExcerpt.getNewSequence(
      closingFenceStartMarker,
      codeAndDelimiterExcerpt.endIndex
    );

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
            TSDocMessageId.CodeFenceClosingSyntax,
            'Unexpected characters after closing delimiter for code fence',
            tokenReader.peekToken().range
          );
          done = true;
          break;
      }
    }

    // Example: "   \n"
    const spacingAfterClosingFenceExcerpt:
      | TokenSequence
      | undefined = tokenReader.tryExtractAccumulatedSequence();

    return new DocFencedCode({
      parsed: true,
      configuration: this._configuration,

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
      // This would be a parser bug -- the caller of _parseCodeSpan() should have verified this while
      // looking ahead to distinguish code spans/fences
      throw new Error('Expecting a code span starting with a backtick character "`"');
    }

    tokenReader.readToken(); // read the backtick

    const openingDelimiterExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

    let codeExcerpt: TokenSequence | undefined = undefined;
    let closingDelimiterExcerpt: TokenSequence | undefined = undefined;

    // Parse the content backtick
    for (;;) {
      const peekedTokenKind: TokenKind = tokenReader.peekTokenKind();
      // Did we find the matching token?
      if (peekedTokenKind === TokenKind.Backtick) {
        if (tokenReader.isAccumulatedSequenceEmpty()) {
          return this._backtrackAndCreateErrorRange(
            tokenReader,
            marker,
            marker + 1,
            TSDocMessageId.CodeSpanEmpty,
            'A code span must contain at least one character between the backticks'
          );
        }

        codeExcerpt = tokenReader.extractAccumulatedSequence();

        tokenReader.readToken();
        closingDelimiterExcerpt = tokenReader.extractAccumulatedSequence();
        break;
      }
      if (peekedTokenKind === TokenKind.EndOfInput || peekedTokenKind === TokenKind.Newline) {
        return this._backtrackAndCreateError(
          tokenReader,
          marker,
          TSDocMessageId.CodeSpanMissingDelimiter,
          'The code span is missing its closing backtick'
        );
      }
      tokenReader.readToken();
    }

    return new DocCodeSpan({
      parsed: true,
      configuration: this._configuration,

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
  private _createError(
    tokenReader: TokenReader,
    messageId: TSDocMessageId,
    errorMessage: string
  ): DocErrorText {
    tokenReader.readToken();

    const textExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

    const docErrorText: DocErrorText = new DocErrorText({
      parsed: true,
      configuration: this._configuration,

      textExcerpt,

      messageId,
      errorMessage,
      errorLocation: textExcerpt
    });
    this._parserContext.log.addMessageForDocErrorText(docErrorText);
    return docErrorText;
  }

  /**
   * Rewind to the specified marker, read the next token, and report it as a DocErrorText node.
   */
  private _backtrackAndCreateError(
    tokenReader: TokenReader,
    marker: number,
    messageId: TSDocMessageId,
    errorMessage: string
  ): DocErrorText {
    tokenReader.backtrackToMarker(marker);
    return this._createError(tokenReader, messageId, errorMessage);
  }

  /**
   * Rewind to the errorStartMarker, read the tokens up to and including errorInclusiveEndMarker,
   * and report it as a DocErrorText node.
   */
  private _backtrackAndCreateErrorRange(
    tokenReader: TokenReader,
    errorStartMarker: number,
    errorInclusiveEndMarker: number,
    messageId: TSDocMessageId,
    errorMessage: string
  ): DocErrorText {
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
      configuration: this._configuration,

      textExcerpt,

      messageId,
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
  private _backtrackAndCreateErrorForFailure(
    tokenReader: TokenReader,
    marker: number,
    errorMessagePrefix: string,
    failure: IFailure
  ): DocErrorText {
    tokenReader.backtrackToMarker(marker);
    tokenReader.readToken();

    const textExcerpt: TokenSequence = tokenReader.extractAccumulatedSequence();

    const docErrorText: DocErrorText = new DocErrorText({
      parsed: true,
      configuration: this._configuration,

      textExcerpt,

      messageId: failure.failureMessageId,
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
  private _backtrackAndCreateErrorRangeForFailure(
    tokenReader: TokenReader,
    errorStartMarker: number,
    errorInclusiveEndMarker: number,
    errorMessagePrefix: string,
    failure: IFailure
  ): DocErrorText {
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
      configuration: this._configuration,

      textExcerpt,

      messageId: failure.failureMessageId,
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
  private _createFailureForToken(
    tokenReader: TokenReader,
    failureMessageId: TSDocMessageId,
    failureMessage: string,
    tokenMarker?: number
  ): IFailure {
    if (!tokenMarker) {
      tokenMarker = tokenReader.createMarker();
    }

    const tokenSequence: TokenSequence = new TokenSequence({
      parserContext: this._parserContext,
      startIndex: tokenMarker,
      endIndex: tokenMarker + 1
    });

    return {
      failureMessageId,
      failureMessage,
      failureLocation: tokenSequence
    };
  }

  /**
   * Creates an IFailure whose TokenSequence starts from the specified marker and
   * encompasses all tokens read since then.  If none were read, then the next token used.
   */
  private _createFailureForTokensSince(
    tokenReader: TokenReader,
    failureMessageId: TSDocMessageId,
    failureMessage: string,
    startMarker: number
  ): IFailure {
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
      failureMessageId,
      failureMessage,
      failureLocation: tokenSequence
    };
  }
}
