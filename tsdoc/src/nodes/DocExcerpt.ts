import { DocNode, IDocNodeParameters, DocNodeKind } from './DocNode';
import { TokenSequence } from '../parser/TokenSequence';
import { TokenKind } from '../parser/Token';

export const enum ExcerptId {
  Spacing = 'Spacing',

  BlockTag = 'BlockTag',

  CodeSpan_OpeningDelimiter = 'CodeSpan_OpeningDelimiter',
  CodeSpan_Code = 'CodeSpan_Code',
  CodeSpan_ClosingDelimiter = 'CodeSpan_ClosingDelimiter',

  DeclarationReference_PackageName = 'DeclarationReference_PackageName',
  DeclarationReference_ImportPath = 'DeclarationReference_ImportPath',
  DeclarationReference_ImportHash = 'DeclarationReference_ImportHash',

  ErrorText = 'ErrorText',

  EscapedText = 'EscapedText',

  FencedCode_OpeningFence = 'FencedCode_OpeningFence',
  FencedCode_Language = 'FencedCode_Language',
  FencedCode_Code = 'FencedCode_Code',
  FencedCode_ClosingFence = 'FencedCode_ClosingFence',

  HtmlAttribute_Name = 'HtmlAttribute_Name',
  HtmlAttribute_Equals = 'HtmlAttribute_Equals',
  HtmlAttribute_Value = 'HtmlAttribute_Value',

  HtmlEndTag_OpeningDelimiter = 'HtmlEndTag_OpeningDelimiter',
  HtmlEndTag_Name = 'HtmlEndTag_Name',
  HtmlEndTag_ClosingDelimiter = 'HtmlEndTag_ClosingDelimiter',

  HtmlStartTag_OpeningDelimiter = 'HtmlStartTag_OpeningDelimiter',
  HtmlStartTag_Name = 'HtmlStartTag_Name',
  HtmlStartTag_ClosingDelimiter = 'HtmlStartTag_ClosingDelimiter',

  InlineTag_OpeningDelimiter = 'InlineTag_OpeningDelimiter',
  InlineTag_TagName = 'InlineTag_TagName',
  InlineTag_TagContent = 'InlineTag_TagContent',
  InlineTag_ClosingDelimiter = 'InlineTag_ClosingDelimiter',

  LinkTag_UrlDestination = 'LinkTag_UrlDestination',
  LinkTag_Pipe = 'LinkTag_Pipe',
  LinkTag_LinkText = 'LinkTag_LinkText',

  MemberIdentifier_LeftQuote = 'MemberIdentifier_LeftQuote',
  MemberIdentifier_Identifier = 'MemberIdentifier_Identifier',
  MemberIdentifier_RightQuote = 'MemberIdentifier_RightQuote',

  MemberReference_Dot = 'MemberReference_Dot',
  MemberReference_LeftParenthesis = 'MemberReference_LeftParenthesis',
  MemberReference_Colon = 'MemberReference_Colon',
  MemberReference_RightParenthesis = 'MemberReference_RightParenthesis',

  MemberSelector = 'MemberSelector',

  DocMemberSymbol_LeftBracket = 'DocMemberSymbol_LeftBracket',
  DocMemberSymbol_RightBracket = 'DocMemberSymbol_RightBracket',

  ParamBlock_ParameterName = 'ParamBlock_ParameterName',
  ParamBlock_Hyphen = 'ParamBlock_Hyphen',

  PlainText = 'PlainText',

  SoftBreak = 'SoftBreak'
}

/**
 * Constructor parameters for {@link DocExcerpt}.
 */
export interface IDocExcerptParameters extends IDocNodeParameters {
  excerptId: ExcerptId;
  content: TokenSequence;
}

export class DocExcerpt extends DocNode {
  /** {@inheritDoc} */
  public readonly kind: DocNodeKind = DocNodeKind.Excerpt;

  private readonly _excerptId: ExcerptId;
  private readonly _content: TokenSequence;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocExcerptParameters) {
    super(parameters);

    if (parameters.excerptId === ExcerptId.Spacing) {
      for (const token of parameters.content!.tokens) {
        switch (token.kind) {
          case TokenKind.Spacing:
          case TokenKind.Newline:
          case TokenKind.EndOfInput:
            break;
          default:
            throw new Error(`The excerptId=Spacing but the range contains a non-whitespace token`);
        }
      }
    }

    this._excerptId = parameters.excerptId;
    this._content = parameters.content;
  }

  public get excerptId(): ExcerptId {
    return this._excerptId;
  }

  public get content(): TokenSequence {
    return this._content;
  }
}
