import * as React from 'react';

export interface IFlexDivProps
  extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> {}

export class FlexRowDiv extends React.Component<IFlexDivProps> {
  public render(): React.ReactNode {
    const mergedProps: IFlexDivProps = {
      ...this.props
    };

    if (mergedProps.style === undefined) {
      mergedProps.style = {};
    }
    if (mergedProps.style.display === undefined) {
      mergedProps.style.display = 'flex';
    }
    if (mergedProps.style.flexDirection === undefined) {
      mergedProps.style.flexDirection = 'row';
    }

    return React.createElement('div', mergedProps);
  }
}

export class FlexColDiv extends React.Component<IFlexDivProps> {
  public render(): React.ReactNode {
    const mergedProps: IFlexDivProps = {
      ...this.props
    };

    if (mergedProps.style === undefined) {
      mergedProps.style = {};
    }
    if (mergedProps.style.display === undefined) {
      mergedProps.style.display = 'flex';
    }
    if (mergedProps.style.flexDirection === undefined) {
      mergedProps.style.flexDirection = 'column';
    }

    return React.createElement('div', mergedProps);
  }
}
