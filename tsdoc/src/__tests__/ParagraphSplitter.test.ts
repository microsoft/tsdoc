import { TestHelpers } from '../parser/__tests__/TestHelpers';
import { ParagraphSplitter } from '../parser/ParagraphSplitter';
import { DocSection, DocPlainText, DocSoftBreak, DocParagraph, DocBlockTag } from '../index';

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

test('02 Degenerate paragraph', () => {
  TestHelpers.parseAndMatchDocCommentSnapshot([
    '/** line 1',
    ' * line 2',
    '',
    ' *   @public line 3*/'
  ].join('\n'));
});

test('03 Degenerate manually constructed nodes', () => {
  const docSection: DocSection = new DocSection({ });

  const docParagraph: DocParagraph = new DocParagraph({ } );
  docParagraph.appendNodes([
    new DocPlainText({ text: '  para 1 ' }),
    new DocSoftBreak({ }),
    new DocPlainText({ text: '   ' }),
    new DocSoftBreak({ }),
    new DocPlainText({ text: ' \t  ' }),
    new DocPlainText({ text: '   ' }),
    new DocBlockTag({ tagName: '@public' }),
    new DocPlainText({ text: '  para 2 ' }),
    new DocSoftBreak({ }),
    new DocSoftBreak({ }),
    new DocPlainText({ text: '  para 3  ' })
  ]);

  docSection.appendNode(docParagraph);

  // Currently we do not discard empty paragraphs
  docSection.appendNode(new DocParagraph({ }));

  ParagraphSplitter.splitParagraphsForSection(docSection);
  expect(TestHelpers.getDocNodeSnapshot(docSection)).toMatchSnapshot();
});
