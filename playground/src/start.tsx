// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App';
import './start.css';

// Ensure that this file changes each time it builds so deployment always works
declare const COMMIT_ID: string;
console.log(COMMIT_ID);

const rootDiv: HTMLElement = document.getElementById('root') as HTMLElement;

rootDiv.style.margin = '0';
rootDiv.style.height = '100%';
rootDiv.style.display = 'flex';
rootDiv.style.flexDirection = 'column';

ReactDOM.render(<App />, rootDiv);
