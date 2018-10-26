import { TSDocParser, ParserContext } from '../../index';

function createSnapshot(input: string): {} {
  const tsdocParser: TSDocParser = new TSDocParser();
  const parserContext: ParserContext = tsdocParser.parseString(input);
  const output: string = parserContext.docComment.emitAsTsdoc();
  return {
    errors: parserContext.log.messages.map(x => x.toString()),
    output: '\n' + output
  };
}

test('01 Emit trivial comments', () => {
  expect(createSnapshot(`/***/`)).toMatchInlineSnapshot(`
Object {
  "errors": Array [],
  "output": "
",
}
`);
  expect(createSnapshot(`/**x*/`)).toMatchInlineSnapshot(`
Object {
  "errors": Array [],
  "output": "
/**
 * x
 */
",
}
`);
  expect(createSnapshot(`/** x */`)).toMatchInlineSnapshot(`
Object {
  "errors": Array [],
  "output": "
/**
 * x
 */
",
}
`);
  expect(
    createSnapshot(`
/**
 * x
 */
`)
  ).toMatchInlineSnapshot(`
Object {
  "errors": Array [],
  "output": "
/**
 * x
 */
",
}
`);
});

test('02 Emit a basic comment', () => {
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

  expect(createSnapshot(input)).toMatchInlineSnapshot(`
Object {
  "errors": Array [],
  "output": "
/**
 * This is summary paragraph 1.
 *
 * This is summary paragraph 2.
 *
 * @remarks
 *
 * This is the remarks paragraph 1.
 *
 * This is the remarks paragraph 2.
 *
 * @example
 *
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
