// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

import colors from 'colors';

import { TSDocParser, type ParserContext, type DocComment } from '@microsoft/tsdoc';

import { Formatter } from './Formatter';

/**
 * The simple demo does not rely on the TypeScript compiler API; instead, it parses the
 * source file directly.  It uses the default parser configuration.
 */
export function simpleDemo(): void {
  console.log(colors.yellow('*** TSDoc API demo: Simple Scenario ***') + os.EOL);

  const inputFilename: string = path.resolve(path.join(__dirname, '..', 'assets', 'simple-input.ts'));
  console.log('Reading assets/simple-input.ts...');

  const inputBuffer: string = fs.readFileSync(inputFilename).toString();

  // NOTE: Optionally, can provide a TSDocConfiguration here
  const tsdocParser: TSDocParser = new TSDocParser();
  const parserContext: ParserContext = tsdocParser.parseString(inputBuffer);

  console.log(os.EOL + colors.green('Input Buffer:') + os.EOL);
  console.log(colors.gray('<<<<<<'));
  console.log(inputBuffer);
  console.log(colors.gray('>>>>>>'));

  console.log(os.EOL + colors.green('Extracted Lines:') + os.EOL);
  console.log(
    JSON.stringify(
      parserContext.lines.map((x) => x.toString()),
      undefined,
      '  '
    )
  );

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

  console.log(colors.cyan('Summary: ') + JSON.stringify(Formatter.renderDocNode(docComment.summarySection)));

  if (docComment.remarksBlock) {
    console.log(
      colors.cyan('Remarks: ') + JSON.stringify(Formatter.renderDocNode(docComment.remarksBlock.content))
    );
  }

  for (const paramBlock of docComment.params.blocks) {
    console.log(
      colors.cyan(`Parameter "${paramBlock.parameterName}": `) +
        JSON.stringify(Formatter.renderDocNode(paramBlock.content))
    );
  }

  if (docComment.returnsBlock) {
    console.log(
      colors.cyan('Returns: ') + JSON.stringify(Formatter.renderDocNode(docComment.returnsBlock.content))
    );
  }

  console.log(colors.cyan('Modifiers: ') + docComment.modifierTagSet.nodes.map((x) => x.tagName).join(', '));
}
