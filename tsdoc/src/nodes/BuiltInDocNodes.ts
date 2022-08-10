import { TSDocConfiguration } from '../configuration/TSDocConfiguration';
import { DocNodeManager } from '../configuration/DocNodeManager';
import { DocNodeKind } from './DocNode';
import * as nodes from '..';

export class BuiltInDocNodes {
  public static register(configuration: TSDocConfiguration): void {
    const docNodeManager: DocNodeManager = configuration.docNodeManager;

    docNodeManager.registerDocNodes('@microsoft/tsdoc', [
      { docNodeKind: DocNodeKind.Block, constructor: nodes.DocBlock },
      { docNodeKind: DocNodeKind.BlockTag, constructor: nodes.DocBlockTag },
      { docNodeKind: DocNodeKind.CodeSpan, constructor: nodes.DocCodeSpan },
      { docNodeKind: DocNodeKind.Comment, constructor: nodes.DocComment },
      { docNodeKind: DocNodeKind.DeclarationReference, constructor: nodes.DocDeclarationReference },
      { docNodeKind: DocNodeKind.ErrorText, constructor: nodes.DocErrorText },
      { docNodeKind: DocNodeKind.EscapedText, constructor: nodes.DocEscapedText },
      { docNodeKind: DocNodeKind.Excerpt, constructor: nodes.DocExcerpt },
      { docNodeKind: DocNodeKind.FencedCode, constructor: nodes.DocFencedCode },
      { docNodeKind: DocNodeKind.XmlAttribute, constructor: nodes.DocXmlAttribute },
      { docNodeKind: DocNodeKind.InheritDocTag, constructor: nodes.DocInheritDocTag },
      { docNodeKind: DocNodeKind.InlineTag, constructor: nodes.DocInlineTag },
      { docNodeKind: DocNodeKind.LinkTag, constructor: nodes.DocLinkTag },
      { docNodeKind: DocNodeKind.MemberIdentifier, constructor: nodes.DocMemberIdentifier },
      { docNodeKind: DocNodeKind.MemberReference, constructor: nodes.DocMemberReference },
      { docNodeKind: DocNodeKind.MemberSelector, constructor: nodes.DocMemberSelector },
      { docNodeKind: DocNodeKind.MemberSymbol, constructor: nodes.DocMemberSymbol },
      { docNodeKind: DocNodeKind.Paragraph, constructor: nodes.DocParagraph },
      { docNodeKind: DocNodeKind.ParamBlock, constructor: nodes.DocParamBlock },
      { docNodeKind: DocNodeKind.ParamCollection, constructor: nodes.DocParamCollection },
      { docNodeKind: DocNodeKind.PlainText, constructor: nodes.DocPlainText },
      { docNodeKind: DocNodeKind.Section, constructor: nodes.DocSection },
      { docNodeKind: DocNodeKind.SoftBreak, constructor: nodes.DocSoftBreak },
      { docNodeKind: DocNodeKind.XmlElement, constructor: nodes.DocXmlElement }
    ]);

    docNodeManager.registerAllowableChildren(DocNodeKind.Section, [
      DocNodeKind.FencedCode,
      DocNodeKind.Paragraph,
      DocNodeKind.XmlElement
    ]);

    docNodeManager.registerAllowableChildren(DocNodeKind.Paragraph, [
      DocNodeKind.BlockTag,
      DocNodeKind.CodeSpan,
      DocNodeKind.ErrorText,
      DocNodeKind.EscapedText,
      DocNodeKind.XmlElement,
      DocNodeKind.InlineTag,
      DocNodeKind.LinkTag,
      DocNodeKind.PlainText,
      DocNodeKind.SoftBreak
    ]);

    docNodeManager.registerAllowableChildren(DocNodeKind.XmlElement, [
      DocNodeKind.XmlElement,
      DocNodeKind.PlainText,
      DocNodeKind.SoftBreak
    ]);
  }
}
