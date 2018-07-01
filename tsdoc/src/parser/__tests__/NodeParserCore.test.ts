import { TestHelpers } from './TestHelpers';

test('00 Tokenizer simple case', () => {
  TestHelpers.parseAndMatchSnapshot([
    '/**',
    ' * line 1 ', // extra space at end of line
    ' * line 2',
    ' */'
  ].join('\n'));
});

test('01 Tokenizer degenerate cases', () => {
  TestHelpers.parseAndMatchSnapshot('/***/');

  TestHelpers.parseAndMatchSnapshot([
    '/**',
    ' *',
    ' */'
  ].join('\n'));

  TestHelpers.parseAndMatchSnapshot([
    '/**',
    ' ',
    ' ',
    ' */'
  ].join('\n'));

});

test('02 Backslash escapes: positive examples', () => {
  TestHelpers.parseAndMatchSnapshot([
    '/**',
    ' * \\$\\@param',
    ' */'
  ].join('\n'));
});

test('03 Backslash escapes: negative examples', () => {
  TestHelpers.parseAndMatchSnapshot([
    '/**',
    ' * letter: \\A space: \\  end of line: \\',
    ' */'
  ].join('\n'));
});
