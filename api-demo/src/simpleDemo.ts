import * as colors from 'colors';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { TSDocParser, ParserContext, DocComment } from '@microsoft/tsdoc';
import { Formatter } from './Formatter';

/**
 * The simple demo does not rely on the TypeScript compiler.
 * It uses the default parser configuration.
 */
export function simpleDemo(): void {
  console.log(colors.yellow('*** TSDoc API demo: Simple Scenario ***') + os.EOL);

  const inputFilename: string = path.resolve(path.join(__dirname, '..', 'assets', 'simple-input.ts'));
  console.log('Reading assets/simple-input.ts...');

  const inputBuffer: string = fs.readFileSync(inputFilename).toString();

  // NOTE: Optionally, can provide a TSDocParserConfiguration here
  const tsdocParser: TSDocParser = new TSDocParser();
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
    for (const message of parserContext.log.messages) {
      console.log(inputFilename + message.toString());
    }
  }

  console.log(os.EOL + colors.green('DocComment parts:') + os.EOL);

  const docComment: DocComment = parserContext.docComment;

  console.log(colors.cyan('Summary: ')
    + JSON.stringify(Formatter.renderDocNode(docComment.summarySection)));

  if (docComment.remarksBlock) {
    console.log(colors.cyan('Remarks: ')
    + JSON.stringify(Formatter.renderDocNodes(docComment.remarksBlock.nodes)));
  }

  for (const paramBlock of docComment.paramBlocks) {
    console.log(colors.cyan(`Parameter "${paramBlock.parameterName}": `)
    + JSON.stringify(Formatter.renderDocNodes(paramBlock.nodes)));
  }

  if (docComment.returnsBlock) {
    console.log(colors.cyan('Returns: ')
    + JSON.stringify(Formatter.renderDocNodes(docComment.returnsBlock.nodes)));
  }

  console.log(colors.cyan('Modifiers: ')
    + docComment.modifierTagSet.nodes.map(x => x.tagName).join(', '));
}
