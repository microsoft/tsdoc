import * as React from 'react';
import * as tsdoc from '@microsoft/tsdoc';
import { TabPane } from './TabPane';
import { FlexRowDiv, FlexColDiv } from './FlexDivs';

interface IPlaygroundViewProps {
}

interface IPlaygroundViewState {
  inputText: string;
  outputText: string;
  errorsText: string;
}

export class PlaygroundView extends React.Component<IPlaygroundViewProps, IPlaygroundViewState>  {
  private _reparseTimerHandle: number | undefined = undefined;
  private _reparseNeeded: boolean = true;

  constructor(props: IPlaygroundViewProps, context?: any) { // tslint:disable-line:no-any
    super(props, context);

    this.state = {
      inputText: require('raw-loader!./initialCode.ts'),
      outputText: '',
      errorsText: ''
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
    return (
      <FlexColDiv className='playground-input-box' style={ { flex: 1 } }>
        <div style={ { height: '40px' } } />
        <textarea
          className='playground-input-textarea'
          style={ { width: '100%', height: '100%', boxSizing: 'border-box', resize: 'none' } }
          value={ this.state.inputText }
          onChange={ this._inputTextArea_onChange.bind(this) }
          />
      </FlexColDiv>
    );
  }

  private _renderHtml(): React.ReactNode {
    return (
      <span> <b>HTML</b> goes here </span>
    );
  }

  private _renderLines(): React.ReactNode {
    return (
      <textarea
        className='playground-lines-textarea'
        style={ { width: '100%', height: '100%', boxSizing: 'border-box', resize: 'none' } }
        readOnly={ true }
        value={ this.state.outputText }
        />
    );
  }

  private _renderAst(): React.ReactNode {
    return (
      <textarea
        className='playground-ast-textarea'
        style={ { width: '100%', height: '100%', boxSizing: 'border-box', resize: 'none' } }
        readOnly={ true }
        value={ this.state.outputText }
        />
    );
  }

  private _renderErrorList(): React.ReactNode {
    const errorsPaneStyle: React.CSSProperties = {
      width: '100%',
      height: '200px',
      marginTop: '12px'
    };

    return (
      <FlexColDiv className='playground-errors-pane' style={ errorsPaneStyle }>
        Errors:
        <br />
        <textarea
          className='playground-errors-textarea'
          readOnly={ true }
          value={ this.state.errorsText }
          style={ { width: '100%', height: '100%', boxSizing: 'border-box', resize: 'none' } }
          />
      </FlexColDiv>
    );
  }

  private _inputTextArea_onChange(event: React.ChangeEvent<HTMLTextAreaElement>): void {
    this.setState({
      inputText: event.target.value
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

      const errorsText: string = parserContext.log.messages.map(x => x.toString()).join('\n');

      const outputLines: string[] = [];
      if (parserContext.docComment) {
        this._dumpTSDocTree(outputLines, parserContext.docComment);
      }

      this.setState({
        outputText: outputLines.join('\n'),
        errorsText
      });
    } catch (error) {
      this.setState({
        outputText: '',
        errorsText: 'Unhandled exception: ' + error.message
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
