// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import type {
  DocNode,
  DocComment,
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
  DocMemberSelector,
  DocParamBlock
} from '../nodes';
import type { DocList, DocListItem } from '../nodes';
import { DocNodeKind } from '../nodes/DocNode';
import type { IStringBuilder } from './StringBuilder';
import { DocNodeTransforms } from '../transforms/DocNodeTransforms';
import { StandardTags } from '../details/StandardTags';
import type { DocParamCollection } from '../nodes/DocParamCollection';

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

  // Whether to emit the /** */ framing
  private _emitCommentFraming: boolean = true;

  private _output: IStringBuilder | undefined;

  // This state machine is used by the writer functions to generate the /** */ framing around the emitted lines
  private _lineState: LineState = LineState.Closed;

  // State for _ensureLineSkipped()
  private _previousLineHadContent: boolean = false;

  // Normally a paragraph is precede by a blank line (unless it's the first thing written).
  // But sometimes we want the paragraph to be attached to the previous element, e.g. when it's part of
  // an "@param" block.  Setting _hangingParagraph=true accomplishes that.
  private _hangingParagraph: boolean = false;
  private _indent: string = '';

  public renderComment(output: IStringBuilder, docComment: DocComment): void {
    this._emitCommentFraming = true;
    this._renderCompleteObject(output, docComment);
  }

  public renderHtmlTag(output: IStringBuilder, htmlTag: DocHtmlStartTag | DocHtmlEndTag): void {
    this._emitCommentFraming = false;
    this._renderCompleteObject(output, htmlTag);
  }

  public renderDeclarationReference(
    output: IStringBuilder,
    declarationReference: DocDeclarationReference
  ): void {
    this._emitCommentFraming = false;
    this._renderCompleteObject(output, declarationReference);
  }

  private _renderCompleteObject(output: IStringBuilder, docNode: DocNode): void {
    this._output = output;

    this._lineState = LineState.Closed;
    this._previousLineHadContent = false;
    this._hangingParagraph = false;
    this._indent = '';

    this._renderNode(docNode);

    this._writeEnd();
  }

  private _renderNode(docNode: DocNode | undefined): void {
    if (docNode === undefined) {
      return;
    }

    switch (docNode.kind) {
      case DocNodeKind.Block:
        const docBlock: DocBlock = docNode as DocBlock;
        this._ensureLineSkipped();
        this._renderNode(docBlock.blockTag);

        if (
          docBlock.blockTag.tagNameWithUpperCase === StandardTags.returns.tagNameWithUpperCase ||
          docBlock.blockTag.tagNameWithUpperCase === StandardTags.defaultValue.tagNameWithUpperCase
        ) {
          this._writeContent(' ');
          this._hangingParagraph = true;
        }

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
          docComment.params,
          docComment.typeParams,
          docComment.returnsBlock,
          ...docComment.customBlocks,
          ...docComment.seeBlocks,
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
        if (
          docDeclarationReference.packageName !== undefined ||
          docDeclarationReference.importPath !== undefined
        ) {
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
        if (this._indent) {
          this._ensureAtStartOfLine();
        }
        this._writeContent('```');
        this._writeNewline();
        if (!this._indent) {
          this._writeNewline();
        }
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

        let needsSpace: boolean =
          docHtmlStartTag.spacingAfterName === undefined || docHtmlStartTag.spacingAfterName.length === 0;

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
            if (docLinkTag.urlDestination !== undefined) {
              this._writeContent(' ');
              this._writeContent(docLinkTag.urlDestination);
            } else if (docLinkTag.codeDestination !== undefined) {
              this._writeContent(' ');
              this._renderNode(docLinkTag.codeDestination);
            }
          }
          if (docLinkTag.linkText !== undefined) {
            this._writeContent(' ');
            this._writeContent('|');
            this._writeContent(' ');
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

      case DocNodeKind.List:
        this._renderList(docNode as DocList);
        break;

      case DocNodeKind.ListItem:
        this._renderNode((docNode as DocListItem).content);
        break;

      case DocNodeKind.SoftBreak:
        this._ensureAtStartOfLine();
        break;

      case DocNodeKind.Paragraph:
        if (this._indent) {
          this._renderListParagraph(docNode as DocParagraph);
          break;
        }
        const trimmedParagraph: DocParagraph = DocNodeTransforms.trimSpacesInParagraph(
          docNode as DocParagraph
        );
        if (trimmedParagraph.nodes.length > 0) {
          if (this._hangingParagraph) {
            // If it's a hanging paragraph, then don't skip a line
            this._hangingParagraph = false;
          } else {
            this._ensureLineSkipped();
          }

          this._renderNodes(trimmedParagraph.nodes);
          this._writeNewline();
        }
        break;

      case DocNodeKind.ParamBlock:
        const docParamBlock: DocParamBlock = docNode as DocParamBlock;
        this._ensureLineSkipped();
        this._renderNode(docParamBlock.blockTag);
        this._writeContent(' ');
        this._writeContent(docParamBlock.parameterName);
        this._writeContent(' - ');
        this._hangingParagraph = true;
        this._renderNode(docParamBlock.content);
        this._hangingParagraph = false;
        break;

      case DocNodeKind.ParamCollection:
        const docParamCollection: DocParamCollection = docNode as DocParamCollection;
        this._renderNodes(docParamCollection.blocks);
        break;

      case DocNodeKind.PlainText:
        const docPlainText: DocPlainText = docNode as DocPlainText;
        this._writeContent(docPlainText.text);
        break;
    }
  }

  private _renderInlineTag(docInlineTagBase: DocInlineTagBase, writeInlineTagContent: () => void): void {
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

  private _renderList(list: DocList): void {
    if (list.nodes.length === 0) {
      return;
    }
    if (this._hangingParagraph) {
      this._ensureAtStartOfLine();
    } else {
      this._ensureLineSkipped();
    }
    this._hangingParagraph = false;
    const parentIndent: string = this._indent;
    let index: number = 0;
    for (const node of list.nodes) {
      const item: DocListItem = node as DocListItem;
      const marker: string = list.ordered ? `${index === 0 ? list.start : 1}.` : '-';
      this._ensureAtStartOfLine();
      this._writeContent(marker + ' ');
      this._indent = parentIndent + new Array(marker.length + 2).join(' ');
      this._hangingParagraph = true;
      this._renderNode(item.content);
      this._ensureAtStartOfLine();
      this._indent = parentIndent;
      this._hangingParagraph = false;
      index++;
    }
  }

  private _renderListParagraph(paragraph: DocParagraph): void {
    const nodes: ReadonlyArray<DocNode> = paragraph.nodes;
    const isPadding = (node: DocNode): boolean =>
      node.kind === DocNodeKind.SoftBreak ||
      (node.kind === DocNodeKind.PlainText && !(node as DocPlainText).text.trim());
    let start: number = 0;
    let end: number = nodes.length;
    // Leading spaces can keep a literal marker from becoming a nested list.
    while (start < end && nodes[start].kind === DocNodeKind.SoftBreak) {
      start++;
    }
    while (end > start && isPadding(nodes[end - 1])) {
      end--;
    }
    if (start === end) {
      return;
    }
    if (this._hangingParagraph) {
      this._hangingParagraph = false;
    } else {
      this._ensureLineSkipped();
    }
    this._renderParagraphContent(nodes, start, end);
    this._writeNewline();
  }

  private _escapeListMarker(content: string): string {
    return content.replace(
      /^( *)([-+*]|\d{1,9}\.)(?= |$)/,
      (match: string, spaces: string, marker: string) =>
        match.slice(0, spaces.length) + marker.slice(0, -1) + '\\' + marker.slice(-1)
    );
  }

  private _renderParagraphContent(nodes: ReadonlyArray<DocNode>, start: number, end: number): void {
    for (let index: number = start; index < end; index++) {
      const node: DocNode = nodes[index];
      if (node.kind === DocNodeKind.PlainText) {
        const escapeMarker: boolean = !!this._indent || index === start;
        let content: string = (node as DocPlainText).text;
        while (index + 1 < end && nodes[index + 1].kind === DocNodeKind.PlainText) {
          content += (nodes[++index] as DocPlainText).text;
        }
        if (index === end - 1) {
          content = content.replace(/\s+$/, '');
        }
        // A literal marker at a paragraph boundary must not become list syntax.
        if (escapeMarker && this._lineState !== LineState.MiddleOfLine) {
          content = this._escapeListMarker(content);
        }
        this._writeContent(content);
      } else {
        this._renderNode(node);
      }
    }
  }

  // Calls _writeNewline() only if we're not already at the start of a new line
  private _ensureAtStartOfLine(): void {
    if (this._lineState === LineState.MiddleOfLine) {
      this._writeNewline();
    }
  }

  // Calls _writeNewline() if needed to ensure that we have skipped at least one line
  private _ensureLineSkipped(): void {
    this._ensureAtStartOfLine();
    if (this._previousLineHadContent) {
      this._writeNewline();
    }
  }

  // Writes literal text content.  If it contains newlines, they will automatically be converted to
  // _writeNewline() calls, to ensure that "*" is written at the start of each line.
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
      if (this._emitCommentFraming) {
        this._output!.append('/**' + this.eol + ' *');
      }
      this._lineState = LineState.StartOfLine;
    }

    if (this._lineState === LineState.StartOfLine) {
      if (this._emitCommentFraming) {
        this._output!.append(' ');
      }
      this._output!.append(this._indent);
    }

    this._output!.append(content);
    this._lineState = LineState.MiddleOfLine;
    this._previousLineHadContent = true;
  }

  // Starts a new line, and inserts "/**" or "*" as appropriate.
  private _writeNewline(): void {
    if (this._lineState === LineState.Closed) {
      if (this._emitCommentFraming) {
        this._output!.append('/**' + this.eol + ' *');
      }
      this._lineState = LineState.StartOfLine;
    }

    this._previousLineHadContent = this._lineState === LineState.MiddleOfLine;

    if (this._emitCommentFraming) {
      this._output!.append(this.eol + ' *');
    } else {
      this._output!.append(this.eol);
    }

    this._lineState = LineState.StartOfLine;
    this._hangingParagraph = false;
  }

  // Closes the comment, adding the final "*/" delimiter
  private _writeEnd(): void {
    if (this._lineState === LineState.MiddleOfLine) {
      if (this._emitCommentFraming) {
        this._writeNewline();
      }
    }

    if (this._lineState !== LineState.Closed) {
      if (this._emitCommentFraming) {
        this._output!.append('/' + this.eol);
      }
      this._lineState = LineState.Closed;
    }
  }
}
