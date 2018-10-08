import * as React from 'react';
import * as tsdoc from '@microsoft/tsdoc';

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
      inputText:
        [
          '/**',
          ' * Returns the average of two numbers.',
          ' *',
          ' * @remarks',
          ' * This method is part of the {@link core-library#Statistics | Statistics subsystem}.',
          ' *',
          ' * @param x - The first input number',
          ' * @param y - The second input number',
          ' * @returns The arithmetic mean of `x` and `y`',
          ' *',
          ' * @beta',
          ' */'
        ].join('\n'),
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
    const textAreaStyle: React.CSSProperties = {
      width: '600px',
      height: '400px'
    };
    const errorsTextAreaStyle: React.CSSProperties = {
      width: '1200px',
      height: '200px'
    };

    return (
      <div>
        <textarea
          id='input-textarea'
          style={ textAreaStyle }
          value={ this.state.inputText }
          onChange={ this._inputTextArea_onChange.bind(this) }
          />
        <textarea
          id='output-textarea'
          readOnly={ true }
          value={ this.state.outputText }
          style={ textAreaStyle }
          />
        <br />
        Errors:
        <br />
        <textarea
          id='errors-textarea'
          readOnly={ true }
          value={ this.state.errorsText }
          style={ errorsTextAreaStyle }
          />
      </div>
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
