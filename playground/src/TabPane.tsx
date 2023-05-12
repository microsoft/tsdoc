import * as React from 'react';
import { FlexRowDiv, FlexColDiv } from './FlexDivs';

export interface ITabDefinition {
  title: string;
  render: () => React.ReactNode;
}

export interface ITabPaneProps {
  tabs: ITabDefinition[];
  style?: React.CSSProperties;
  buttonRowStyle?: React.CSSProperties;
  contentDivStyle?: React.CSSProperties;
}

export interface ITabPaneState {
  selectedTabIndex: number;
}

export class TabPane extends React.Component<ITabPaneProps, ITabPaneState> {
  // Saved bindings of _onClickTab() with a tabIndex parameter, to avoid the react/jsx-no-bind issue
  private _onClickTabBindings: React.MouseEventHandler<HTMLAnchorElement>[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public constructor(props: ITabPaneProps, context?: any) {
    super(props, context);

    this.state = {
      selectedTabIndex: 0
    };
  }

  public render(): React.ReactNode {
    const buttons: React.ReactNode[] = [];

    let selectedTabDefinition: ITabDefinition | undefined = undefined;

    for (let i: number = 0; i < this.props.tabs.length; ++i) {
      const tabDefinition: ITabDefinition = this.props.tabs[i];

      const style: React.CSSProperties = {
        padding: '8px',
        marginLeft: '1px',
        marginRight: '1px'
      };

      if (i === this.state.selectedTabIndex) {
        selectedTabDefinition = tabDefinition;

        const activeTabStyle: React.CSSProperties = {
          ...style,
          borderStyle: 'solid',
          borderWidth: '2px',
          borderColor: '#c0c0c0',
          borderBottomStyle: 'none',
          borderTopLeftRadius: '4px',
          borderTopRightRadius: '4px'
        };

        buttons.push(
          <div key={`tab_${i}`} className="playground-tab-pane-active-tab" style={activeTabStyle} role="tab">
            {tabDefinition.title}
          </div>
        );
      } else {
        if (!this._onClickTabBindings[i]) {
          // Bind _onClickTab() with i as the tabIndex parameter
          this._onClickTabBindings[i] = this._onClickTab.bind(this, i);
        }

        buttons.push(
          <div key={`tab_${i}`} className="playground-tab-pane-inactive-tab" style={style}>
            <a
              href="#"
              style={{ textDecorationLine: 'none', color: '#000000' }}
              onClick={this._onClickTabBindings[i]}
              role="tab"
            >
              {tabDefinition.title}
            </a>
          </div>
        );
      }
    }

    const contentDivStyle: React.CSSProperties = {
      ...this.props.contentDivStyle,
      borderStyle: 'solid',
      borderWidth: '2px',
      borderColor: '#c0c0c0',
      flex: 1
    };

    const tabPaneStyle: React.CSSProperties = {
      ...this.props.style,
      minWidth: 0,
      minHeight: '400px',
      marginTop: '20px'
    };

    return (
      <FlexColDiv className="playground-tab-pane" style={tabPaneStyle}>
        <FlexRowDiv className="playground-tab-pane-buttons" style={this.props.buttonRowStyle}>
          {buttons}
        </FlexRowDiv>
        <FlexColDiv className="playground-tab-pane-content" style={contentDivStyle}>
          {selectedTabDefinition !== undefined ? selectedTabDefinition.render() : ''}
        </FlexColDiv>
      </FlexColDiv>
    );
  }

  private _onClickTab(tabIndex: number, event: React.MouseEvent<HTMLAnchorElement>): void {
    this.setState({ selectedTabIndex: tabIndex });
  }
}
