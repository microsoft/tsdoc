import * as React from 'react';
import * as tsdoc from '@microsoft/tsdoc';
import { MonacoWrapper } from './MonacoWrapper';

export interface IDocAstViewProps {
  style?: React.CSSProperties;
  parserContext: tsdoc.ParserContext | undefined;
}

export class DocAstView extends React.Component<IDocAstViewProps> {
  public render(): React.ReactNode {
    const parserContext: tsdoc.ParserContext | undefined = this.props.parserContext;
    const outputLines: string[] = [];

    if (parserContext && parserContext.docComment) {
      this._dumpTSDocTree(outputLines, parserContext.docComment);
    }

    return (
      <MonacoWrapper
        className='playground-ast-text-editor'
        readOnly={ true }
        value={ outputLines.join('\n') }
        editorOptions={ {
          lineNumbers: 'off'
        } }
      />
    );
  }

  private _dumpTSDocTree(outputLines: string[], docNode: tsdoc.DocNode, indent: string = ''): void {
    let dumpText: string = `${indent}- ${docNode.kind}`;
    if (docNode instanceof tsdoc.DocNodeLeaf && docNode.excerpt) {
      const content: string = docNode.excerpt.content.toString();
      if (content.length > 0) {
        dumpText += ': ' + JSON.stringify(content);
      }
    }
    outputLines.push(dumpText);

    for (const child of docNode.getChildNodes()) {
      this._dumpTSDocTree(outputLines, child, indent + '  ');
    }
  }
}
