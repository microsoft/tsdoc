import { TextRange } from '../index';

function matchSnapshot(textRange: TextRange): void {
  for (let i: number = -1; i <= textRange.end + 1; ++i) {
      // Show the next 10 characters
    const context: string = textRange.buffer.substr(Math.max(i, 0), 10)
      .replace(/\n/g, '[n]').replace(/\r/g, '[r]');

    expect({
      i: i,
      c: textRange.buffer[i],
      context: context,
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

test('location calculation', () => {
  const textRange: TextRange = TextRange.fromString([
    'L1',
    'L2',
    '', // (line 3 is blank)
    'L4',
    'L5+CR\rL5+CRLF\r\nL6+LFCR\n\rL7'
  ].join('\n'));
  matchSnapshot(textRange);
});

test('location calculation empty string', () => {
  const textRange: TextRange = TextRange.fromString('');
  matchSnapshot(textRange);
});

test('location calculation newline string', () => {
  const textRange: TextRange = TextRange.fromString('\n');
  matchSnapshot(textRange);
});
