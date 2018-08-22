# Contributing to the TSDoc project

### Building the @microsoft/tsdoc library

To build the project:

```
$ cd ./tsdoc
$ npm install
$ npm run build
```

### Running the unit tests

We use the [Jest](https://jestjs.io/) test runner.  To run the TSDoc tests interactively (`jest --watch` scenario):

```
$ cd ./tsdoc
$ npm run watch
```

Running all the unit tests before submitting your PR:

```
$ cd ./tsdoc
$ npm run build
$ npm run test
```

### Debugging the unit tests

The [./tsdoc/.vscode/launch.json](./tsdoc/.vscode/launch.json) file includes a
[Visual Studio Code](https://code.visualstudio.com/) configuration that makes debugging
easier.  To debug a unit test:

1. Launch VS Code in the tsdoc subfolder (not the repository root):

```
$ cd ./tsdoc
$ code .
```

2. In the editor window, open a test file. For example, **src/__tests__/ParsingBasicTests.test.ts**.

3. Click the **View --> Debug** (CTRL+SHIFT+D)

4. From the DEBUG combo box, choose the "**Jest Current File**" debug configuration, and click the play button.
This will run only the unit tests in the currently opened file.  (Use "**Jest All**" to run all tests in
the debugger.)

We use a TypeScript plugin for Jest, so you can set breakpoints in the TypeScript source files,
and the VS Code debugger will break on them.

## Building and running the api-demo code sample

Before submitting your PR, you should also build and run the [/api-demo](./api-demo/) project.
For details, see [/api-demo/README.md](./api-demo/README.md).

##  Contributor License Agreement (CLA)

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.microsoft.com.

When you submit a pull request, a CLA-bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
