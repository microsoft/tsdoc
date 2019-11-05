# eslint-plugin-tsdoc

This ESLint plugin provides a rule for validating that TypeScript doc comments conform to the
[TSDoc specification](https://github.com/microsoft/tsdoc).

## Usage

1. Configure ESLint for your TypeScript project.  See the instructions provided by the
   [typescript-eslint](
   https://github.com/typescript-eslint/typescript-eslint#how-do-i-configure-my-project-to-use-typescript-eslint) project.

2. Add the `eslint-plugin-tsdoc` dependency to your project:

    ```bash
    $ cd my-project
    $ npm install --save-dev eslint-plugin-tsdoc
    ```

3. Enable the rule in your ESLint config file.  Example usage:

    **my-project/.eslintrc.js**
    ```ts
    module.exports =  {
      parser:  '@typescript-eslint/parser',
      extends:  [
        'plugin:@typescript-eslint/recommended'
      ],
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
        ecmaVersion: 2018,
        sourceType: "module"
      },
      rules: {
        "tsdoc/syntax": "warn"
    };
    ```
