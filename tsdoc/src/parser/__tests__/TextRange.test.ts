import { TextRange } from '../TextRange';
import { TestHelpers } from './TestHelpers';

function matchSnapshot(textRange: TextRange): void {
  for (let i: number = -1; i <= textRange.end + 1; ++i) {

    // Show the current character
    const c: string = TestHelpers.getEscaped(textRange.buffer.substr(Math.max(i, 0), 1));

    // Show the next 10 characters of context
    const context: string = TestHelpers.getEscaped(textRange.buffer.substr(Math.max(i, 0), 10));

    expect({
      c: c,
      context: context,
      i: i,
      location: textRange.getLocation(i)
    }).toMatchSnapshot();
  }
}

test('construction scenarios', () => {
  const buffer: string = '0123456789';
  const textRange: TextRange = TextRange.fromString(buffer);
  expect(textRange.toString()).toEqual(buffer);

  const subRange: TextRange = textRange.getNewRange(3, 6);
  expect(subRange).toMatchSnapshot('subRange');
});

test('getLocation() basic', () => {
  const textRange: TextRange = TextRange.fromString([
    'L1',
    'L2',
    '', // (line 3 is blank)
    'L4',
    'L5+CR\rL5+CRLF\r\nL6+LFCR\n\rL7'
  ].join('\n'));
  matchSnapshot(textRange);
});

test('getLocation() empty string', () => {
  const textRange: TextRange = TextRange.fromString('');
  matchSnapshot(textRange);
});

test('getLocation() CR string', () => {
  const textRange: TextRange = TextRange.fromString('\r');
  matchSnapshot(textRange);
});

test('getLocation() LF string', () => {
  const textRange: TextRange = TextRange.fromString('\n');
  matchSnapshot(textRange);
});

test('getLocation() tab characters', () => {
  // Tab character advances by only one column
  const textRange: TextRange = TextRange.fromString('1\t3');
  matchSnapshot(textRange);
});
