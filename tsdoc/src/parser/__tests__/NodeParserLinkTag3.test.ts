import { TestHelpers } from './TestHelpers';

test('00 Symbol references: positive examples', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot([
    '/**',
    ' * {@link Class1.[WellknownSymbols.toStringPrimitive]}',
    ' * {@link Class1 . ( [ WellknownSymbols . toStringPrimitive ] : static) | link text}',
    ' */'
  ].join('\n'));
});

test('01 Symbol references: negative examples', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot([
    '/**',
    ' * {@link Class1.[WellknownSymbols.toStringPrimitive}',
    ' * {@link Class1.[]}',
    ' */'
  ].join('\n'));
});

test('02 Complicated examples', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot([
    '/**',
    ' * {@link ./lib/controls/Button#Button.([(WellknownSymbols:namespace).toStringPrimitive]:instance)}',
    ' */'
  ].join('\n'));
});
