// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import * as React from 'react';

export interface IFlexDivProps
  extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> {}

export function FlexRowDiv(props: IFlexDivProps): JSX.Element {
  const mergedProps: IFlexDivProps = {
    ...props,
    style: {
      display: 'flex',
      flexDirection: 'row',
      ...props.style
    }
  };

  return React.createElement('div', mergedProps);
}

export function FlexColDiv(props: IFlexDivProps): JSX.Element {
  const mergedProps: IFlexDivProps = {
    ...props,
    style: {
      display: 'flex',
      flexDirection: 'column',
      ...props.style
    }
  };

  return React.createElement('div', mergedProps);
}
