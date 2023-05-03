import * as React from 'react';
import * as tsdoc from '@microsoft/tsdoc';
import { CodeEditor } from './CodeEditor';

export interface IDocAstViewProps {
  style?: React.CSSProperties;
  parserContext: tsdoc.ParserContext | undefined;
  theme?: string;
}

export function DocAstView(props: IDocAstViewProps): JSX.Element {
  const parserContext: tsdoc.ParserContext | undefined = props.parserContext;
  const outputLines: string[] = [];

  if (parserContext && parserContext.docComment) {
    _dumpTSDocTree(outputLines, parserContext.docComment);
  }

  return (
    <CodeEditor
      className="playground-ast-text-editor"
      readOnly={true}
      value={outputLines.join('\n')}
      disableLineNumbers={true}
      theme={props.theme}
    />
  );
}

function _dumpTSDocTree(outputLines: string[], docNode: tsdoc.DocNode, indent: string = ''): void {
  let dumpText: string = '';
  if (docNode instanceof tsdoc.DocExcerpt) {
    const content: string = docNode.content.toString();
    dumpText += `${indent}* ${docNode.excerptKind}=` + JSON.stringify(content);
  } else {
    dumpText += `${indent}- ${docNode.kind}`;
  }
  outputLines.push(dumpText);

  for (const child of docNode.getChildNodes()) {
    _dumpTSDocTree(outputLines, child, indent + '  ');
  }
}
