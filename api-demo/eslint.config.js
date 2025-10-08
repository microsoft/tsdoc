const nodeTrustedToolProfile = require('tsdoc-build-rig/includes/eslint/flat/profile/node-trusted-tool');
const friendlyLocalsMixin = require('tsdoc-build-rig/includes/eslint/flat/mixins/friendly-locals');

module.exports = [
  ...nodeTrustedToolProfile,
  ...friendlyLocalsMixin,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname
      }
    },
    rules: {
      'no-console': 'off'
    }
  }
];
