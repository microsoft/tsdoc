import { TestHelpers } from './TestHelpers';

test('00 Block tags: positive examples', () => {
  TestHelpers.parseAndMatchSnapshot([
    '/**',
    ' * @one ',
    ' * @two',
    ' */'
  ].join('\n'));
});

test('01 Block tags: negative examples', () => {
  TestHelpers.parseAndMatchSnapshot([
    '/**',
    ' * @ one ',
    ' * +@two ',
    ' * @two+ ',
    ' */'
  ].join('\n'));
});

test('02 Inline tags: simple, positive', () => {
  TestHelpers.parseAndMatchSnapshot([
    '/**',
    ' * {@one} ',
    ' * {@two } ',
    ' * {@three}{@four} ',
    ' * {@five ',
    ' *   } ',
    ' */'
  ].join('\n'));
});

test('03 Inline tags: simple, negative', () => {
  TestHelpers.parseAndMatchSnapshot([
    '/**',
    ' * {@ one} ',
    ' * { @two} ',
    ' * {@three',
    ' */'
  ].join('\n'));
});

test('04 Inline tags: complex, positive', () => {
  TestHelpers.parseAndMatchSnapshot([
    '/**',
    ' * {@one some content}',
    ' * {@two multi',
    ' * line}',
    ' */'
  ].join('\n'));
  TestHelpers.parseAndMatchSnapshot([
    '/**',
    ' * {@three @taglike}',
    ' */'
  ].join('\n'));
});

test('05 Inline tags: escaping, positive', () => {
  TestHelpers.parseAndMatchSnapshot([
    '/**',
    ' * {@one left \\{ right \\} backslash \\\\ }',
    ' */'
  ].join('\n'));
});

test('06 Inline tags: escaping, negative', () => {
  TestHelpers.parseAndMatchSnapshot([
    '/**',
    ' * {@one curly\\}',
    ' */'
  ].join('\n'));
  TestHelpers.parseAndMatchSnapshot([
    '/**',
    ' * {@two curly{}}',
    ' */'
  ].join('\n'));
  TestHelpers.parseAndMatchSnapshot([
    '/**',
    ' * three: }',
    ' */'
  ].join('\n'));
});
