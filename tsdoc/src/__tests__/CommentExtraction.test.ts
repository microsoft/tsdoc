import { TSDocParser, DocComment } from '../index';

test('Comment extraction', () => {

  const parser: TSDocParser = new TSDocParser();

  const input: string = `
    /**
     * This is an example doc comment.
     * @remarks
     * Here are some remarks
     *
     * @public
     */
`;

  const docComment: DocComment = parser.parseString(input);
  expect(docComment).toMatchSnapshot('docComment');
  expect(docComment.range.toString()).toMatchSnapshot('docComment.range');
});
