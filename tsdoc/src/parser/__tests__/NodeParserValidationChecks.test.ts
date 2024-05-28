// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { TestHelpers } from './TestHelpers';

test('00 Deprecated block: positive test', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * @deprecated', ' * Use the other thing', ' */'].join('\n')
  );
});

test('01 Deprecated block: negative test', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * @deprecated', ' * ', ' * @public', ' */'].join('\n')
  );
});
