import * as React from 'react';
import { PlaygroundView } from './PlaygroundView';

class App extends React.Component {
  public render(): React.ReactNode {

    return (
      <div>
        <h1>TSDoc Playground</h1>

        <PlaygroundView />
      </div>
    );
  }
}

export default App;
