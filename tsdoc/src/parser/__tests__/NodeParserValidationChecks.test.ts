import { TestHelpers } from './TestHelpers';

test('00 Deprecated block: positive test', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot([
    '/**',
    ' * @deprecated',
    ' * Use the other thing',
    ' */'
  ].join('\n'));
});

test('01 Deprecated block: negative test', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot([
    '/**',
    ' * @deprecated',
    ' * ',
    ' * @public',
    ' */'
  ].join('\n'));
});
