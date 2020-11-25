import { TestHelpers } from './TestHelpers';

test('00 Simple member references: positive examples', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(
    [
      '/**',
      ' * {@link Class1}',
      ' * {@link Class2.member2}',
      ' * {@link namespace3 . namespace4 ',
      ' *        . namespace5 | link text}',
      ' */'
    ].join('\n')
  );
});

test('01 Simple member references: negative examples', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * {@link Class1..member2}', ' * {@link .member3}', ' * {@link member4.}', ' */'].join('\n')
  );
});

test('02 System selectors: positive examples', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(
    [
      '/**',
      ' * {@link (Class1:class)}',
      ' * {@link (Class2:class).(member3:static)}',
      ' * {@link Class4.(member5:static)}',
      ' * {@link (Class6:class ) . ( member7:static)}',
      ' */'
    ].join('\n')
  );
});

test('03 System selectors: negative examples', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(
    [
      '/**',
      ' * {@link (Class1:class}',
      ' * {@link (Class2:class))}',
      ' * {@link (Class3::class)}',
      ' * {@link (Class4 class)}',
      ' * {@link (member5:badname)}',
      ' * {@link (Class6:class)(member:static)}',
      ' * {@link Class7:class}',
      ' */'
    ].join('\n')
  );
});

test('04 Label selectors: positive examples', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * {@link (Class1:LABEL1)}', ' * {@link ( function2 : MY_LABEL2 ) }', ' */'].join('\n')
  );
});

test('05 Label selectors: negative examples', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * {@link (Class1:Label)}', ' * {@link (Class2:SPAß)}', ' */'].join('\n')
  );
});

test('06 Index selectors: positive examples', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(['/**', ' * {@link (function2 : 3 )}', ' */'].join('\n'));
});

test('07 Index selectors: negative examples', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(['/**', ' * {@link (function2:03)}', ' */'].join('\n'));
});

test('08 Unusual identifiers: positive examples', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(['/**', ' * {@link Class$_1 . $_1member}', ' */'].join('\n'));
});

test('09 Unusual identifiers: negative examples', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(['/**', ' * {@link Class-1}', ' */'].join('\n'));
});

test('10 Quoted identifiers: positive examples', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(
    [
      '/**',
      ' * {@link "static"}',
      ' * {@link Class1 . "member"}',
      ' * {@link Class2."|" | link text}',
      ' */'
    ].join('\n')
  );
});

test('11 Quoted identifiers: negative examples', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(
    [
      '/**',
      ' * {@link "static}',
      ' * {@link Class1.""}',
      ' * {@link Class2.interface}',
      ' * {@link Class3.1}',
      ' */'
    ].join('\n')
  );
});
