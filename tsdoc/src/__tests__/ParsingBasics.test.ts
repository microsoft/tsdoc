import {
  CoreModifierTagSet,
  DocComment,
  ParserContext
} from '../index';
import { TestHelpers } from '../parser/__tests__/TestHelpers';
import { TSDocParserConfiguration, TSDocTagDefinition, TSDocTagSyntaxKind } from '../parser/TSDocParserConfiguration';

test('01 Simple @beta and @internal extraction', () => {
  const parserContext: ParserContext = TestHelpers.parseAndMatchDocCommentSnapshot([
    '/**',
    ' * START @beta',
    ' * @unknownTag',
    ' * @internal @internal END',
    ' */'
  ].join('\n'));

  const docComment: DocComment = parserContext.docComment;
  const modifierTagSet: CoreModifierTagSet = docComment.modifierTagSet;

  expect(modifierTagSet.isAlpha).toEqual(false);
  expect(modifierTagSet.isBeta).toEqual(true);
  expect(modifierTagSet.isInternal).toEqual(true);
});

test('02 A basic TSDoc comment with all components', () => {
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
    ' * Adds two numbers together.',
    ' *',
    ' * @remarks',
    ' * This method is part of the {@link core-libary/Math | Math subsystem}.',
    ' *',
    ' * @customBlock',
    ' * This is a custom block containing an @undefinedBlockTag',
    ' *',
    ' * @param x - The first number to add',
    ' * @param y - The second number to add',
    ' * @returns The sum of `x` and `y`',
    ' *',
    ' * @beta @customModifier',
    ' */'
  ].join('\n'), configuration);

  const docComment: DocComment = parserContext.docComment;
  expect(docComment.modifierTagSet.hasModifierTag('@customModifier')).toEqual(true);
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
    ' * Adds two numbers together. @remarks This method is part of the',
    ' * {@link core-libary/Math | Math subsystem}.',
    ' * @beta @customModifier',
    ' * @returns The sum of `x` and `y`',
    ' * @param x - The first number to add @param y - The second number to add',
    ' * @customBlock',
    ' * This is a custom block containing an @undefinedBlockTag',
    ' */'
  ].join('\n'), configuration);

  const docComment: DocComment = parserContext.docComment;
  expect(docComment.modifierTagSet.hasModifierTag('@customModifier')).toEqual(true);
});

test('03 Incomplete @param blocks', () => {
  TestHelpers.parseAndMatchDocCommentSnapshot([
    '/**',
    ' * @param - The first number to add',
    ' * @param y The first number to add',
    ' * @returns The sum of `x` and `y`',
    ' */'
  ].join('\n'));
});
