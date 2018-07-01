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
