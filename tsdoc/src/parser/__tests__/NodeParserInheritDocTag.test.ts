import { TestHelpers } from './TestHelpers';

test('00 InheritDoc tag: positive examples', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot([
    '/**',
    ' * {@inheritDoc}',
    ' */'
  ].join('\n'));
  TestHelpers.parseAndMatchNodeParserSnapshot([
    '/**',
    ' * {@inheritDoc Class.member}',
    ' */'
  ].join('\n'));
  TestHelpers.parseAndMatchNodeParserSnapshot([
    '/**',
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
  TestHelpers.parseAndMatchNodeParserSnapshot([
    '/**',
    ' * {@inheritDoc Class % junk}',
    ' */'
  ].join('\n'));
  TestHelpers.parseAndMatchNodeParserSnapshot([
    '/**',
    ' * {@inheritDoc}',
    ' * {@inheritDoc}',
    ' */'
  ].join('\n'));
  TestHelpers.parseAndMatchNodeParserSnapshot([
    '/**',
    ' * summary text',
    ' * @remarks',
    ' * {@inheritDoc}',
    ' */'
  ].join('\n'));

  // Old API Extractor syntax
  TestHelpers.parseAndMatchNodeParserSnapshot([
    '/**',
    ' * {@inheritdoc @scope/library:IDisposable.isDisposed}',
    ' */'
  ].join('\n'));
});
