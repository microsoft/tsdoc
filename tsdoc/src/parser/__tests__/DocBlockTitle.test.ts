// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { DocNodeKind, type DocBlock, type DocNode, DocPlainText } from '../../nodes';
import type { ParserContext } from '../ParserContext';
import { TSDocParser } from '../TSDocParser';

function parseExampleBlock(buffer: string): DocBlock {
  const parserContext: ParserContext = new TSDocParser().parseString(buffer);
  let exampleBlock: DocBlock | undefined;
  for (const block of parserContext.docComment.customBlocks) {
    if (block.blockTag.tagNameWithUpperCase === '@EXAMPLE') {
      exampleBlock = block;
      break;
    }
  }
  if (exampleBlock === undefined) {
    throw new Error('The comment did not contain an @example block');
  }
  return exampleBlock;
}

/**
 * Concatenates the plain text contained by a node subtree, so that a title's textual content can be
 * asserted without depending on the full excerpt structure.
 */
function getPlainText(node: DocNode): string {
  let result: string = '';
  if (node instanceof DocPlainText) {
    result += node.text;
  }
  for (const child of node.getChildNodes()) {
    result += getPlainText(child);
  }
  return result;
}

function getChildKinds(node: DocNode): ReadonlyArray<string> {
  return node.getChildNodes().map((child) => child.kind);
}

// An example with a title above a code sample.
test('title above a code sample', () => {
  const exampleBlock: DocBlock = parseExampleBlock(
    ['/**', ' * @example Adding two numbers', ' * ```ts', ' * add(1, 2);', ' * ```', ' */'].join('\n')
  );

  expect(exampleBlock.tagLineContent).toBeDefined();
  expect(getPlainText(exampleBlock.tagLineContent!)).toEqual('Adding two numbers');

  // The body is everything after the title; here that is the fenced code sample.
  expect(getChildKinds(exampleBlock.bodyContent)).toEqual([DocNodeKind.FencedCode]);
});

// An example with the whole content on the tag line.
test('title only, with no body', () => {
  const exampleBlock: DocBlock = parseExampleBlock(
    ['/**', ' * The CPU architecture.', ' * @example `"AMD64"`', ' */'].join('\n')
  );

  expect(exampleBlock.tagLineContent).toBeDefined();
  // The code span in the title is preserved as a DocCodeSpan node.
  expect(getChildKinds(exampleBlock.tagLineContent!)).toEqual([DocNodeKind.CodeSpan]);

  // The body has no renderable content.
  expect(exampleBlock.bodyContent.nodes).toHaveLength(0);
});

// An example with markup in the title.
test('title containing an inline tag', () => {
  const exampleBlock: DocBlock = parseExampleBlock(
    ['/**', ' * @example Using {@link add} on negative numbers', ' * Body text.', ' */'].join('\n')
  );

  expect(exampleBlock.tagLineContent).toBeDefined();
  // The "{@link add}" markup is preserved as a real DocLinkTag rather than flattened to literal text.
  expect(getChildKinds(exampleBlock.tagLineContent!)).toEqual([
    DocNodeKind.PlainText,
    DocNodeKind.LinkTag,
    DocNodeKind.PlainText
  ]);

  expect(getPlainText(exampleBlock.bodyContent)).toContain('Body text.');
});

// An example with content beginning on the next line has no title.
test('no title when content begins on the next line', () => {
  const exampleBlock: DocBlock = parseExampleBlock(
    ['/**', ' * @example', ' * Some example content.', ' */'].join('\n')
  );

  expect(exampleBlock.tagLineContent).toBeUndefined();
  expect(getPlainText(exampleBlock.bodyContent)).toContain('Some example content.');
});

// A tag line containing only whitespace is not a title.
test('no title when the tag line is only whitespace', () => {
  const exampleBlock: DocBlock = parseExampleBlock(
    ['/**', ' * @example   ', ' * Some example content.', ' */'].join('\n')
  );

  expect(exampleBlock.tagLineContent).toBeUndefined();
  expect(getPlainText(exampleBlock.bodyContent)).toContain('Some example content.');
});

// The title text is trimmed of surrounding whitespace.
test('title is trimmed of surrounding whitespace', () => {
  const exampleBlock: DocBlock = parseExampleBlock(
    ['/**', ' * @example    Trimmed title   ', ' * Content.', ' */'].join('\n')
  );

  expect(exampleBlock.tagLineContent).toBeDefined();
  expect(getPlainText(exampleBlock.tagLineContent!)).toEqual('Trimmed title');
});

// A title with body prose on the immediately following line (no blank line).
test('body prose on the next line is re-wrapped into a paragraph', () => {
  const exampleBlock: DocBlock = parseExampleBlock(
    ['/**', ' * @example A title', ' * Body prose here.', ' */'].join('\n')
  );

  expect(getPlainText(exampleBlock.tagLineContent!)).toEqual('A title');
  expect(getChildKinds(exampleBlock.bodyContent)).toEqual([DocNodeKind.Paragraph]);
  expect(getPlainText(exampleBlock.bodyContent)).toEqual('Body prose here.');
});

// A title separated from the body by a blank line.
test('body separated from the title by a blank line', () => {
  const exampleBlock: DocBlock = parseExampleBlock(
    ['/**', ' * @example A title', ' *', ' * Body paragraph.', ' */'].join('\n')
  );

  expect(getPlainText(exampleBlock.tagLineContent!)).toEqual('A title');
  expect(getChildKinds(exampleBlock.bodyContent)).toEqual([DocNodeKind.Paragraph]);
  expect(getPlainText(exampleBlock.bodyContent)).toEqual('Body paragraph.');
});

// Multiple @example blocks are parsed independently.
test('multiple example blocks each expose their own title and body', () => {
  const parserContext: ParserContext = new TSDocParser().parseString(
    ['/**', ' * @example First example', ' * Content 1.', ' * @example', ' * Content 2.', ' */'].join('\n')
  );
  const exampleBlocks: DocBlock[] = [];
  for (const block of parserContext.docComment.customBlocks) {
    if (block.blockTag.tagNameWithUpperCase === '@EXAMPLE') {
      exampleBlocks.push(block);
    }
  }

  expect(exampleBlocks).toHaveLength(2);

  expect(getPlainText(exampleBlocks[0].tagLineContent!)).toEqual('First example');
  expect(getPlainText(exampleBlocks[0].bodyContent)).toContain('Content 1.');

  expect(exampleBlocks[1].tagLineContent).toBeUndefined();
  expect(getPlainText(exampleBlocks[1].bodyContent)).toContain('Content 2.');
});

// Policy: the title is "the first paragraph up to its first line break". TSDoc inline tags are
// permitted to span multiple lines (see the multi-line "{@link}" fixtures in NodeParserLinkTag.test.ts),
// and the newlines inside a tag are absorbed as the tag's own spacing rather than emitted as paragraph
// SoftBreaks. Therefore an inline tag that opens on the tag line but closes on a later line is a single
// node with no intervening SoftBreak, so the title legitimately extends across those lines up to where
// the tag closes. This matches the author's intent of writing one continuous tag, so we treat it as
// title content rather than truncating the tag mid-way.
test('title with an inline tag that spans multiple lines', () => {
  const exampleBlock: DocBlock = parseExampleBlock(
    ['/**', ' * @example Using {@link', ' * Foo} directly', ' * Body text.', ' */'].join('\n')
  );

  expect(getChildKinds(exampleBlock.tagLineContent!)).toEqual([
    DocNodeKind.PlainText,
    DocNodeKind.LinkTag,
    DocNodeKind.PlainText
  ]);
  expect(getPlainText(exampleBlock.tagLineContent!)).toEqual('Using  directly');

  // The body begins only after the tag closes and the first paragraph-level line break is reached.
  expect(getPlainText(exampleBlock.bodyContent)).toEqual('Body text.');
});
