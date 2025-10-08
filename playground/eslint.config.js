const webAppProfile = require('tsdoc-build-rig/includes/eslint/flat/profile/web-app');
const friendlyLocalsMixin = require('tsdoc-build-rig/includes/eslint/flat/mixins/friendly-locals');

module.exports = [
  ...webAppProfile,
  ...friendlyLocalsMixin,
  {
    ignores: ['src/samples/']
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname
      }
    }
  }
];
