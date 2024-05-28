// This is a workaround for https://github.com/eslint/eslint/issues/3458
require('@rushstack/heft-web-rig/profiles/library/includes/eslint/patch/modern-module-resolution');
// This is a workaround for https://github.com/microsoft/rushstack/issues/3021
require('@rushstack/heft-web-rig/profiles/library/includes/eslint/patch/custom-config-package-names');

module.exports = {
  extends: [
    '@rushstack/heft-web-rig/profiles/library/includes/eslint/profile/web-app',
    '@rushstack/heft-web-rig/profiles/library/includes/eslint/mixins/friendly-locals'
  ],
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
