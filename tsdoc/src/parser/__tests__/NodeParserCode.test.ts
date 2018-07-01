import { TestHelpers } from './TestHelpers';

test('00 Code span basic, positive', () => {
  TestHelpers.parseAndMatchSnapshot([
    '/**',
    ' * line `1`',
    ' * line ` 2` sdf',
    ' */'
  ].join('\n'));
});

test('01 Code span basic, negative', () => {
  TestHelpers.parseAndMatchSnapshot([
    '/**',
    ' * `multi',
    ' * line`',
    ' */'
  ].join('\n'));
  TestHelpers.parseAndMatchSnapshot([
    '/**',
    ' * one`two',
    ' * `three`four',
    ' */'
  ].join('\n'));
});
