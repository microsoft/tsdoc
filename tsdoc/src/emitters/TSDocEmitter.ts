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
  DocXmlAttribute,
  DocInheritDocTag,
  DocInlineTagBase,
  DocInlineTag,
  DocLinkTag,
  DocMemberIdentifier,
  DocMemberReference,
  DocMemberSymbol,
  DocMemberSelector,
  DocParamBlock,
  DocXmlElement
} from '../nodes';
import { DocNodeKind } from '../nodes/DocNode';
import { IStringBuilder } from './StringBuilder';
import { DocNodeTransforms } from '../transforms/DocNodeTransforms';
import { StandardTags } from '../details/StandardTags';
import { DocParamCollection } from '../nodes/DocParamCollection';

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

  public renderComment(output: IStringBuilder, docComment: DocComment): void {
    this._emitCommentFraming = true;
    this._renderCompleteObject(output, docComment);
  }

  public renderXmlElement(output: IStringBuilder, xmlElement: DocXmlElement): void {
    this._emitCommentFraming = false;
    this._renderCompleteObject(output, xmlElement);
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

        if (docBlock.blockTag.tagNameWithUpperCase === StandardTags.returns.tagNameWithUpperCase) {
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
        this._writeContent('```');
        this._writeNewline();
        this._writeNewline();
        break;

      case DocNodeKind.XmlElement:
        // Write the start tag
        const docXmlElement: DocXmlElement = docNode as DocXmlElement;
        this._writeContent('<');
        this._writeContent(docXmlElement.name);
        this._writeContent(docXmlElement.spacingAfterName);

        for (const attribute of docXmlElement.xmlAttributes) {
          this._writeContent(attribute.name);
          this._writeContent(attribute.spacingAfterName);
          this._writeContent('=');
          this._writeContent(attribute.spacingAfterEquals);
          this._writeContent(attribute.value);
          this._writeContent(attribute.spacingAfterValue);
        }

        if (docXmlElement.isEmptyElement) {
          this._writeContent('/>');
          break;
        }

        this._writeContent('>');

        this._writeContent(docXmlElement.spacingBetweenStartTagAndChildren);

        // Write the child nodes
        for (const childNode of docXmlElement.nodes) {
          this._renderNode(childNode);
        }

        // Write the end tag
        this._writeContent('</');
        this._writeContent(docXmlElement.name);
        this._writeContent('>');
        this._writeContent(docXmlElement.spacingAfterEndTag);

        break;

      case DocNodeKind.XmlAttribute:
        const docXmlAttribute: DocXmlAttribute = docNode as DocXmlAttribute;
        this._writeContent(docXmlAttribute.name);
        this._writeContent(docXmlAttribute.spacingAfterName);
        this._writeContent('=');
        this._writeContent(docXmlAttribute.spacingAfterEquals);
        this._writeContent(docXmlAttribute.value);
        this._writeContent(docXmlAttribute.spacingAfterValue);
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

      case DocNodeKind.Paragraph:
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
