import {
  StandardModifierTagSet,
  DocComment,
  ParserContext,
  TSDocParserConfiguration,
  TSDocTagDefinition,
  TSDocTagSyntaxKind
} from '../index';
import { TestHelpers } from '../parser/__tests__/TestHelpers';

test('01 Simple @beta and @internal extraction', () => {
  const parserContext: ParserContext = TestHelpers.parseAndMatchDocCommentSnapshot([
    '/**',
    ' * START @beta',
    ' * @unknownTag',
    ' * @internal @internal END',
    ' */'
  ].join('\n'));

  const docComment: DocComment = parserContext.docComment;
  const modifierTagSet: StandardModifierTagSet = docComment.modifierTagSet;

  expect(modifierTagSet.isAlpha()).toEqual(false);
  expect(modifierTagSet.isBeta()).toEqual(true);
  expect(modifierTagSet.isInternal()).toEqual(true);
});

test('02 A basic TSDoc comment with common components', () => {
  const configuration: TSDocParserConfiguration = new TSDocParserConfiguration();
  configuration.addTagDefinitions([
    new TSDocTagDefinition({
      tagName: '@customBlock',
      syntaxKind: TSDocTagSyntaxKind.BlockTag
    }),
    new TSDocTagDefinition({
      tagName: '@customModifier',
      syntaxKind: TSDocTagSyntaxKind.ModifierTag
    })
  ]);

  const parserContext: ParserContext = TestHelpers.parseAndMatchDocCommentSnapshot([
    '/**',
    ' * Returns the average of two numbers.',
    ' *',
    ' * @remarks',
    ' * This method is part of the {@link core-library#Statistics | Statistics subsystem}.',
    ' *',
    ' * @customBlock',
    ' * This is a custom block containing an @undefinedBlockTag',
    ' *',
    ' * @param x - The first input number',
    ' * @param y - The second input number',
    ' * @returns The arithmetic mean of `x` and `y`',
    ' *',
    ' * @beta @customModifier',
    ' */'
  ].join('\n'), configuration);

  const docComment: DocComment = parserContext.docComment;
  expect(docComment.modifierTagSet.hasTagName('@customModifier')).toEqual(true);
});

test('03 Jumbled order', () => {
  const configuration: TSDocParserConfiguration = new TSDocParserConfiguration();
  configuration.addTagDefinitions([
    new TSDocTagDefinition({
      tagName: '@customBlock',
      syntaxKind: TSDocTagSyntaxKind.BlockTag
    }),
    new TSDocTagDefinition({
      tagName: '@customModifier',
      syntaxKind: TSDocTagSyntaxKind.ModifierTag
    })
  ]);

  const parserContext: ParserContext = TestHelpers.parseAndMatchDocCommentSnapshot([
    '/**',
    ' * Returns the average of two numbers. @remarks This method is part of the',
    ' * {@link core-library#Statistics | Statistics subsystem}.',
    ' * @beta @customModifier',
    ' * @returns The arithmetic mean of `x` and `y`',
    ' * @param x - The first input number @param y - The second input number',
    ' * @customBlock',
    ' * This is a custom block containing an @undefinedBlockTag',
    ' */'
  ].join('\n'), configuration);

  const docComment: DocComment = parserContext.docComment;
  expect(docComment.modifierTagSet.hasTagName('@customModifier')).toEqual(true);
});

test('03 Incomplete @param blocks', () => {
  TestHelpers.parseAndMatchDocCommentSnapshot([
    '/**',
    ' * @param - The first input number',
    ' * @param y The second input number',
    ' * @returns The arithmetic mean of `x` and `y`',
    ' */'
  ].join('\n'));
});

test('04 typeParam blocks', () => {
  TestHelpers.parseAndMatchDocCommentSnapshot([
    '/**',
    ' * Constructs a map from a JavaScript object',
    ' *',
    ' * @typeParam K - The generic type parameter indicating the key type',
    ' * @param jsonObject - The input object',
    ' * @typeParam V - The generic type parameter indicating the value type',
    ' * @returns The map',
    ' */'
  ].join('\n'));
});
