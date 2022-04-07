import { TSDocConfiguration } from '../../configuration/TSDocConfiguration';
import { TestHelpers } from './TestHelpers';

test('01 HTML start tags: simple, positive', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(
    [
      '/**',
      ' * <tag/>',
      ' * <tag-a />',
      ' * <tag-b ><tag-c />',
      ' * <tag-d',
      ' * >',
      ' * <tag-e',
      ' *      />  ',
      ' */'
    ].join('\n')
  );
});

test('02 HTML start tags: simple, negative', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * < tag/>', ' * <tag -a />', ' * <tag-b /<tag-c / >', ' * <tag-d', ' */'].join('\n')
  );
});

test('03 HTML start tags: with attributes, positive', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * <tag-a attr-one="one" >', ' * <tag-b', ' *   attr-two', ' *   = "2"', ' * />', ' */'].join(
      '\n'
    )
  );
  TestHelpers.parseAndMatchNodeParserSnapshot(
    [
      '/**',
      ' * <tag-c attr-three="3" four=\'4\'/>',
      ' * <tag-d',
      ' *   attr-five',
      ' *   = "5"',
      ' *   six',
      " *   = '6'",
      ' * />',
      ' */'
    ].join('\n')
  );
  TestHelpers.parseAndMatchNodeParserSnapshot(
    [
      '/**',
      ' * <tag-e attr-one="one" two=\'two\'/>',
      ' * <tag-f',
      ' *   attr-one',
      ' *   = "one"',
      ' *   two',
      " *   = 'two'",
      ' * />',
      ' */'
    ].join('\n')
  );
});

test('04 HTML start tags: with attributes, negative', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(
    [
      '/**',
      ' * <tag-a attr -one="one" />',
      ' * <tag-b attr- two="two" />',
      ' * <tag-c attr-three=\'three" />',
      ' * <tag-d attr-four=@"four" />',
      ' * <tag-e attr-five@="five" />',
      ' * <tag-f attr-six="six"seven="seven" />',
      ' */'
    ].join('\n')
  );
  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * <tag-g attr="multi', ' * line" />', ' */'].join('\n')
  );
});

test('05 Eclipsed TSDoc', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(['/**', ' * <tag attr-one="@tag" />', ' */'].join('\n'));
});

test('06 Closing tags, positive', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * </tag-a>', ' * </tag-b  >', ' * </tag-c', ' *   >', ' */'].join('\n')
  );
});

test('07 Closing tags, negative', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * </tag-a/>', ' * </ tag-b>', ' * </tag-c', ' */'].join('\n')
  );
});

test('08 Unusual HTML names, positive', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * <a1/>', ' * <a-a>', ' * <a--9->', ' */'].join('\n')
  );
});

test('09 Unusual HTML names, negative', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(['/**', ' * <1a/>', ' * <a.a>', ' * <_a>', ' */'].join('\n'));
});

test('10 Supported HTML elements, positive', () => {
  const config: TSDocConfiguration = new TSDocConfiguration();
  config.setSupportedHtmlElements(['a', 'b', 'c']);

  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * <a>', ' * <b/>', ' * </c>', ' */'].join('\n'),
    config
  );
});

test('11 Supported HTML elements, negative', () => {
  const config: TSDocConfiguration = new TSDocConfiguration();
  config.setSupportedHtmlElements(['d']);
  config.validation.reportUnsupportedHtmlElements = true;

  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * <a>', ' * <b>', ' * <c>', ' */'].join('\n'),
    config
  );
});

test('12 Forbidding all HTML elements, negative', () => {
  const config: TSDocConfiguration = new TSDocConfiguration();
  config.setSupportedHtmlElements([]);
  config.validation.reportUnsupportedHtmlElements = true;

  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * <a>', ' * <b>', ' * <c>', ' */'].join('\n'),
    config
  );
});
