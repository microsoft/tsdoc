// This is a workaround for https://github.com/eslint/eslint/issues/3458
require('@rushstack/eslint-config/patch/modern-module-resolution');

module.exports = {
  extends: [
    '@rushstack/eslint-config/profile/web-app',
    '@rushstack/eslint-config/mixins/friendly-locals',
    '@rushstack/eslint-config/mixins/react'
  ],

  settings: {
    react: {
      version: '16.9'
    }
  },

  parserOptions: { tsconfigRootDir: __dirname },

  plugins: ['eslint-plugin-header'],
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        // Rationale: Including the `type` annotation in the import statement for imports
        // only used as types prevents the import from being emitted in the compiled output.
        '@typescript-eslint/consistent-type-imports': [
          'warn',
          { prefer: 'type-imports', disallowTypeAnnotations: false, fixStyle: 'inline-type-imports' }
        ],

        // Rationale: If all imports in an import statement are only used as types,
        // then the import statement should be omitted in the compiled JS output.
        '@typescript-eslint/no-import-type-side-effects': 'warn',

        'header/header': [
          'warn',
          'line',
          [
            ' Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.',
            ' See LICENSE in the project root for license information.'
          ]
        ]
      }
    }
  ]
};
