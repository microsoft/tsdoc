import { TestHelpers } from './TestHelpers';

test('00 Code span basic, positive', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot([
    '/**',
    ' * line `1`',
    ' * line ` 2` sdf',
    ' */'
  ].join('\n'));
});

test('01 Code span basic, negative', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot([
    '/**',
    ' * `multi',
    ' * line`',
    ' */'
  ].join('\n'));
  TestHelpers.parseAndMatchNodeParserSnapshot([
    '/**',
    ' * one`two',
    ' * `three`four',
    ' */'
  ].join('\n'));
});
