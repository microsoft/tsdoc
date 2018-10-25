import { TSDocParser, ParserContext } from '../../index';
import { TSDocEmitter } from '../TSDocEmitter';
import { StringBuilder } from '../StringBuilder';

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

  const output: StringBuilder = new StringBuilder();
  const commentRenderer: TSDocEmitter = new TSDocEmitter();
  commentRenderer.renderComment(output, parserContext.docComment);

  expect({
    errors: parserContext.log.messages.map(x => x.toString()),
    output: '\n' + output.toString()
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
