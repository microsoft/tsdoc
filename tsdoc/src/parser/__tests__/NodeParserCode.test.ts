import { TestHelpers } from './TestHelpers';

test('00 Code span basic, positive', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(['/**', ' * line `1`', ' * line ` 2` sdf', ' */'].join('\n'));
  TestHelpers.parseAndMatchNodeParserSnapshot(['/**', ' * M`&`M', ' */'].join('\n'));
});

test('01 Code span basic, negative', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(['/**', ' * `multi', ' * line`', ' */'].join('\n'));
  TestHelpers.parseAndMatchNodeParserSnapshot(['/**', ' * ``', ' */'].join('\n'));
});

test('03 Code fence, positive', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(
    [
      '/**',
      ' * This is a code fence with all parts:',
      ' * ```a language!   ',
      ' *   some `code` here',
      ' * ```   ',
      ' */'
    ].join('\n')
  );
  TestHelpers.parseAndMatchNodeParserSnapshot(
    [
      '/**',
      ' * This is a code fence with no language or trailing whitespace:',
      ' * ```',
      ' *   some `code` here',
      ' * ```*/'
    ].join('\n')
  );
});

test('04 Code fence, negative', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * Code fence incorrectly indented:', ' *    ```', ' */'].join('\n')
  );
  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * Code fence not starting the line:', ' *a```', ' */'].join('\n')
  );
  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * Code fence not being terminated 1:', ' * ```*/'].join('\n')
  );
  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * Code fence not being terminated 2:', ' * ``` some stuff', ' */'].join('\n')
  );
  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * Language having backticks:', ' * ``` some stuff ```', ' */'].join('\n')
  );
  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * Closing delimiter being indented:', ' * ```', ' * code', ' *      ```', ' */'].join('\n')
  );
  TestHelpers.parseAndMatchNodeParserSnapshot(
    [
      '/**',
      ' * Closing delimiter not being on a line by itself:',
      ' * ```',
      ' * code',
      ' * ```  a',
      ' */'
    ].join('\n')
  );
});
