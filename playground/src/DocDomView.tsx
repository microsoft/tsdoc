import * as React from 'react';
import * as ReactDomServer from 'react-dom/server';
import * as tsdoc from '@microsoft/tsdoc';
import { MonacoWrapper } from './MonacoWrapper';
import { DocHtmlView } from './DocHtmlView';

export interface IDocDomViewProps {
  style?: React.CSSProperties;
  parserContext: tsdoc.ParserContext | undefined;
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
      <MonacoWrapper
        className='playground-dom-text-editor'
        readOnly={ true }
        value={ code }
        language='html'
        editorOptions={ {
          lineNumbers: 'off'
        } }
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

    while (match = tagRegExp.exec(html)) {
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
