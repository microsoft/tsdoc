import { TSDocParser, DocComment } from '../index';

function escape(s: string): string {
  return s.replace(/\n/g, '[n]')
    .replace(/\r/g, '[r]');
}

function parseAndMatchSnapshot(buffer: string): void {
  const tsdocParser: TSDocParser = new TSDocParser();
  const docComment: DocComment = tsdocParser.parseString(buffer);
  expect({
    buffer: escape(buffer),
    errors: docComment.parseErrors,
    comment: escape(docComment.range.toString()),
    lines: docComment.lines.map(line => escape(line.toString()))
  }).toMatchSnapshot();
}

test('Newline examples', () => {
  parseAndMatchSnapshot([
    '',
    '/**',
    ' * L1',
    ' */',
    ''
  ].join('\r\n'));
  parseAndMatchSnapshot([
    '/**',
    'L1',
    'L2',
    '*/'
  ].join('\r\n'));

  // We currently don't support CR or LFCR, so a single "\r" is treated
  // as part of the line.
  parseAndMatchSnapshot(`/** L \r 1 */`);
});

test('Spacing variations', () => {
  parseAndMatchSnapshot(`/***/`);                      // 1
  parseAndMatchSnapshot(` /***/ `);                    // 2
  parseAndMatchSnapshot(` /** */ `);                   // 3
  parseAndMatchSnapshot(` /**\n\n*/ `);                // 4
  parseAndMatchSnapshot(` /**L1*/ `);                  // 5
  parseAndMatchSnapshot(` /** L1 */ `);                // 6
  parseAndMatchSnapshot(` /**L1\n*/ `);                // 7
  parseAndMatchSnapshot(` /**L1*\n*/ `);               // 8
  parseAndMatchSnapshot(` /**\nL1*/ `);                // 9
  parseAndMatchSnapshot(` /**\n L1 */ `);              // 10
  parseAndMatchSnapshot(` /**\nL1\n*/ `);              // 11
  parseAndMatchSnapshot(` /**\nL1\n\nL2*/ `);          // 12
  parseAndMatchSnapshot(` /**\n*L1\n*/ `);             // 13
  parseAndMatchSnapshot(` /**\n * L1\n*/ `);           // 14
  parseAndMatchSnapshot(` /**\n * L1\n */ `);          // 15
  parseAndMatchSnapshot(` /**L1\n *L2\nL3*/ `);        // 16
  parseAndMatchSnapshot(` /** L1\n * L2\n L3*/ `);     // 17
  parseAndMatchSnapshot(` /** L1 \n * L2 \n L3 */ `);  // 18
  parseAndMatchSnapshot([                              // 19
    '/**  L1  ',
    ' *  L2  ',
    '  L3  ',
    '  L4 */'
  ].join('\r\n'));
});

// TODO: Special handling for these somewhat common ornamentations
test('Stars added', () => {
  parseAndMatchSnapshot(` /****/ `);
  parseAndMatchSnapshot(` /**L1**/ `);
  parseAndMatchSnapshot(` /***L1*/ `);
  parseAndMatchSnapshot(`
/*****
 **X**
 *****/ `);
});
