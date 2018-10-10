import * as React from 'react';
import * as tsdoc from '@microsoft/tsdoc';

import { TabPane } from './TabPane';
import { FlexRowDiv, FlexColDiv } from './FlexDivs';
import { DocHtmlView } from './DocHtmlView';
import { DocDomView } from './DocDomView';
import { DocAstView } from './DocAstView';
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
  private readonly _textAreaStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    border: 'none',
    resize: 'none',
    paddingLeft: '8px',
    paddingRight: '8px'
  };

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
    const headerStyle: React.CSSProperties = {
      height: '70px',
      backgroundColor: '#1e9449',
      paddingLeft: '20px',
      paddingRight: '20px',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '20px',
      color: '#ffffff'
    };

    const mainRowStyle: React.CSSProperties = {
      alignItems: 'stretch',
      flex: 1
    };

    const errorsPaneStyle: React.CSSProperties = {
      height: '130px',
      marginTop: '20px'
    };

    const footerStyle: React.CSSProperties = {
      height: '80px',
      textAlign: 'center',
      color: '#a0a0a0',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 'smaller'
    };

    const navAnchorStyle: React.CSSProperties = {
      color: '#ffffff',
      textDecorationLine: 'none'
    };

    return (
      <FlexColDiv className='playground-frame' style={ { flex: 1 } }>
        <FlexRowDiv className='playground-header' style={ headerStyle }>
          <FlexColDiv style={{ fontWeight: 400, fontSize: '26px' }}>TSDoc Playground</FlexColDiv>
          <FlexColDiv style={{ fontWeight: 400, fontSize: '20px' }}>
            <a style={navAnchorStyle} href='https://github.com/Microsoft/tsdoc' target='_blank'>
              What is TSDoc?</a>
          </FlexColDiv>
        </FlexRowDiv>

        <FlexColDiv className='playground-content-area' style={ { margin: '4px', flex: 1 } }>
          <FlexRowDiv className='playground-main-row' style={ mainRowStyle }>
            { this._renderInputBox() }

            <TabPane
              style={ { flex: 1, marginLeft: '4px' } }
              buttonRowStyle={ { height: '40px', boxSizing: 'border-box'  } }
              tabs={ [
                { title: 'HTML', render: this._renderHtml.bind(this) },
                { title: 'DOM', render: this._renderDom.bind(this) },
                { title: 'Lines', render: this._renderLines.bind(this) },
                { title: 'AST', render: this._renderAst.bind(this) }
              ] }
            />
          </FlexRowDiv>
          <FlexColDiv className='playground-errors-pane' style={ errorsPaneStyle }>
            { this._renderErrorList() }
          </FlexColDiv>
        </FlexColDiv>

        <FlexRowDiv className='playground-footer' style={ footerStyle }>
          &copy; 2018 Microsoft
        </FlexRowDiv>
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
            if (!token.range.isEmpty()) {
              markers.push({
                pos: token.range.pos,
                end: token.range.end,
                message: text
              });
            }
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

    const editorStyle: React.CSSProperties = {
      borderStyle: 'solid',
      borderWidth: '2px',
      borderColor: '#c0c0c0'
    };

    return (
      <FlexColDiv className='playground-input-box' style={ { flex: 1 } }>
        <div className='playground-button-bar' style={ { height: '40px', boxSizing: 'border-box' } } />
        <MonacoWrapper
          className='playground-input-text-editor'
          style={ editorStyle }
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
        <div style={ { overflow: 'auto', paddingLeft: '8px', paddingRight: '8px' } }>
          <DocHtmlView docComment={ parserContext.docComment } />
        </div>
      );
    } else {
      return <span />;
    }
  }

  private _renderDom(): React.ReactNode {
    return <DocDomView parserContext={this.state.parserContext} />;
  }

  private _renderLines(): React.ReactNode {
    let outputText: string = '';
    const parserContext: tsdoc.ParserContext | undefined = this.state.parserContext;
    if (parserContext && parserContext.lines) {
      outputText = parserContext.lines.join('\n');
    }

    return (
      <textarea
        className='playground-lines-text-editor'
        style={ { ...this._textAreaStyle, border: 'none' } }
        readOnly={ true }
        value={ outputText }
        />
    );
  }

  private _renderAst(): React.ReactNode {
    return <DocAstView parserContext={this.state.parserContext} />;
  }

  private _renderErrorList(): React.ReactNode {
    let errorsText: string = '';
    if (this.state.parserFailureText) {
      errorsText = this.state.parserFailureText;
    } else if (this.state.parserContext) {
      errorsText = this.state.parserContext.log.messages.map(x => x.toString()).join('\n');
    }

    const boxStyle: React.CSSProperties = {
      borderStyle: 'solid',
      borderWidth: '2px',
      borderColor: '#c0c0c0',
      flex: 1
    };

    return (
      <>
        <label htmlFor='errors'>Errors:</label>
        <FlexColDiv style={boxStyle}>
          <textarea
            id='errors'
            className='playground-errors-textarea'
            readOnly={ true }
            value={ errorsText }
            style={ this._textAreaStyle }
            />
        </FlexColDiv>
      </>
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
}
