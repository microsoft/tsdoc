import {
  DocNode,
  DocComment,
  DocNodeKind,
  DocPlainText,
  DocSection,
  DocBlock,
  DocParagraph,
  DocBlockTag,
  DocCodeSpan,
  DocFencedCode,
  DocDeclarationReference,
  DocErrorText,
  DocEscapedText,
  DocHtmlEndTag,
  DocHtmlStartTag,
  DocHtmlAttribute,
  DocInheritDocTag,
  DocInlineTagBase,
  DocInlineTag,
  DocLinkTag,
  DocMemberIdentifier,
  DocMemberReference,
  DocMemberSymbol,
  DocMemberSelector
} from '../nodes';
import { StringBuilder } from './StringBuilder';
import { DocNodeTransforms } from '../transforms/DocNodeTransforms';

enum LineState {
  Closed,
  StartOfLine,
  MiddleOfLine
}

/**
 * Constructor options for {@link TSDocEmitter}.
 */
export interface ITSDocEmitterParameters {

}

/**
 * Renders a DocNode tree as a code comment.
 */
export class TSDocEmitter {
  public readonly eol: string = '\n';

  private _lineState: LineState = LineState.Closed;
  private _previousLineHadContent: boolean = false;
  private _output: StringBuilder | undefined;

  public renderComment(output: StringBuilder, docComment: DocComment): void {
    this._lineState = LineState.Closed;
    this._previousLineHadContent = false;
    this._output = output;

    this._renderNode(docComment);

    this._writeEnd();
  }

  private _renderNode(docNode: DocNode | undefined): void {
    if (docNode === undefined) {
      return;
    }

    switch (docNode.kind) {
      case DocNodeKind.Block:
        const docBlock: DocBlock = docNode as DocBlock;
        this._writeNewline();
        this._renderNode(docBlock.blockTag);
        this._renderNode(docBlock.content);
        break;

      case DocNodeKind.BlockTag:
        const docBlockTag: DocBlockTag = docNode as DocBlockTag;
        if (this._lineState === LineState.MiddleOfLine) {
          this._writeContent(' ');
        }
        this._writeContent(docBlockTag.tagName);
        break;

      case DocNodeKind.CodeSpan:
        const docCodeSpan: DocCodeSpan = docNode as DocCodeSpan;
        this._writeContent('`');
        this._writeContent(docCodeSpan.code);
        this._writeContent('`');
        break;

      case DocNodeKind.Comment:
        const docComment: DocComment = docNode as DocComment;
        this._renderNodes([
          docComment.summarySection,
          docComment.remarksBlock,
          docComment.privateRemarks,
          docComment.deprecatedBlock,
          ...docComment.paramBlocks,
          ...docComment.typeParamBlocks,
          docComment.returnsBlock,
          ...docComment.customBlocks,
          docComment.inheritDocTag
        ]);
        if (docComment.modifierTagSet.nodes.length > 0) {
          this._ensureLineSkipped();
          this._renderNodes(docComment.modifierTagSet.nodes);
        }
        break;

      case DocNodeKind.DeclarationReference:
        const docDeclarationReference: DocDeclarationReference = docNode as DocDeclarationReference;
        this._writeContent(docDeclarationReference.packageName);
        this._writeContent(docDeclarationReference.importPath);
        if (docDeclarationReference.packageName !== undefined || docDeclarationReference.importPath !== undefined) {
          this._writeContent('#');
        }
        this._renderNodes(docDeclarationReference.memberReferences);
        break;

      case DocNodeKind.ErrorText:
        const docErrorText: DocErrorText = docNode as DocErrorText;
        this._writeContent(docErrorText.text);
        break;

      case DocNodeKind.EscapedText:
        const docEscapedText: DocEscapedText = docNode as DocEscapedText;
        this._writeContent(docEscapedText.encodedText);
        break;

      case DocNodeKind.FencedCode:
        const docFencedCode: DocFencedCode = docNode as DocFencedCode;

        this._ensureAtStartOfLine();

        this._writeContent('```');
        this._writeContent(docFencedCode.language);
        this._writeNewline();
        this._writeContent(docFencedCode.code);
        this._writeContent('```');
        this._writeNewline();
        this._writeNewline();
        break;

      case DocNodeKind.HtmlAttribute:
        const docHtmlAttribute: DocHtmlAttribute = docNode as DocHtmlAttribute;
        this._writeContent(docHtmlAttribute.name);
        this._writeContent(docHtmlAttribute.spacingAfterName);
        this._writeContent('=');
        this._writeContent(docHtmlAttribute.spacingAfterEquals);
        this._writeContent(docHtmlAttribute.value);
        this._writeContent(docHtmlAttribute.spacingAfterValue);
        break;

      case DocNodeKind.HtmlEndTag:
        const docHtmlEndTag: DocHtmlEndTag = docNode as DocHtmlEndTag;
        this._writeContent('</');
        this._writeContent(docHtmlEndTag.name);
        this._writeContent('>');
        break;

      case DocNodeKind.HtmlStartTag:
        const docHtmlStartTag: DocHtmlStartTag = docNode as DocHtmlStartTag;
        this._writeContent('<');
        this._writeContent(docHtmlStartTag.name);
        this._writeContent(docHtmlStartTag.spacingAfterName);

        let needsSpace: boolean = docHtmlStartTag.spacingAfterName === undefined
          || docHtmlStartTag.spacingAfterName.length === 0;

        for (const attribute of docHtmlStartTag.htmlAttributes) {
          if (needsSpace) {
            this._writeContent(' ');
          }
          this._renderNode(attribute);
          needsSpace = attribute.spacingAfterValue === undefined || attribute.spacingAfterValue.length === 0;
        }
        this._writeContent(docHtmlStartTag.selfClosingTag ? '/>' : '>');
        break;

      case DocNodeKind.InheritDocTag:
        const docInheritDocTag: DocInheritDocTag = docNode as DocInheritDocTag;
        this._renderInlineTag(docInheritDocTag, () => {
          if (docInheritDocTag.declarationReference) {
            this._writeContent(' ');
            this._renderNode(docInheritDocTag.declarationReference);
          }
        });
        break;

      case DocNodeKind.InlineTag:
        const docInlineTag: DocInlineTag = docNode as DocInlineTag;
        this._renderInlineTag(docInlineTag, () => {
          if (docInlineTag.tagContent.length > 0) {
            this._writeContent(' ');
            this._writeContent(docInlineTag.tagContent);
          }
        });
        break;

      case DocNodeKind.LinkTag:
        const docLinkTag: DocLinkTag = docNode as DocLinkTag;
        this._renderInlineTag(docLinkTag, () => {
          if (docLinkTag.urlDestination !== undefined || docLinkTag.codeDestination !== undefined) {
            this._writeContent(' ');
            if (docLinkTag.urlDestination !== undefined) {
              this._writeContent(docLinkTag.urlDestination);
            } else {
              this._renderNode(docLinkTag.codeDestination);
            }
          }
          if (docLinkTag.linkText !== undefined) {
            this._writeContent('|');
            this._writeContent(docLinkTag.linkText);
          }
        });
        break;

      case DocNodeKind.MemberIdentifier:
        const docMemberIdentifier: DocMemberIdentifier = docNode as DocMemberIdentifier;
        if (docMemberIdentifier.hasQuotes) {
          this._writeContent('"');
          this._writeContent(docMemberIdentifier.identifier); // todo: encoding
          this._writeContent('"');
        } else {
          this._writeContent(docMemberIdentifier.identifier);
        }
        break;

      case DocNodeKind.MemberReference:
        const docMemberReference: DocMemberReference = docNode as DocMemberReference;
        if (docMemberReference.hasDot) {
          this._writeContent('.');
        }

        if (docMemberReference.selector) {
          this._writeContent('(');
        }

        if (docMemberReference.memberSymbol) {
          this._renderNode(docMemberReference.memberSymbol);
        } else {
          this._renderNode(docMemberReference.memberIdentifier);
        }

        if (docMemberReference.selector) {
          this._writeContent(':');
          this._renderNode(docMemberReference.selector);
          this._writeContent(')');
        }
        break;

      case DocNodeKind.MemberSelector:
        const docMemberSelector: DocMemberSelector = docNode as DocMemberSelector;
        this._writeContent(docMemberSelector.selector);
        break;

      case DocNodeKind.MemberSymbol:
        const docMemberSymbol: DocMemberSymbol = docNode as DocMemberSymbol;
        this._writeContent('[');
        this._renderNode(docMemberSymbol.symbolReference);
        this._writeContent(']');
        break;

      case DocNodeKind.Section:
        const docSection: DocSection = docNode as DocSection;
        this._renderNodes(docSection.nodes);
        break;

      case DocNodeKind.Paragraph:
        const trimmedParagraph: DocParagraph = DocNodeTransforms.trimSpacesInParagraph(docNode as DocParagraph);
        if (trimmedParagraph.nodes.length > 0) {
          this._ensureLineSkipped();
          this._renderNodes(trimmedParagraph.nodes);
          this._writeNewline();
        }
        break;

      case DocNodeKind.PlainText:
        const docPlainText: DocPlainText = docNode as DocPlainText;
        this._writeContent(docPlainText.text);
        break;
    }
  }

  private _renderInlineTag(docInlineTagBase: DocInlineTagBase,
    writeInlineTagContent: () => void): void {

    this._writeContent('{');
    this._writeContent(docInlineTagBase.tagName);
    writeInlineTagContent();
    this._writeContent('}');
  }

  private _renderNodes(docNodes: ReadonlyArray<DocNode | undefined>): void {
    for (const docNode of docNodes) {
      this._renderNode(docNode);
    }
  }

  private _ensureAtStartOfLine(): void {
    if (this._lineState === LineState.MiddleOfLine) {
      this._writeNewline();
    }
  }

  private _ensureLineSkipped(): void {
    this._ensureAtStartOfLine();
    if (this._previousLineHadContent) {
      this._writeNewline();
    }
  }

  private _writeContent(content: string | undefined): void {
    if (content === undefined || content.length === 0) {
      return;
    }

    const splitLines: string[] = content.split(/\r?\n/g);
    if (splitLines.length > 1) {
      let firstLine: boolean = true;
      for (const line of splitLines) {
        if (firstLine) {
          firstLine = false;
        } else {
          this._writeNewline();
        }
        this._writeContent(line);
      }
      return;
    }

    if (this._lineState === LineState.Closed) {
      this._output!.append('/**' + this.eol
        + ' *');
      this._lineState = LineState.StartOfLine;
    }

    if (this._lineState === LineState.StartOfLine) {
      this._output!.append(' ');
    }

    this._output!.append(content);
    this._lineState = LineState.MiddleOfLine;
    this._previousLineHadContent = true;
  }

  private _writeNewline(): void {
    if (this._lineState === LineState.Closed) {
      this._output!.append('/**' + this.eol
        + ' *');
      this._lineState = LineState.StartOfLine;
    }

    this._previousLineHadContent = this._lineState === LineState.MiddleOfLine;

    this._output!.append(this.eol + ' *');
    this._lineState = LineState.StartOfLine;
  }

  private _writeEnd(): void {
    if (this._lineState === LineState.MiddleOfLine) {
      this._writeNewline();
    }

    if (this._lineState !== LineState.Closed) {
      this._output!.append('/' + this.eol);
      this._lineState = LineState.Closed;
    }
  }
}
