import { TSDocParser } from '../TSDocParser';
import { DocComment } from '../../nodes';
import { Tokenizer } from '../Tokenizer';
import { Token, TokenKind }  from '../Token';
import { TestHelpers } from './TestHelpers';

interface ISnapshotItem {
  indexOfLine: number;
  line: string;
  span: string;
  tokenKind: string;
}

function matchSnapshot(buffer: string): void {
  const tsdocParser: TSDocParser = new TSDocParser();
  const docComment: DocComment = tsdocParser.parseString(buffer);
  const tokens: Token[] = Tokenizer.readTokens(docComment.lines);

  const items: ISnapshotItem[] = [];

  for (const token of tokens) {
    items.push({
      indexOfLine: docComment.lines.indexOf(token.line),
      line: '>' + TestHelpers.getEscaped(token.line.toString()) + '<',
      span: TestHelpers.formatLineSpan(token.line, token.range),
      tokenKind: TokenKind[token.kind]
    });

    if (token.kind === TokenKind.EndOfInput) {
      break;
    }
  }

  expect({
    buffer: escape(buffer),
    tokens: items
  }).toMatchSnapshot();
}

test('Tokenizer.isPunctuation()', () => {
  expect(Tokenizer.isPunctuation(TokenKind.OtherPunctuation)).toEqual(true);
  expect(Tokenizer.isPunctuation(TokenKind.DoubleQuote)).toEqual(true);
  expect(Tokenizer.isPunctuation(TokenKind.Slash)).toEqual(true);

  expect(Tokenizer.isPunctuation(TokenKind.EndOfInput)).toEqual(false);
  expect(Tokenizer.isPunctuation(TokenKind.Spacing)).toEqual(false);
  expect(Tokenizer.isPunctuation(TokenKind.AsciiWord)).toEqual(false);
});

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

test('04 General characters', () => {
  matchSnapshot([
    '/**',
    ' * !"#$%&\'()*+,\-.\/:;<=>?@[]^_`{|}~',
    ' */'
  ].join('\n'));
});

test('05 Spacing characters', () => {
  matchSnapshot([
    '/**',
    ' * space:  tab: \t  form feed: \f end',
    ' */'
  ].join('\n'));
});
