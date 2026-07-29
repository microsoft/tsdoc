// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { TestHelpers } from './TestHelpers';

test('00 Example block: no title', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * @example', ' * Some example content.', ' */'].join('\n')
  );
});

test('01 Example block: with title', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * @example Adding two numbers', ' * Some example content.', ' */'].join('\n')
  );
});

test('02 Example block: title with a code sample', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * @example Basic usage', ' * ```ts', ' * add(1, 2);', ' * ```', ' */'].join('\n')
  );
});

test('03 Example block: multiple blocks with and without titles', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * @example First example', ' * Content 1.', ' * @example', ' * Content 2.', ' */'].join('\n')
  );
});

test('04 Example block: title with surrounding whitespace', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * @example    Trimmed title   ', ' * Content.', ' */'].join('\n')
  );
});
