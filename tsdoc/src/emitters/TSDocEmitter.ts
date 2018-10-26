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
  DocHtmlAttribute
} from '../nodes';
import { StringBuilder } from './StringBuilder';
import { DocNodeTransforms } from '../transforms/DocNodeTransforms';

enum LineState {
  Closed,
  StartOfLine,
  MiddleOfLine
}

/**
 * Renders a DocNode tree as a code comment.
 */
export class TSDocEmitter {
  public readonly eol: string = '\n';

  private _lineState: LineState = LineState.Closed;
  private _previousLineHadContent: boolean = false;

  public static emit(docComment: DocComment): string {
    const stringBuilder: StringBuilder = new StringBuilder();
    const emitter: TSDocEmitter = new TSDocEmitter();
    emitter.renderComment(stringBuilder, docComment);
    return stringBuilder.toString();
  }

  public renderComment(output: StringBuilder, docComment: DocComment): void {
    this._lineState = LineState.Closed;
    this._previousLineHadContent = false;

    this._renderNode(output, docComment);

    this._writeEnd(output);
  }

  private _renderNode(output: StringBuilder, docNode: DocNode | undefined): void {
    if (docNode === undefined) {
      return;
    }

    switch (docNode.kind) {
      case DocNodeKind.Block:
        const docBlock: DocBlock = docNode as DocBlock;
        this._writeNewline(output);
        this._renderNode(output, docBlock.blockTag);
        this._renderNode(output, docBlock.content);
        break;

      case DocNodeKind.BlockTag:
        const docBlockTag: DocBlockTag = docNode as DocBlockTag;
        if (this._lineState === LineState.MiddleOfLine) {
          this._writeContent(output, ' ');
        }
        this._writeContent(output, docBlockTag.tagName);
        break;

      case DocNodeKind.CodeSpan:
        const docCodeSpan: DocCodeSpan = docNode as DocCodeSpan;
        this._writeContent(output, '`');
        this._writeContent(output, docCodeSpan.code);
        this._writeContent(output, '`');
        break;

      case DocNodeKind.Comment:
        const docComment: DocComment = docNode as DocComment;
        this._renderNodes(output, [
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
        this._ensureLineSkipped(output);
        this._renderNodes(output, docComment.modifierTagSet.nodes);
        break;

      case DocNodeKind.DeclarationReference:
        const docDeclarationReference: DocDeclarationReference = docNode as DocDeclarationReference;
        this._writeContent(output, docDeclarationReference.packageName);
        this._writeContent(output, docDeclarationReference.importPath);
        if (docDeclarationReference.packageName !== undefined || docDeclarationReference.importPath !== undefined) {
          this._writeContent(output, '#');
        }
        this._renderNodes(output, docDeclarationReference.memberReferences);
        break;

      case DocNodeKind.ErrorText:
        const docErrorText: DocErrorText = docNode as DocErrorText;
        this._writeContent(output, docErrorText.text);
        break;

      case DocNodeKind.EscapedText:
        const docEscapedText: DocEscapedText = docNode as DocEscapedText;
        this._writeContent(output, docEscapedText.encodedText);
        break;

      case DocNodeKind.FencedCode:
        const docFencedCode: DocFencedCode = docNode as DocFencedCode;

        this._ensureAtStartOfLine(output);

        this._writeContent(output, '```');
        this._writeContent(output, docFencedCode.language);
        this._writeNewline(output);
        this._writeContent(output, docFencedCode.code);
        this._writeContent(output, '```');
        this._writeNewline(output);
        this._writeNewline(output);
        break;

      case DocNodeKind.HtmlAttribute:
        const docHtmlAttribute: DocHtmlAttribute = docNode as DocHtmlAttribute;
        this._writeContent(output, docHtmlAttribute.name);
        this._writeContent(output, docHtmlAttribute.spacingAfterName);
        this._writeContent(output, '=');
        this._writeContent(output, docHtmlAttribute.spacingAfterEquals);
        this._writeContent(output, docHtmlAttribute.value);
        this._writeContent(output, docHtmlAttribute.spacingAfterValue);
        break;

      case DocNodeKind.HtmlEndTag:
        const docHtmlEndTag: DocHtmlEndTag = docNode as DocHtmlEndTag;
        this._writeContent(output, '</');
        this._writeContent(output, docHtmlEndTag.name);
        this._writeContent(output, '>');
        break;

      case DocNodeKind.HtmlStartTag:
        const docHtmlStartTag: DocHtmlStartTag = docNode as DocHtmlStartTag;
        this._writeContent(output, '<');
        this._writeContent(output, docHtmlStartTag.name);
        this._writeContent(output, docHtmlStartTag.spacingAfterName);

        let needsSpace: boolean = docHtmlStartTag.spacingAfterName === undefined
          || docHtmlStartTag.spacingAfterName.length === 0;

        for (const attribute of docHtmlStartTag.htmlAttributes) {
          if (needsSpace) {
            this._writeContent(output, ' ');
          }
          this._renderNode(output, attribute);
          needsSpace = true;
        }
        this._writeContent(output, docHtmlStartTag.selfClosingTag ? '/>' : '>');
        break;

      case DocNodeKind.Section:
        const docSection: DocSection = docNode as DocSection;
        this._renderNodes(output, docSection.nodes);
        break;

      case DocNodeKind.Paragraph:
        const trimmedParagraph: DocParagraph = DocNodeTransforms.trimSpacesInParagraph(docNode as DocParagraph);
        if (trimmedParagraph.nodes.length > 0) {
          this._ensureLineSkipped(output);
          this._renderNodes(output, trimmedParagraph.nodes);
          this._writeNewline(output);
        }
        break;

      case DocNodeKind.PlainText:
        const docPlainText: DocPlainText = docNode as DocPlainText;
        this._writeContent(output, docPlainText.text);
        break;
    }
  }

  private _renderNodes(output: StringBuilder, docNodes: ReadonlyArray<DocNode | undefined>): void {
    for (const docNode of docNodes) {
      this._renderNode(output, docNode);
    }
  }

  private _ensureAtStartOfLine(output: StringBuilder): void {
    if (this._lineState === LineState.MiddleOfLine) {
      this._writeNewline(output);
    }
  }

  private _ensureLineSkipped(output: StringBuilder): void {
    this._ensureAtStartOfLine(output);
    if (this._previousLineHadContent) {
      this._writeNewline(output);
    }
  }

  private _writeContent(output: StringBuilder, content: string | undefined): void {
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
          this._writeNewline(output);
        }
        this._writeContent(output, line);
      }
      return;
    }

    if (this._lineState === LineState.Closed) {
      output.append('/**' + this.eol
        + ' *');
      this._lineState = LineState.StartOfLine;
    }

    if (this._lineState === LineState.StartOfLine) {
      output.append(' ');
    }

    output.append(content);
    this._lineState = LineState.MiddleOfLine;
    this._previousLineHadContent = true;
  }

  private _writeNewline(output: StringBuilder): void {
    if (this._lineState === LineState.Closed) {
      output.append('/**' + this.eol
        + ' *');
      this._lineState = LineState.StartOfLine;
    }

    this._previousLineHadContent = this._lineState === LineState.MiddleOfLine;

    output.append(this.eol + ' *');
    this._lineState = LineState.StartOfLine;
  }

  private _writeEnd(output: StringBuilder): void {
    if (this._lineState === LineState.MiddleOfLine) {
      this._writeNewline(output);
    }

    if (this._lineState !== LineState.Closed) {
      output.append('/' + this.eol);
      this._lineState = LineState.Closed;
    }
  }
}
