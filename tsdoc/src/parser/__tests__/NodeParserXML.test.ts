import { TSDocConfiguration } from '../../configuration/TSDocConfiguration';
import { TestHelpers } from './TestHelpers';

// TODO: Tests
test('01 XML single tags, positive', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(
    [
      '/**',
      ' * <tag/>',
      ' * <tag-a />',
      ' * <tag-b /><tag-c />',
      ' * <tag-d',
      ' * />',
      ' * <tag-e',
      ' *      />  ',
      ' */'
    ].join('\n')
  );
});

test('02 HTML start tags: with attributes, positive', () => {
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

test('03 XML start tags: with attributes, negative', () => {
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

test('04 XML singular elements, negative', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(['/**', ' * <tag>', ' */'].join('\n'));

  TestHelpers.parseAndMatchNodeParserSnapshot(['/**', ' * </tag>', ' */'].join('\n'));

  TestHelpers.parseAndMatchNodeParserSnapshot(['/**', ' * <tag-b>', ' */'].join('\n'));

  TestHelpers.parseAndMatchNodeParserSnapshot(['/**', ' * <tag       >', ' */'].join('\n'));

  TestHelpers.parseAndMatchNodeParserSnapshot(['/**', ' * <tag-c', ' * >', ' */'].join('\n'));
});

test('05 basic nested elements, positive', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * <tag>', ' *   <tag-a />', ' * </tag>', ' */'].join('\n')
  );

  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * <tag>', ' *   <tag-a></tag-a>', ' * </tag>', ' */'].join('\n')
  );
});

test('06 basic nested elements, negative', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * <tag>', ' *   </tag>', ' * </tag>', ' */'].join('\n')
  );

  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * <tag>', ' *   <><>', ' * </tag>', ' */'].join('\n')
  );
});

test('07 Sibling nested elements, positive', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * <tag>', ' *   <tag-a />', ' *   <tag-b />', ' * </tag>', ' */'].join('\n')
  );

  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * <tag>', ' *   <tag-a></tag-a>', ' *   <tag-b></tag-b>', ' * </tag>', ' */'].join('\n')
  );
});

test('08 Sibling nested elements, negative', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * <tag>', ' *   <tag-a />', ' *   </tag>', ' * </tag>', ' */'].join('\n')
  );

  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * <tag>', ' *   <tag-a />', ' *   <tag-b />', ' *   </tag>', ' * </tag>', ' */'].join('\n')
  );
});

test('09 Nested elements with attributes, positive', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * <tag>', ' *   <tag-a attr="value" />', ' * </tag>', ' */'].join('\n')
  );

  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * <tag>', ' *   <tag-a attr="value"></tag-a>', ' * </tag>', ' */'].join('\n')
  );
});

test('10 Nested elements with attributes, negative', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * <tag>', ' *   <tag-a attr=value />', ' *   <tag-b attr="value />', ' * </tag>', ' */'].join(
      '\n'
    )
  );

  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * <tag>', ' *   <attr="value" />', ' * </tag>', ' */'].join('\n')
  );
});

test('11 nested text elements, positive', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(['/**', ' * <tag>', ' *   foo', ' * </tag>', '*/'].join('\n'));
  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * <tag>', ' *   <tag-a>', ' *     foo', ' *   </tag-a>', ' * </tag>', ' */'].join('\n')
  );
});

test('12 nested text elements, negative', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * <tag>', ' *   <tag-a>', ' *     foo <', ' *   </tag-a>', ' * </tag>', ' */'].join('\n')
  );

  TestHelpers.parseAndMatchNodeParserSnapshot(
    [
      '/**',
      ' * <tag>',
      ' *   <tag-a>',
      ' *     foo<',
      ' *     <tag-b>',
      ' *     </tag-b>',
      ' *   </tag-a>',
      ' * </tag>',
      ' */'
    ].join('\n')
  );
});

test('13 Closing tags, positive', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * </tag-a>', ' * </tag-b  >', ' * </tag-c', ' *   >', ' */'].join('\n')
  );
});

test('14 Closing tags, negative', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * </tag-a/>', ' * </ tag-b>', ' * </tag-c', ' */'].join('\n')
  );
});

test('15 Unusual XML names, positive', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * <a1/>', ' * <a-a>', ' * <a--9->', ' */'].join('\n')
  );
});

test('16 Unusual XML names, negative', () => {
  TestHelpers.parseAndMatchNodeParserSnapshot(['/**', ' * <1a/>', ' * <a.a>', ' * <_a>', ' */'].join('\n'));
});

test('17 Supported XML elements, positive', () => {
  const config: TSDocConfiguration = new TSDocConfiguration();
  config.setSupportedXmlElements(['a', 'b', 'c']);

  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * <a>', ' * <b/>', ' * </c>', ' */'].join('\n'),
    config
  );
});

test('18 Supported XML elements, negative', () => {
  const config: TSDocConfiguration = new TSDocConfiguration();
  config.setSupportedXmlElements(['d']);
  config.validation.reportUnsupportedXmlElements = true;

  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * <a>', ' * <b>', ' * <c>', ' */'].join('\n'),
    config
  );
});

test('19 Forbidding all XML elements, negative', () => {
  const config: TSDocConfiguration = new TSDocConfiguration();
  config.setSupportedXmlElements([]);
  config.validation.reportUnsupportedXmlElements = true;

  TestHelpers.parseAndMatchNodeParserSnapshot(
    ['/**', ' * <a>', ' * <b>', ' * <c>', ' */'].join('\n'),
    config
  );
});
