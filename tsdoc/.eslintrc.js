// This is a workaround for https://github.com/eslint/eslint/issues/3458
require("@microsoft/eslint-config-scalable-ts/patch-eslint6");

module.exports = {
  extends: [ "@microsoft/eslint-config-scalable-ts" ],
  parserOptions: { tsconfigRootDir: __dirname },
};
