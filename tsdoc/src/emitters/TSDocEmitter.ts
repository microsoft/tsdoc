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
  DocFencedCode
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

  public renderComment(output: StringBuilder, docComment: DocComment): void {
    this._lineState = LineState.Closed;

    this._renderNodes(output, docComment.getChildNodes());

    this._writeEnd(output);
  }

  private _renderNode(output: StringBuilder, docNode: DocNode): void {
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

      case DocNodeKind.FencedCode:
        const docFencedCode: DocFencedCode = docNode as DocFencedCode;

        if (this._lineState === LineState.MiddleOfLine) {
          this._writeNewline(output);
        }

        this._writeContent(output, '```');
        this._writeContent(output, docFencedCode.language);
        this._writeNewline(output);
        this._writeContent(output, docFencedCode.code);
        this._writeContent(output, '```');
        this._writeNewline(output);
        this._writeNewline(output);
        break;

      case DocNodeKind.Section:
        const docSection: DocSection = docNode as DocSection;
        this._renderNodes(output, docSection.nodes);
        break;

      case DocNodeKind.Paragraph:
        const trimmedParagraph: DocParagraph = DocNodeTransforms.trimSpacesInParagraph(docNode as DocParagraph);
        if (trimmedParagraph.nodes.length > 0) {
          if (this._lineState !== LineState.Closed) {
            this._writeNewline(output);
          }
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

  private _renderNodes(output: StringBuilder, docNodes: ReadonlyArray<DocNode>): void {
    for (const docNode of docNodes) {
      this._renderNode(output, docNode);
    }
  }

  private _writeContent(output: StringBuilder, content: string) {
    if (content.length === 0) {
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
  }

  private _writeNewline(output: StringBuilder) {
    if (this._lineState === LineState.Closed) {
      output.append('/**' + this.eol
        + ' *');
      this._lineState = LineState.StartOfLine;
    }

    output.append(this.eol + ' *');
    this._lineState = LineState.StartOfLine;
  }

  private _writeEnd(output: StringBuilder) {
    if (this._lineState === LineState.MiddleOfLine) {
      this._writeNewline(output);
    }

    if (this._lineState !== LineState.Closed) {
      output.append('/' + this.eol);
      this._lineState = LineState.Closed;
    }
  }
}
