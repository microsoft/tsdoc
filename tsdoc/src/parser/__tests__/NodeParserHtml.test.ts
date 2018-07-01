import { TestHelpers } from './TestHelpers';

test('01 HTML start tags: simple, positive', () => {
  TestHelpers.parseAndMatchSnapshot([
    '/**',
    ' * <tag/>',
    ' * <tag-a />',
    ' * <tag-b /><tag-c />',
    ' * <tag-d',
    ' * >',
    ' * <tag-e',
    ' *      />  ',
    ' */'
  ].join('\n'));
});

test('02 HTML start tags: simple, negative', () => {
  TestHelpers.parseAndMatchSnapshot([
    '/**',
    ' * < tag/>',
    ' * <tag -a />',
    ' * <tag-b /<tag-c / >',
    ' * <tag-d',
    ' */'
  ].join('\n'));

});

test('03 HTML start tags: with attributes, positive', () => {
  TestHelpers.parseAndMatchSnapshot([
    '/**',
    ' * <tag-a attr-one="one" />',
    ' * <tag-b',
    ' *   attr-two',
    ' *   = "2"',
    ' * />',
    ' */'
  ].join('\n'));
  TestHelpers.parseAndMatchSnapshot([
    '/**',
    ' * <tag-c attr-three="3" four=\'4\'/>',
    ' * <tag-d',
    ' *   attr-five',
    ' *   = "5"',
    ' *   six',
    ' *   = \'6\'',
    ' * />',
    ' */'
  ].join('\n'));
  TestHelpers.parseAndMatchSnapshot([
    '/**',
    ' * <tag-e attr-one="one" two=\'two\'/>',
    ' * <tag-f',
    ' *   attr-one',
    ' *   = "one"',
    ' *   two',
    ' *   = \'two\'',
    ' * />',
    ' */'
  ].join('\n'));
});

test('04 HTML start tags: with attributes, negative', () => {
  TestHelpers.parseAndMatchSnapshot([
    '/**',
    ' * <tag-a attr -one="one" />',
    ' * <tag-b attr- two="two" />',
    ' * <tag-c attr-three=\'three" />',
    ' * <tag-d attr-four=@"four" />',
    ' * <tag-e attr-five@="five" />',
    ' * <tag-f attr-six="six"seven="seven" />',
    ' */'
  ].join('\n'));
  TestHelpers.parseAndMatchSnapshot([
    '/**',
    ' * <tag-g attr="multi',
    ' * line" />',
    ' */'
  ].join('\n'));
});

test('05 Eclipsed TSDoc', () => {
  TestHelpers.parseAndMatchSnapshot([
    '/**',
    ' * <tag attr-one="@tag" />',
    ' */'
  ].join('\n'));
});
