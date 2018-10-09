import * as React from 'react';
import * as tsdoc from '@microsoft/tsdoc';

export interface IDocHtmlViewProps {
  style?: React.CSSProperties;
  docComment: tsdoc.DocComment;
}

export class DocHtmlView extends React.Component<IDocHtmlViewProps> {
  public render(): React.ReactNode {
    const docComment: tsdoc.DocComment = this.props.docComment;

    const outputElements: React.ReactNode[] = [];

    if (docComment.summarySection) {
      const key: string = `key_${outputElements.length}`;
      outputElements.push(<h2 key={key}>Summary</h2>);
      this._renderContainer(outputElements, docComment.summarySection);
    }

    if (docComment.remarksBlock) {
      const key: string = `key_${outputElements.length}`;
      outputElements.push(<h2 key={key}>Remarks</h2>);

      this._renderContainer(outputElements, docComment.remarksBlock);
    }

    if (docComment.paramBlocks.length > 0) {
      const key: string = `key_${outputElements.length}`;
      outputElements.push(<h2 key={key}>Parameters</h2>);

      for (const paramBlock of docComment.paramBlocks) {
        this._renderContainer(outputElements, paramBlock);
      }
    }

    if (docComment.returnsBlock) {
      const key: string = `key_${outputElements.length}`;
      outputElements.push(<h2 key={key}>Returns</h2>);

      this._renderContainer(outputElements, docComment.returnsBlock);
    }

    return <div style={ this.props.style }>{outputElements}</div>;
  }

  private _renderContainer(outputElements: React.ReactNode[], section: tsdoc.DocNodeContainer): void {
    for (const node of section.nodes) {
      this._renderDocNode(outputElements, node);
    }
  }

  private _renderDocNode(outputElements: React.ReactNode[], node: tsdoc.DocNode): void {
    const key: string = `key_${outputElements.length}`;

    switch (node.kind) {
      case 'CodeSpan':
        outputElements.push(<code key={key}>{(node as tsdoc.DocCodeSpan).code}</code>);
        break;
      case 'ErrorText':
        outputElements.push(<span key={key}>{(node as tsdoc.DocErrorText).text}</span>);
        break;
      case 'EscapedText':
        outputElements.push(<span key={key}>{(node as tsdoc.DocEscapedText).text}</span>);
        break;
      case 'FencedCode':
        const docFencedCode: tsdoc.DocFencedCode = node as tsdoc.DocFencedCode;
        outputElements.push(
          <pre key={key}>
            <code key={key}>
              { docFencedCode.code }
            </code>
          </pre>
        );
        break;
      case 'LinkTag':
        outputElements.push(<a key={key} href='#'>{(node as tsdoc.DocLinkTag).linkText}</a>);
        break;
      case 'Paragraph':
        const paragraphElements: React.ReactNode[] = [];
        this._renderContainer(paragraphElements, node as tsdoc.DocParagraph);
        outputElements.push(<p key={key}>{ paragraphElements }</p>);
        break;
      case 'PlainText':
        outputElements.push(<span key={key}>{(node as tsdoc.DocPlainText).text}</span>);
        break;
    }
  }
}
