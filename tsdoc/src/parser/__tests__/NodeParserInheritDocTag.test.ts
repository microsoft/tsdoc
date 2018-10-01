import { TestHelpers } from './TestHelpers';

test('00 InheritDoc tag: positive examples', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot([
    '/**',
    ' * {@inheritDoc}',
    ' * {@inheritDoc Class.member}',
    ' * {@inheritDoc package# Class . member}',
    ' */'
  ].join('\n'));
});

test('01 InheritDoc tag: negative examples', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot([
    '/**',
    ' * {@inheritDoc | link text}',
    ' */'
  ].join('\n'));
});
