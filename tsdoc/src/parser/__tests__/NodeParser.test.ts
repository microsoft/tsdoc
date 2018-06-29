import { TSDocParser } from '../TSDocParser';
import { DocComment, DocNodeKind } from '../../nodes';
import { TokenKind } from '../Tokenizer';

function escape(s: string): string {
  return s.replace(/\n/g, '[n]')
    .replace(/\\/g, '[b]');
}

interface ISnapshotItem {
  nodeKind: string;
  tokens: { tokenKind: string, value: string }[];
}

function matchSnapshot(buffer: string): void {
  const tsdocParser: TSDocParser = new TSDocParser();
  const docComment: DocComment = tsdocParser.parseString(buffer);

  const items: ISnapshotItem[] = [];
  for (const node of docComment.nodes) {
    const item: ISnapshotItem = {
      nodeKind: DocNodeKind[node.kind],
      tokens: node.tokens.map((token) => {
        return {
          tokenKind: TokenKind[token.kind],
          value: escape(token.toString())
        };
      })
    };
    items.push(item);
  }

  expect({
    buffer: escape(buffer),
    lines: docComment.lines.map(x => escape(x.toString())),
    nodes: items
  }).toMatchSnapshot();
}

test('00 Tokenizer simple case', () => {
  matchSnapshot([
    '/**',
    ' * line 1 ', // extra space at end of line
    ' * line 2',
    ' */'
  ].join('\n'));
});

test('01 Tokenizer degenerate cases', () => {
  matchSnapshot('/***/');

  matchSnapshot([
    '/**',
    ' *',
    ' */'
  ].join('\n'));

  matchSnapshot([
    '/**',
    ' ',
    ' ',
    ' */'
  ].join('\n'));

});

test('02 Backslash escapes: positive examples', () => {
  matchSnapshot([
    '/**',
    ' * \\$\\@param',
    ' */'
  ].join('\n'));
});

test('03 Backslash escapes: negative examples', () => {
  matchSnapshot([
    '/**',
    ' * letter: \\A space: \\  end of line: \\',
    ' */'
  ].join('\n'));
});

test('04 Block tags: positive examples', () => {
  matchSnapshot([
    '/**',
    ' * @one @TWO @thRee',
    ' */'
  ].join('\n'));
});

test('05 Block tags: negative examples', () => {
  matchSnapshot([
    '/**',
    ' * @ @@',
    ' * @one@two',
    ' * \\@three',
    ' * @four, @five\\a',
    ' */'
  ].join('\n'));
});
