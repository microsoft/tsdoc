import * as React from 'react';
import * as monacoEditor from 'monaco-editor';

export interface IMonacoWrapperProps {
  className?: string;
  style?: React.CSSProperties;
  value?: string;
  readOnly?: boolean;
  language?: string;
  onChange?: (value: string) => void;

  editorOptions?: monacoEditor.editor.IEditorConstructionOptions;
}

export interface IMonacoWrapperState {
  monaco?: typeof monacoEditor;
  failedToLoad?: boolean;
}

interface IMonacoWindow extends Window {
  require: {
    (paths: string[], callback: (monaco: typeof monacoEditor) => void): void;
    config: (options: { paths: { [name: string]: string } }) => void
  };
  MonacoEnvironment: {
    getWorkerUrl: (workerId: string, label: string) => void;
  };
}

const MONACO_BASE_URL: string = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.14.3/min/';

export class MonacoWrapper extends React.Component<IMonacoWrapperProps, IMonacoWrapperState> {
  private static _initializePromise: Promise<typeof monacoEditor>;

  private _editor: monacoEditor.editor.IStandaloneCodeEditor | undefined;
  private get _value(): string | undefined {
    if (this._editor) {
      return this._editor.getValue();
    } else {
      return undefined;
    }
  }

  private static _initializeMonaco(): Promise<typeof monacoEditor> {
    if (!MonacoWrapper._initializePromise) {
      MonacoWrapper._initializePromise = new Promise(
        (resolve: (monaco: typeof monacoEditor) => void, reject: (error: Error) => void ) => {
          const monacoWindow: IMonacoWindow = window as IMonacoWindow;
          monacoWindow.require.config({ paths: { 'vs': `${MONACO_BASE_URL}vs/` }});

          monacoWindow.MonacoEnvironment = {
            getWorkerUrl: (workerId, label) => {
              return `data:text/javascript;charset=utf-8,${encodeURIComponent(
                'self.MonacoEnvironment = {' +
                  `baseUrl: '${MONACO_BASE_URL}'` +
                '};' +
                `importScripts('${MONACO_BASE_URL}vs/base/worker/workerMain.js');`
              )}`;
            }
          };

          monacoWindow.require(['vs/editor/editor.main'], (monaco) => {
            if (monaco) {
              resolve(monaco);
            } else {
              reject(new Error('Unable to load Monaco editor'));
            }
          });
        }
      );
    }

    return MonacoWrapper._initializePromise;
  }

  constructor(props: IMonacoWrapperProps) {
    super(props);

    this.state = {};
  }

  public componentDidMount(): void {
    MonacoWrapper._initializeMonaco().then((monaco) => {
      this.setState({ monaco });
      window.addEventListener('resize', this._updateLayout.bind(this));
    }).catch((error) => {
      console.error(`Error loading Monaco editor: ${error}`);
      this.setState({ failedToLoad: true });
    });
  }

  public componentWillUnmount(): void {
    this._editor = undefined;
    window.removeEventListener('resize', this._updateLayout.bind(this));
  }

  public componentDidUpdate(prevProps: IMonacoWrapperProps): void {
    if (this._value !== this.props.value && this._editor) {
      this._editor.setValue(this.props.value || '');
    }
  }

  public render(): React.ReactNode {
    if (this.state.failedToLoad) {
      return ( // Fall back to a textbox
        <textarea
          className={ this.props.className }
          style={ this.props.style }
          value={ this.props.value  }
          onChange={ (event) => this._safeOnChange(event.target.value) }
          />
        );
    } else {
      return (
        <div
          ref={this._createEditor.bind(this)}
          className={ this.props.className }
          style={ this.props.style || { height: '100%' } }
        />
      );
    }
  }

  private _safeOnChange(newValue: string): void {
    if (this.props.onChange) {
      try {
        this.props.onChange(newValue);
      } catch (e) {
        // Ignore
      }
    }
  }

  private _createEditor(element: HTMLDivElement): void {
    MonacoWrapper._initializeMonaco().then((monaco) => {
      if (!this._editor && element) { // Make sure we only initialize once
        this._editor = monaco.editor.create(
          element,
          {
            value: this.props.value || '',
            language: this.props.language,
            readOnly: this.props.readOnly,
            minimap: {
              enabled: false
            },
            ...this.props.editorOptions
          }
        );
        this._editor.getModel().onDidChangeContent((e) => {
          if (this._editor) {
            this._safeOnChange(this._editor.getValue());
          }
        });
      }
    });
  }

  private _updateLayout(): void {
    if (this._editor) {
      this._editor.layout();
    }
  }
}
