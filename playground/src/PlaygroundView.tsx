import * as React from 'react';
import * as tsdoc from '@microsoft/tsdoc';

import { TabPane } from './TabPane';
import { FlexRowDiv, FlexColDiv } from './FlexDivs';
import { DocHtmlView } from './DocHtmlView';
import {
  MonacoWrapper,
  ICommentSyntaxMarker
} from './MonacoWrapper';

export interface IPlaygroundViewProps {
}

export interface IPlaygroundViewState {
  inputText: string;
  parserContext: tsdoc.ParserContext | undefined;
  parserFailureText: string | undefined;
}

export class PlaygroundView extends React.Component<IPlaygroundViewProps, IPlaygroundViewState>  {
  private _reparseTimerHandle: number | undefined = undefined;
  private _reparseNeeded: boolean = true;

  constructor(props: IPlaygroundViewProps, context?: any) { // tslint:disable-line:no-any
    super(props, context);

    this.state = {
      inputText: require('raw-loader!./initialCode.ts'),
      parserContext: undefined,
      parserFailureText: undefined
    };
  }

  public componentDidMount(): void {
    this._reparseTimerHandle = setInterval(this._reparseTimer_onTick.bind(this), 700);
  }

  public componentWillUnmount(): void {
    if (this._reparseTimerHandle !== undefined) {
      clearInterval(this._reparseTimerHandle);
      this._reparseTimerHandle = undefined;
    }
  }

  public render(): React.ReactNode {

    const textAreasRowStyle: React.CSSProperties = {
      alignItems: 'stretch',
      height: '400px'
    };

    return (
      <FlexColDiv className='playground-frame'>
        <FlexRowDiv className='playground-main-row' style={ textAreasRowStyle }>
          { this._renderInputBox() }

          <TabPane
            style={ { flex: 1, marginLeft: '4px' } }
            buttonRowStyle={ { height: '40px' } }
            contentDivStyle={ { overflow: 'scroll' } }
            tabs={ [
              { title: 'HTML', render: this._renderHtml.bind(this) },
              { title: 'Lines', render: this._renderLines.bind(this) },
              { title: 'AST', render: this._renderAst.bind(this) }
            ] }
          />
        </FlexRowDiv>

        { this._renderErrorList() }
      </FlexColDiv>
    );
  }

  private _renderInputBox(): React.ReactNode {
    const markers: ICommentSyntaxMarker[] = [];
    if (this.state.parserContext) {
      for (const message of this.state.parserContext.log.messages) {
        const text: string = message.unformattedText;
        if (message.tokenSequence) {
          for (const token of message.tokenSequence.tokens) {
            markers.push({
              pos: token.range.pos,
              end: token.range.end,
              message: text
            });
          }
        } else {
          markers.push({
            pos: message.textRange.pos,
            end: message.textRange.end,
            message: text
          });
        }
      }
    }

    return (
      <FlexColDiv className='playground-input-box' style={ { flex: 1, width: '50%' } }>
        <div style={ { height: '40px' } } />
        <MonacoWrapper
          className='playground-input-textarea'
          style={ { width: '100%', height: '100%', boxSizing: 'border-box', resize: 'none' } }
          value={ this.state.inputText }
          onChange={ this._inputTextArea_onChange.bind(this) }
          language='typescript'
          markers={ markers }
         />
      </FlexColDiv>
    );
  }

  private _renderHtml(): React.ReactNode {
    const parserContext: tsdoc.ParserContext | undefined = this.state.parserContext;
    if (parserContext && parserContext.docComment) {
      return (
        <DocHtmlView docComment={ parserContext.docComment } />
      );
    } else {
      return <span />;
    }
  }

  private _renderLines(): React.ReactNode {
    let outputText: string = '';
    const parserContext: tsdoc.ParserContext | undefined = this.state.parserContext;
    if (parserContext && parserContext.lines) {
      outputText = parserContext.lines.join('\n');
    }

    return (
      <textarea
        className='playground-lines-textarea'
        style={ { width: '100%', height: '100%', boxSizing: 'border-box', resize: 'none' } }
        readOnly={ true }
        value={ outputText }
        />
    );
  }

  private _renderAst(): React.ReactNode {
    const outputLines: string[] = [];
    const parserContext: tsdoc.ParserContext | undefined = this.state.parserContext;

    if (parserContext && parserContext.docComment) {
      this._dumpTSDocTree(outputLines, parserContext.docComment);
    }

    return (
      <MonacoWrapper
        className='playground-ast-textarea'
        style={ { width: '100%', height: '100%', boxSizing: 'border-box', resize: 'none' } }
        readOnly={ true }
        value={ outputLines.join('\n') }
        editorOptions={ {
          lineNumbers: 'off'
        } }
      />
    );
  }

  private _renderErrorList(): React.ReactNode {
    const errorsPaneStyle: React.CSSProperties = {
      width: '100%',
      height: '200px',
      marginTop: '12px'
    };

    let errorsText: string = '';
    if (this.state.parserFailureText) {
      errorsText = this.state.parserFailureText;
    } else if (this.state.parserContext) {
      errorsText = this.state.parserContext.log.messages.map(x => x.toString()).join('\n');
    }

    return (
      <FlexColDiv className='playground-errors-pane' style={ errorsPaneStyle }>
        Errors:
        <br />
        <textarea
          className='playground-errors-textarea'
          readOnly={ true }
          value={ errorsText }
          style={ { width: '100%', height: '100%', boxSizing: 'border-box', resize: 'none' } }
          />
      </FlexColDiv>
    );
  }

  private _inputTextArea_onChange(value: string): void {
    this.setState({
      inputText: value
    });
    this._reparseNeeded = true;
  }

  private _reparseTimer_onTick(): void {
    if (!this._reparseNeeded) {
      return;
    }
    this._reparseNeeded = false;
    try {
      const inputText: string = this.state.inputText;
      const tsdocParser: tsdoc.TSDocParser = new tsdoc.TSDocParser();
      const parserContext: tsdoc.ParserContext = tsdocParser.parseString(inputText);

      this.setState({
        parserContext: parserContext,
        parserFailureText: undefined
      });
    } catch (error) {
      this.setState({
        parserContext: undefined,
        parserFailureText: 'Unhandled exception: ' + error.message
      });
    }
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
