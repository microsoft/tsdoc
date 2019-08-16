import * as React from 'react';
import * as tsdoc from '@microsoft/tsdoc';
import { CodeEditor } from './CodeEditor';
import { DocHtmlView } from './DocHtmlView';

// NOTE: We cannot import "react-dom/server" directly because that would bring in
// the ambient typings for NodeJS, which is incompatible with our DOM typings.
//
// import * as ReactDomServer from 'react-dom/server';
// eslint-disable-next-line
const ReactDomServer: any = require('react-dom/server');

export interface IDocDomViewProps {
  style?: React.CSSProperties;
  parserContext: tsdoc.ParserContext | undefined;
  theme?: string;
}

export class DocDomView extends React.Component<IDocDomViewProps> {
  public render(): React.ReactNode {
    const parserContext: tsdoc.ParserContext | undefined = this.props.parserContext;
    let code: string = '';

    if (parserContext && parserContext.docComment) {
      const unindentedCode: string = ReactDomServer.renderToStaticMarkup(
        <DocHtmlView docComment={ parserContext.docComment } />
      );
      code = this._indentHtml(unindentedCode);
    }

    return (
      <CodeEditor
        className='playground-dom-text-editor'
        readOnly={ true }
        value={ code }
        language='html'
        disableLineNumbers={ true }
        theme={ this.props.theme }
      />
    );
  }

  // Given a string containing perfectly systematic HTML (like what React generates),
  // this adds appropriate indentation
  private _indentHtml(html: string): string {
    const tagRegExp: RegExp = /\<\/|\<|\>/g;
    const output: string[] = [];

    const indentCharacters: string = '  ';

    let match: RegExpExecArray | null;
    let lastIndex: number = 0;
    let indentLevel: number = 0;
    let lastTag: string = '';

    for (;;) {
      match = tagRegExp.exec(html);

      if (!match) {
        break;
      }

      const matchIndex: number = match.index;

      const textBeforeMatch: string = html.substring(lastIndex, matchIndex);
      if (textBeforeMatch.length > 0) {
        output.push(textBeforeMatch);
      }

      switch (match[0]) {
        case '<':
          // Matched opening tag
          if (output.length > 0) {
            output.push('\n');
          }
          for (let i: number = 0; i < indentLevel; ++i) {
            output.push(indentCharacters);
          }

          ++indentLevel;

          lastTag = '<';
          break;
        case '</':
          // Matched closing tag
          --indentLevel;

          if (lastTag !== '<') {
            output.push('\n');
            for (let i: number = 0; i < indentLevel; ++i) {
              output.push(indentCharacters);
            }
          }

          lastTag = '</';
          break;
        case '>':
          break;
      }

      lastIndex = matchIndex;
    }

    const endingText: string = html.substring(lastIndex);
    output.push(endingText + '\n');

    return output.join('');
  }
}
