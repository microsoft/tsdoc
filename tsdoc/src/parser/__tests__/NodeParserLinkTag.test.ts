import { TestHelpers } from './TestHelpers';

test('00 Link tags with URL: positive examples', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot([
    '/**',
    ' * {@link http://example1.com}',
    ' * {@link mail:bob@example2.com}',
    ' * {@link http://example3.com|link text}',
    ' * {@link http://example4.com|}',
    ' * {@link http://example5.com|',
    ' *}',
    ' */'
  ].join('\n'));
  TestHelpers.parseAndMatchNodeParserSnapshot([
    '/**',
    ' * {@link    mail:bob@example6.com   |  link text }',
    ' * {@link  ',
    ' *   http://example7.com  ',
    ' *   | ',
    ' *   link text ',
    ' * }',
    ' */'
  ].join('\n'));
});
