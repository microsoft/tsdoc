# eslint-plugin-tsdoc

This ESLint plugin provides a rule for validating that TypeScript doc comments conform to the
[TSDoc specification](https://tsdoc.org/).

## Usage

1.  Configure ESLint for your TypeScript project.  See the instructions provided by the
    [typescript-eslint](https://github.com/typescript-eslint/typescript-eslint) project.
    You will end up with some dependencies like this:

    **my-project/package.json**  (example)
    ```ts
    {
      "name": "my-project",
      "version": "1.0.0",
      "dependencies": {},
      "devDependencies": {
        "@typescript-eslint/eslint-plugin": "~2.6.1",
        "@typescript-eslint/parser": "~2.6.1",
        "eslint": "~6.6.0",
        "typescript": "~3.7.2"
      },
      "scripts": {
        "lint": "eslint -f unix \"src/**/*.{ts,tsx}\""
      }
    }
    ```

2.  Add the `eslint-plugin-tsdoc` dependency to your project:

    ```bash
    $ cd my-project
    $ npm install --save-dev eslint-plugin-tsdoc
    ```

3.  In your ESLint config file, add the `"eslint-plugin-tsdoc"` package to your `plugins` field,
    and enable the `"tsdoc/syntax"` rule.  For example:

    **my-project/.eslintrc.js** (example)
    ```ts
    module.exports =  {
      plugins: [
        "@typescript-eslint/eslint-plugin",
        "eslint-plugin-tsdoc"
      ],
      extends:  [
        'plugin:@typescript-eslint/recommended'
      ],
      parser:  '@typescript-eslint/parser',
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
        ecmaVersion: 2018,
        sourceType: "module"
      },
      rules: {
        "tsdoc/syntax": "warn"
      }
    };
    ```

This package is maintained by the TSDoc project.  If you have questions or feedback, please
[let us know](https://tsdoc.org/pages/resources/help)!
