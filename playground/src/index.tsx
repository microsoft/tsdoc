import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App';
import './index.css';

// Ensure that this file changes each time it builds so deployment always works
declare const COMMIT_ID: string;
console.info(COMMIT_ID);

ReactDOM.render(
  <App />,
  document.getElementById('root') as HTMLElement
);
