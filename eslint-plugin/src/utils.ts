// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { ESLintUtils } from '@typescript-eslint/utils';

export const configMessages: { [x: string]: string } = {
  'error-loading-config-file': 'Error loading TSDoc config file:\n{{details}}',
  'error-applying-config': 'Error applying TSDoc configuration: {{details}}'
};

interface ITsdocPluginDocs {
  description: string;
  recommended?: boolean;
  requiresTypeChecking?: boolean;
}

export const createRule: ReturnType<typeof ESLintUtils.RuleCreator<ITsdocPluginDocs>> =
  ESLintUtils.RuleCreator<ITsdocPluginDocs>(
    (name) => `https://tsdoc.org/pages/packages/eslint-plugin-tsdoc/#${name}`
  );
