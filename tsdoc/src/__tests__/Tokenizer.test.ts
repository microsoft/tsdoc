import { TSDocParser, DocComment } from '../index';
import { Tokenizer, Token, TokenKind } from '../api/Tokenizer';

function escape(s: string): string {
  return s.replace(/\n/g, '[n]')
    .replace(/\\/g, '[b]');
}

interface ISnapshotItem {
  indexOfLine: number;
  line: string;
  span: string;
  tokenKind: string;
}

function matchSnapshot(buffer: string): void {
  const tsdocParser: TSDocParser = new TSDocParser();
  const docComment: DocComment = tsdocParser.parseString(buffer);
  const tokenizer: Tokenizer = new Tokenizer(docComment.lines);

  const items: ISnapshotItem[] = [];
  const paddedSpace: string[]  = [ '',   ' ',  '  ',  '   ',  '    ' ];
  const paddedLArrow: string[] = [ '',   '>',  ' >',  '  >',  '   >' ];
  const paddedRArrow: string[] = [ '',   '<',  '< ',  '<  ',  '<   ' ];

  while (true) {
    const token: Token = tokenizer.getToken();

    let span: string = '';
    if (token.line.end > 0) {
      let i: number = token.line.pos - 1;
      while (i < token.range.pos - 1) {
        span += paddedSpace[escape(buffer[i]).length];
        ++i;
      }
      span += paddedLArrow[escape(buffer[i]).length];
      ++i;
      while (i < token.range.end) {
        span += paddedSpace[escape(buffer[i]).length];
        ++i;
      }
      if (i === token.line.end) {
        span += '<';
      } else {
        span += paddedRArrow[escape(buffer[i]).length];
        ++i;
        while (i < token.line.end) {
          span += paddedSpace[escape(buffer[i]).length];
          ++i;
        }

      }
    }

    items.push({
      indexOfLine: docComment.lines.indexOf(token.line),
      line: '>' + escape(token.line.toString()) + '<',
      span: span,
      tokenKind: TokenKind[token.kind]
    });

    if (token.kind === TokenKind.EndOfInput) {
      break;
    }
  }

  // Assert that getToken() should return EndOfInput repeatedly
  expect(tokenizer.getToken().kind).toEqual(TokenKind.EndOfInput);
  expect(tokenizer.getToken().kind).toEqual(TokenKind.EndOfInput);

  expect({
    buffer: escape(buffer),
    tokens: items
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
