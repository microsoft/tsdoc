// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import {
  TSDocParser,
  type ParserContext,
  DocHtmlStartTag,
  DocHtmlAttribute,
  DocDeclarationReference,
  DocMemberReference,
  DocMemberIdentifier,
  DocMemberSelector,
  TSDocConfiguration
} from '../../index';

function createSnapshot(input: string): {} {
  const tsdocParser: TSDocParser = new TSDocParser();
  const parserContext: ParserContext = tsdocParser.parseString(input);
  const output: string = parserContext.docComment.emitAsTsdoc();
  return {
    errors: parserContext.log.messages.map((x) => x.toString()),
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
 * @defaultValue value
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
 * @defaultValue value
 *
 * @public @readonly
 */
",
}
`);
});

// An example containing a title above a code sample.
test('02b Round-trip @example title above a code sample', () => {
  const input: string = `
/**
 * @example Adding two numbers
 * \`\`\`ts
 * add(1, 2);
 * \`\`\`
 */
`;

  expect(createSnapshot(input)).toMatchInlineSnapshot(`
Object {
  "errors": Array [],
  "output": "
/**
 * @example Adding two numbers
 * \`\`\`ts
 * add(1, 2);
 * \`\`\`
 *
 */
",
}
`);
});

// An example whose entire content is on the tag line.
test('02c Round-trip @example title with no body', () => {
  const input: string = `
/**
 * The CPU architecture.
 * @example \`"AMD64"\`
 */
`;

  expect(createSnapshot(input)).toMatchInlineSnapshot(`
Object {
  "errors": Array [],
  "output": "
/**
 * The CPU architecture.
 *
 * @example \`\\"AMD64\\"\`
 */
",
}
`);
});

// An example with inline markup in the title.
test('02d Round-trip @example title with inline markup', () => {
  const input: string = `
/**
 * @example Using {@link add} on negative numbers
 * Body text.
 */
`;

  expect(createSnapshot(input)).toMatchInlineSnapshot(`
Object {
  "errors": Array [],
  "output": "
/**
 * @example Using {@link add} on negative numbers
 * Body text.
 */
",
}
`);
});

// An example with a modifier tag on the tag line ends the example block.
test('02e Round-trip @example title followed by a modifier tag', () => {
  const input: string = `
/**
 * @example Adding two numbers @internal
 * \`\`\`ts
 * add(1, 2);
 * \`\`\`
 */
`;

  expect(createSnapshot(input)).toMatchInlineSnapshot(`
Object {
  "errors": Array [],
  "output": "
/**
 * @example Adding two numbers
 * \`\`\`ts
 * add(1, 2);
 * \`\`\`
 *
 * @internal
 */
",
}
`);
});

// An example whose content begins on the next line has no title.
test('02f Round-trip @example with no title', () => {
  const input: string = `
/**
 * @example
 * An example without a title.
 */
`;

  expect(createSnapshot(input)).toMatchInlineSnapshot(`
Object {
  "errors": Array [],
  "output": "
/**
 * @example
 *
 * An example without a title.
 */
",
}
`);
});

// A tag line containing only whitespace must not emit a trailing space after the tag.
test('02g Round-trip @example with a whitespace-only tag line', () => {
  const input: string = `
/**
 * @example${'   '}
 * An example without a title.
 */
`;

  expect(createSnapshot(input)).toMatchInlineSnapshot(`
Object {
  "errors": Array [],
  "output": "
/**
 * @example
 *
 * An example without a title.
 */
",
}
`);
});

test('03 TSDocEmitter.renderHtmlTag()', () => {
  const configuration: TSDocConfiguration = new TSDocConfiguration();
  const htmlTag: DocHtmlStartTag = new DocHtmlStartTag({
    configuration,
    name: 'img',
    htmlAttributes: [new DocHtmlAttribute({ configuration, name: 'src', value: '"http://example.com"' })]
  });
  expect(htmlTag.emitAsHtml()).toMatchInlineSnapshot(`"<img src=\\"http://example.com\\">"`);
});

test('04 TSDocEmitter.renderDeclarationReference()', () => {
  const configuration: TSDocConfiguration = new TSDocConfiguration();
  const htmlTag: DocDeclarationReference = new DocDeclarationReference({
    configuration,
    packageName: 'my-package',
    memberReferences: [
      new DocMemberReference({
        configuration,
        hasDot: false,
        memberIdentifier: new DocMemberIdentifier({ configuration, identifier: 'MyClass' }),
        selector: new DocMemberSelector({ configuration, selector: 'class' })
      })
    ]
  });
  expect(htmlTag.emitAsTsdoc()).toMatchInlineSnapshot(`"my-package#(MyClass:class)"`);
});
