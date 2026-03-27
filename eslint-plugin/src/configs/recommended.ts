// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import type { Linter } from 'eslint';

const config: Linter.Config = {
  rules: {
    'tsdoc/syntax': 'warn'
  }
};

export default config;
