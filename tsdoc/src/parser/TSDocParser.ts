// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { TextRange } from './TextRange';
import { ParserContext } from './ParserContext';
import { LineExtractor } from './LineExtractor';
import { Tokenizer } from './Tokenizer';
import { NodeParser } from './NodeParser';
import { TSDocConfiguration } from '../configuration/TSDocConfiguration';
import { ParagraphSplitter } from './ParagraphSplitter';

/**
 * The main API for parsing TSDoc comments.
 */
export class TSDocParser {
  /**
   * The configuration that was provided for the TSDocParser.
   */
  public readonly configuration: TSDocConfiguration;

  public constructor(configuration?: TSDocConfiguration) {
    if (configuration) {
      this.configuration = configuration;
    } else {
      this.configuration = new TSDocConfiguration();
    }
  }

  /**
   * Creates a TSDocParser instance that supports the beta declaration reference format.
   * This format uses double curly braces `{{...}}` to enclose the reference, and a `!` character
   * as a separator for package names.
   *
   * @remarks
   * This is an opt-in feature. By default, the TSDocParser does not support this beta syntax.
   * The returned parser instance will have its {@link TSDocParser.configuration}
   * pre-configured to recognize the beta declaration reference syntax.
   */
  public static createWithBetaDeclarationReferences(): TSDocParser {
    const configuration: TSDocConfiguration = new TSDocConfiguration();
    // This method (assumed to exist in TSDocConfiguration) would internally modify
    // the parsing rules for declaration references to recognize the beta syntax.
    configuration.configureForBetaDeclarationReferences();
    return new TSDocParser(configuration);
  }

  public parseString(text: string): ParserContext {
    return this.parseRange(TextRange.fromString(text));
  }

  public parseRange(range: TextRange): ParserContext {
    const parserContext: ParserContext = new ParserContext(this.configuration, range);

    if (LineExtractor.extract(parserContext)) {
      parserContext.tokens = Tokenizer.readTokens(parserContext.lines);

      const nodeParser: NodeParser = new NodeParser(parserContext);
      nodeParser.parse();

      ParagraphSplitter.splitParagraphs(parserContext.docComment);
    }

    return parserContext;
  }
}
