import * as React from 'react';
import * as monacoEditor from 'monaco-editor';
import { FlexColDiv } from './FlexDivs';

export interface ITextRange {
  /**
   * Beginning position as a character index of the text in the editor
   */
  pos: number;

  /**
   * End position as a character index of the text in the editor
   */
  end: number;
}

/**
 * Describes a marker. Markers refer to annotations (i.e. - squiggly lines) in code.
 */
export interface ISyntaxMarker extends ITextRange {
  message: string;
}

/**
 * Describes a styled range. This allows CSS styling to be applied to ranges of code.
 */
export interface IStyledRange extends ITextRange {
  className: string;
}

export interface ICodeEditorProps {
  className?: string;
  style?: React.CSSProperties;
  value?: string;
  readOnly?: boolean;
  language?: string;
  onChange?: (value: string) => void;

  disableLineNumbers?: boolean;
  theme?: string;
  markers?: ISyntaxMarker[];
  syntaxStyles?: IStyledRange[];
  wordWrap?: boolean;
}

export interface ICodeEditorState {
  monaco?: typeof monacoEditor;
  monacoErrorMessage?: string;
}

interface IMonacoWindow extends Window {
  require: {
    (paths: string[], callback: (monaco: typeof monacoEditor) => void): void;
    config: (options: { paths: { [name: string]: string } }) => void;
  };
  MonacoEnvironment: {
    getWorkerUrl: (workerId: string, label: string) => void;
  };
}

declare const MONACO_URL: string;
const MONACO_BASE_URL: string = MONACO_URL;

export class CodeEditor extends React.Component<ICodeEditorProps, ICodeEditorState> {
  private static _initializePromise: Promise<typeof monacoEditor>;
  private static _editorIdCounter: number = 0;
  private static _monaco: typeof monacoEditor;

  private _existingSyntaxStyles: { [hash: string]: string } = {};
  private _editorId: string;
  private _isMounted: boolean = false;
  private _editor: monacoEditor.editor.IStandaloneCodeEditor | undefined;

  private _placeholderDivRef: HTMLDivElement | undefined;
  private _hostDivRef: HTMLDivElement | undefined;

  public constructor(props: ICodeEditorProps) {
    super(props);

    this._editorId = `tsdoc-monaco-${CodeEditor._editorIdCounter++}`;
    this.state = {};
    this._onWindowResize = this._onWindowResize.bind(this);
    this._onRefHost = this._onRefHost.bind(this);
    this._onRefPlaceholder = this._onRefPlaceholder.bind(this);
  }

  private get _value(): string | undefined {
    if (this._editor) {
      return this._editor.getValue();
    } else {
      return undefined;
    }
  }

  private _getEditorModel(): monacoEditor.editor.ITextModel {
    if (this._editor) {
      const model: monacoEditor.editor.ITextModel | null = this._editor.getModel();
      if (model) {
        return model;
      }
    }
    throw new Error('Invalid access to MonacoEditor.getModel()');
  }

  private static _initializeMonaco(): Promise<typeof monacoEditor> {
    if (!CodeEditor._initializePromise) {
      CodeEditor._initializePromise = new Promise(
        (resolve: (monaco: typeof monacoEditor) => void, reject: (error: Error) => void) => {
          const monacoWindow: IMonacoWindow = (window as unknown) as IMonacoWindow;
          monacoWindow.require.config({ paths: { vs: `${MONACO_BASE_URL}vs/` } });

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
      ).then((monaco) => {
        CodeEditor._monaco = monaco;
        return monaco;
      });
    }

    return CodeEditor._initializePromise;
  }

  public componentDidMount(): void {
    this._isMounted = true;
    CodeEditor._initializeMonaco()
      .then((monaco) => {
        this.setState({ monaco });
        if (this._isMounted) {
          window.addEventListener('resize', this._onWindowResize);
        }
      })
      .catch((error) => {
        this.setState({ monacoErrorMessage: `Error loading Monaco editor: ${error}` });
      });
  }

  public componentWillUnmount(): void {
    this._isMounted = false;
    this._editor = undefined;

    this._placeholderDivRef = undefined;
    this._hostDivRef = undefined;

    window.removeEventListener('resize', this._onWindowResize);
  }

  public componentDidUpdate(prevProps: ICodeEditorProps): void {
    if (this._editor) {
      if (this._value !== this.props.value) {
        this._editor.setValue(this.props.value || '');
      }

      if (CodeEditor._monaco) {
        CodeEditor._monaco.editor.setModelMarkers(
          this._getEditorModel(),
          this._editorId,
          (this.props.markers || []).map((marker) => {
            const startPos: monacoEditor.Position = this._getEditorModel().getPositionAt(marker.pos);
            const endPos: monacoEditor.Position = this._getEditorModel().getPositionAt(marker.end);
            return {
              startLineNumber: startPos.lineNumber,
              startColumn: startPos.column,
              endLineNumber: endPos.lineNumber,
              endColumn: endPos.column,
              severity: CodeEditor._monaco.MarkerSeverity.Error,
              message: marker.message
            };
          })
        );

        if (this.props.theme !== prevProps.theme) {
          CodeEditor._monaco.editor.setTheme(this.props.theme || 'vs');
        }
      }

      if (this.props.disableLineNumbers !== prevProps.disableLineNumbers) {
        this._editor.updateOptions({
          lineNumbers: this.props.disableLineNumbers ? 'off' : 'on'
        });
      }

      this._applySyntaxStyling(this.props.syntaxStyles || []);
    }
  }

  public render(): React.ReactNode {
    if (this.state.monacoErrorMessage) {
      return (
        <FlexColDiv className={this.props.className} style={this.props.style}>
          {this.state.monacoErrorMessage}
        </FlexColDiv>
      );
    } else {
      // The Monaco application is very complex and its div does not resize reliably.
      // To work around this, we render a blank placeholder div (that is well-behaved),
      // and then the Monaco host div floats above that using absolute positioning
      // and manual resizing.
      return (
        <div
          className="playground-monaco-placeholder"
          ref={this._onRefPlaceholder}
          style={{ display: 'flex', flexDirection: 'column', flex: 1, ...this.props.style }}
        >
          <div
            className="playground-monaco-host"
            ref={this._onRefHost}
            style={{ display: 'block', position: 'absolute', backgroundColor: '#00FF00' }}
          />
        </div>
      );
    }
  }

  private _onRefPlaceholder(element: HTMLDivElement): void {
    this._placeholderDivRef = element;
  }

  private _onRefHost(element: HTMLDivElement): void {
    this._hostDivRef = element;
    this._createEditor();
  }

  private _applySyntaxStyling(newSyntaxStyles: IStyledRange[]): void {
    if (this._editor) {
      // Find decorations to remove
      const newExistingSyntaxStyles: { [hash: string]: string } = {};
      const decorationsToAdd: IStyledRange[] = [];
      const hashesOfDecorationsToAdd: string[] = [];
      const decorationsToRemove: string[] = [];
      for (const syntaxStyle of newSyntaxStyles) {
        const hash: string = JSON.stringify(syntaxStyle);

        if (this._existingSyntaxStyles[hash] !== undefined) {
          newExistingSyntaxStyles[hash] = this._existingSyntaxStyles[hash];
          delete this._existingSyntaxStyles[hash];
        } else {
          newExistingSyntaxStyles[hash] = ''; // Put an empty identifier here so we don't add duplicates
          hashesOfDecorationsToAdd.push(hash);
          decorationsToAdd.push(syntaxStyle);
        }
      }

      for (const hash in this._existingSyntaxStyles) {
        if (this._existingSyntaxStyles.hasOwnProperty(hash)) {
          const decorationId: string = this._existingSyntaxStyles[hash];
          decorationsToRemove.push(decorationId);
        }
      }

      this._getEditorModel().deltaDecorations(decorationsToRemove, []);
      const decorationIds: string[] = this._getEditorModel().deltaDecorations(
        [],
        decorationsToAdd.map((decoration) => {
          const startPos: monacoEditor.Position = this._getEditorModel().getPositionAt(decoration.pos);
          const endPos: monacoEditor.Position = this._getEditorModel().getPositionAt(decoration.end);

          return {
            range: new CodeEditor._monaco.Range(
              startPos.lineNumber,
              startPos.column,
              endPos.lineNumber,
              endPos.column
            ),
            options: {
              stickiness: CodeEditor._monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
              isWholeLine: false,
              inlineClassName: decoration.className
            }
          };
        })
      );

      for (let i: number = 0; i < decorationsToAdd.length; i++) {
        newExistingSyntaxStyles[hashesOfDecorationsToAdd[i]] = decorationIds[i];
      }

      this._existingSyntaxStyles = newExistingSyntaxStyles;
    }
  }

  private _safeOnChange(newValue: string): void {
    if (this.props.onChange) {
      try {
        this.props.onChange(newValue);
      } catch (e) {
        console.error(`Error in onChange callback: ${e}`);
      }
    }
  }

  private _createEditor(): void {
    CodeEditor._initializeMonaco()
      .then((monaco) => {
        if (!this._editor && this._hostDivRef) {
          this._editor = monaco.editor.create(this._hostDivRef, {
            value: this.props.value || '',
            language: this.props.language,
            readOnly: this.props.readOnly,
            minimap: {
              enabled: false
            },
            lineNumbers: this.props.disableLineNumbers ? 'off' : 'on',
            theme: this.props.theme,
            wordWrap: this.props.wordWrap ? 'on' : 'off'
          });

          this._getEditorModel().onDidChangeContent((e) => {
            if (this._editor) {
              this._safeOnChange(this._editor.getValue());
            }
          });

          this._onWindowResize();
        }
      })
      .catch((e) => {
        console.error('CodeEditor._createEditor() failed: ' + e.toString());
      });
  }

  private _onWindowResize(): void {
    if (this._placeholderDivRef && this._hostDivRef) {
      // Resize the host div to match whatever the browser did for the placeholder div
      this._hostDivRef.style.width = this._placeholderDivRef.clientWidth + 'px';
      this._hostDivRef.style.height = this._placeholderDivRef.clientHeight + 'px';

      if (this._editor) {
        this._editor.layout();
      }
    }
  }
}
