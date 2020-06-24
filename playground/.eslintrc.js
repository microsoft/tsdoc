// This is a workaround for https://github.com/eslint/eslint/issues/3458
require('@rushstack/eslint-config/patch/modern-module-resolution');

module.exports = {
  extends: [
    "@rushstack/eslint-config",
    "@rushstack/eslint-config/react"
  ],

  settings: {
    react: {
      "version": "16.9"
    }
  },

  parserOptions: { tsconfigRootDir: __dirname },
};
