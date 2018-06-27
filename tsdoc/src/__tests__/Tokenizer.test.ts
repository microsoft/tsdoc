import { TSDocParser, DocComment } from '../index';
import { Tokenizer, Token, TokenKind } from '../api/Tokenizer';

function escape(s: string): string {
  return s.replace(/\n/g, '[n]');
}

function matchSnapshot(buffer: string): void {
  const tsdocParser: TSDocParser = new TSDocParser();
  const docComment: DocComment = tsdocParser.parseString(buffer);
  const tokenizer: Tokenizer = new Tokenizer(docComment.lines);

  const tokens: Token[] = [];

  while (true) {
    const token: Token = tokenizer.getToken();
    if (token.kind === TokenKind.EndOfInput) {
      break;
    }
    tokens.push(token);
  }

  expect(tokens.map(token => {
    return {
      tokenKind: TokenKind[token.kind],
      range: escape(token.range.getDebugDump('|', '|'))
    };
  })).toMatchSnapshot();
}

test('test', () => {
  const buffer: string = [
    '/**',
    ' * line 1 ', // extra space at end of line
    ' * line 2',
    ' */'
  ].join('\n');
  matchSnapshot(buffer);
});
