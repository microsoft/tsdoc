import { TSDocParser, ParserContext } from '../../index';
import { TSDocEmitter } from '../TSDocEmitter';

const input: string = `
/**
 * This is summary paragraph 1.
 *
 * This is summary paragraph 2. @remarks This is the remarks paragraph 1.
 *
 * This is the remarks paragraph 2.
 * @example
 * blah
 * @example
 * \`\`\`ts
 * line1
 * line2
 * \`\`\`
 *
 * @public @readonly
 */
`;

test('Render a comment', () => {
  const tsdocParser: TSDocParser = new TSDocParser();
  const parserContext: ParserContext = tsdocParser.parseString(input);

  const output: string = TSDocEmitter.emit(parserContext.docComment);

  expect({
    errors: parserContext.log.messages.map(x => x.toString()),
    output: '\n' + output
  }).toMatchInlineSnapshot(`
Object {
  "errors": Array [],
  "output": "
/**
 * This is summary paragraph 1.
 *
 * This is summary paragraph 2.
 *
 * @remarks
 * This is the remarks paragraph 1.
 *
 * This is the remarks paragraph 2.
 *
 * @example
 * blah
 *
 * @example
 * \`\`\`ts
 * line1
 * line2
 * \`\`\`
 *
 * @public @readonly
 */
",
}
`);
});
