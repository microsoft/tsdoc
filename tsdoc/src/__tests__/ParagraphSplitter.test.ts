import { TestHelpers } from '../parser/__tests__/TestHelpers';

test('01 Basic paragraph splitting', () => {
  TestHelpers.parseAndMatchDocCommentSnapshot([
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
