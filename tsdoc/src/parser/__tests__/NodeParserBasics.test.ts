import { TestHelpers } from './TestHelpers';

test('00 Tokenizer simple case', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot([
    '/**',
    ' * line 1 ', // extra space at end of line
    ' * line 2',
    ' */'
  ].join('\n'));
});

test('01 Tokenizer degenerate cases', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot('/***/');

  TestHelpers.parseAndMatchNodeParserSnapshot([
    '/**',
    ' *',
    ' */'
  ].join('\n'));

  TestHelpers.parseAndMatchNodeParserSnapshot([
    '/**',
    ' ',
    ' ',
    ' */'
  ].join('\n'));

});

test('02 Backslash escapes: positive examples', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot([
    '/**',
    ' * \\$\\@param',
    ' */'
  ].join('\n'));
});

test('03 Backslash escapes: negative examples', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot([
    '/**',
    ' * letter: \\A space: \\  end of line: \\',
    ' */'
  ].join('\n'));
});

test('04 Paragraphs', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot([
    '/**',
    ' *    ',
    ' * This is the',
    ' * first paragraph.',
    ' *   \t   ',
    ' *  ',
    ' *   \t   ',
    ' * This is the second paragraph.',
    ' *',
    ' * This is the third paragraph.',
    ' *',
    ' *   ',
    ' */'
  ].join('\n'));
});
