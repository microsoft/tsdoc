import { TestHelpers } from './TestHelpers';

test('00 Block tags: positive examples', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(['/**', ' * @one ', ' * @two', ' */'].join('\n'));
});

test('01 Block tags: negative examples', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * @ one ', ' * +@two ', ' * @two+ ', ' */'].join('\n')
  );
});

test('02 Inline tags: simple, positive', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * {@one} ', ' * {@two } ', ' * {@three}{@four} ', ' * {@five ', ' *   } ', ' */'].join('\n')
  );
});

test('03 Inline tags: simple, negative', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * {@ one} ', ' * {@two~} ', ' * { @three} ', ' * {@four', ' */'].join('\n')
  );
});

test('04 Inline tags: complex, positive', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * {@one some content}', ' * {@two multi', ' * line}', ' */'].join('\n')
  );
  TestHelpers.parseAndMatchNodeParserSnapshot(['/**', ' * {@three @taglike}', ' */'].join('\n'));
});

test('05 Inline tags: escaping, positive', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * {@one left \\{ right \\} backslash \\\\ }', ' */'].join('\n')
  );
});

test('06 Inline tags: escaping, negative', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(['/**', ' * {@one curly\\}', ' */'].join('\n'));
  TestHelpers.parseAndMatchNodeParserSnapshot(['/**', ' * {@two curly{}}', ' */'].join('\n'));
  TestHelpers.parseAndMatchNodeParserSnapshot(['/**', ' * three: }', ' */'].join('\n'));
});
