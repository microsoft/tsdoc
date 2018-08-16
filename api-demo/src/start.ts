import * as os from 'os';
import * as colors from 'colors';
import { TSDocParser, ParserContext, DocComment } from '@microsoft/tsdoc';

console.log(colors.cyan('*** TSDoc API demo ***'));
console.log();

const tsdocParser: TSDocParser = new TSDocParser();

const inputBuffer: string = [
  /* line  1 */ ' ',
  /* line  2 */ '  /**',
  /* line  3 */ '   * Adds two numbers together.',
  /* line  4 */ '   *',
  /* line  5 */ '   * @remarks',
  /* line  6 */ '   * This method is part of the {@link core-libary/Math | Math subsystem}.',
  /* line  7 */ '   * This HTML tag has an error: <tag',
  /* line  7 */ '   *',
  /* line  8 */ '   * @param x - The first number to add',
  /* line  9 */ '   * @param y - The second number to add',
  /* line  0 */ '   * @returns The sum of `x` and `y`',
  /* line 11 */ '   *',
  /* line 12 */ '   * @beta',
  /* line 13 */ '   */',
  /* line 14 */ '            '
].join('\n');

const parserContext: ParserContext = tsdocParser.parseString(inputBuffer);

console.log(os.EOL + colors.green('Input Buffer:') + os.EOL);
console.log(colors.gray('<<<<<<'));
console.log(inputBuffer);
console.log(colors.gray('>>>>>>'));

console.log(os.EOL + colors.green('Extracted Lines:') + os.EOL);
console.log(JSON.stringify(parserContext.lines.map(x => x.toString()), undefined, '  '));

console.log(os.EOL + colors.green('Parser Log Messages:') + os.EOL);

if (parserContext.log.messages.length === 0) {
  console.log('No errors or warnings.');
} else {
  for (const message of parserContext.log.messages.map(x => x.toString())) {
    console.log(message);
  }
}
