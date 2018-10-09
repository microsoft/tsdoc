import * as React from 'react';
import { PlaygroundView } from './PlaygroundView';

class App extends React.Component {
  public render(): React.ReactNode {

    return (
      <>
        <h1>TSDoc Playground</h1>

        <PlaygroundView />
      </>
    );
  }
}

export default App;
