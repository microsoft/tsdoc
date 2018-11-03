import { TestHelpers } from '../parser/__tests__/TestHelpers';
import { ParagraphSplitter } from '../parser/ParagraphSplitter';
import { DocSection, DocPlainText, DocSoftBreak, DocParagraph, DocBlockTag } from '../index';
import { TSDocConfiguration } from '../configuration/TSDocConfiguration';

test('01 Basic paragraph splitting', () => {
  TestHelpers.parseAndMatchDocCommentSnapshot([
    '/**',
    ' *    ',
    ' * This is the',
    ' * first paragraph.',
    ' *   \t   ',
    ' *  ',
    ' *   \t   ',
    ' * This is the second paragraph.',
    ' *',
    ' * This is the third paragraph.',
    ' *',
    ' *   ',
    ' */'
  ].join('\n'));
});

test('02 Basic paragraph splitting in blocks', () => {
  TestHelpers.parseAndMatchDocCommentSnapshot([
    '/**',
    ' * P1',
    ' * @remarks P2',
    ' *',
    ' * P3 @deprecated P4',
    ' *',
    ' * P5',
    ' */'
  ].join('\n'));
});

test('03 Degenerate comment framing', () => {
  TestHelpers.parseAndMatchDocCommentSnapshot([
    '/** line 1',
    ' * line 2',
    '',
    ' *   @public line 3*/'
  ].join('\n'));
});

test('04 Degenerate manually constructed nodes', () => {
  const configuration: TSDocConfiguration = new TSDocConfiguration();

  const docSection: DocSection = new DocSection({ configuration },
    [
      new DocParagraph({ configuration },
        [
          new DocPlainText({ configuration, text: '  para 1 ' }),
          new DocSoftBreak({ configuration }),
          new DocPlainText({ configuration, text: '   ' }),
          new DocSoftBreak({ configuration }),
          new DocPlainText({ configuration, text: ' \t  ' }),
          new DocPlainText({ configuration, text: '   ' }),
          new DocBlockTag( { configuration, tagName: '@public' }),
          new DocPlainText({ configuration, text: '  para 2 ' }),
          new DocSoftBreak({ configuration }),
          new DocSoftBreak({ configuration }),
          new DocPlainText({ configuration, text: '  para 3  ' })
        ]
      ),
      // Currently we do not discard empty paragraphs
      new DocParagraph({ configuration })
    ]
  );

  ParagraphSplitter.splitParagraphsForSection(docSection);
  expect(TestHelpers.getDocNodeSnapshot(docSection)).toMatchSnapshot();
});
