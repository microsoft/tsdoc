import {
  CoreModifierTagSet,
  DocComment,
  ParserContext
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
  const modifierTagSet: CoreModifierTagSet = docComment.modifierTagSet;

  expect(modifierTagSet.isAlpha).toEqual(false);
  expect(modifierTagSet.isBeta).toEqual(true);
  expect(modifierTagSet.isInternal).toEqual(true);
});
