// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { type ParserContext, TSDocParser } from '..';
import { TestHelpers } from '../parser/__tests__/TestHelpers';
import { type DocParagraph, type DocNode, DocNodeKind } from '../nodes';
import { DocNodeTransforms } from '../transforms/DocNodeTransforms';

test('01 trimSpacesInParagraphNodes()', () => {
  const buffer: string = [
    '/**',
    ' *',
    ' *    This \t is    the',
    ' * first   {@mylink}sentence.',
    ' *         This is another',
    ' *sentence.  ',
    ' */'
  ].join('\n');

  const tsdocParser: TSDocParser = new TSDocParser();
  const parserContext: ParserContext = tsdocParser.parseString(buffer);
  const firstNode: DocNode = parserContext.docComment.summarySection.nodes[0];
  expect(firstNode.kind).toEqual(DocNodeKind.Paragraph);
  const paragraph: DocParagraph = firstNode as DocParagraph;
  const transformedParagraph: DocParagraph = DocNodeTransforms.trimSpacesInParagraph(paragraph);
  expect(TestHelpers.getDocNodeSnapshot(transformedParagraph)).toMatchSnapshot();
});
