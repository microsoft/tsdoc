import { TextRange } from './TextRange';
import { ParserContext } from './ParserContext';
import { LineExtractor } from './LineExtractor';
import { Tokenizer } from './Tokenizer';
import { NodeParser } from './NodeParser';
import { TSDocConfiguration } from './TSDocConfiguration';
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
