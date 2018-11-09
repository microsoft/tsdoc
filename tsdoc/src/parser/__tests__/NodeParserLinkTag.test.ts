import { TestHelpers } from './TestHelpers';

test('00 Link text: positive examples', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot([
    '/**',
    ' * {@link http://example1.com}',
    ' * {@link http://example2.com|}',
    ' * {@link http://example3.com| }',
    ' * {@link http://example4.com|link text}',
    ' * 1{@link http://example5.com| link',
    ' * text }2',
    ' * 3{@link http://example5.com| ',
    ' * link text ',
    ' *  }4',
    ' */'
  ].join('\n'));
});

test('01 Link text: negative examples', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot([
    '/**',
    ' * {@link}',
    ' * {@link http://example1.com| link | text}',
    ' */'
  ].join('\n'));
});

test('02 URL destination: positive examples', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot([
    '/**',
    ' * {@link http://example1.com}',
    ' * {@link https://example2.com#hash|link text}',
    ' * {@link customscheme://data}',
    ' */'
  ].join('\n'));
});

test('03 URL destination: negative examples', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot([
    '/**',
    ' * {@link http://example1.com spaces}',
    ' * {@link http://example2.com spaces|link text}',
    ' * {@link ftp+ssh://example3.com}',
    ' * {@link mailto:bob@example4.com}',
    ' * {@link //example5.com}',
    ' * {@link http://}',
    ' */'
  ].join('\n'));
});

test('04 Declaration reference with package name: positive examples', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot([
    '/**',
    ' * {@link my-example1#}',
    ' * {@link my-example2/path3#}',
    ' * {@link my-example4/path5/path6#}',
    ' * {@link @scope/my-example7/path8/path9#}',
    ' * {@link @scope/my-example7#}',
    ' */'
  ].join('\n'));
});

test('05 Declaration reference with package name: negative examples', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot([
    '/**',
    ' * {@link example1/#}',
    ' * {@link example2/a//b#}',
    ' * {@link @scope/ex@mple3#}',
    ' * {@link @/example4#}',
    ' * {@link @scope//my-example5#}',
    ' * {@link @scope#}',
    ' */'
  ].join('\n'));
  TestHelpers.parseAndMatchNodeParserSnapshot([
    '/**',
    ' * {@link @#}',
    ' * {@link #}',
    ' * {@link #Button}',
    ' */'
  ].join('\n'));
});

test('06 Declaration reference with import path only: positive examples', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot([
    '/**',
    ' * {@link ../path1#}',
    ' * {@link ./path2#}',
    ' * {@link ./path3/../path4#}',
    ' */'
  ].join('\n'));
});

test('07 Declaration reference with import path only: negative examples', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot([
    '/**',
    ' * {@link /path1#}',
    ' * {@link /path1 path2#}',
    ' */'
  ].join('\n'));
});
