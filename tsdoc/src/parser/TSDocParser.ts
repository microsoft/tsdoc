import { TextRange } from './TextRange';
import { ParserContext } from './ParserContext';
import { LineExtractor } from './LineExtractor';
import { Tokenizer } from './Tokenizer';
import { NodeParser } from './NodeParser';
import { TSDocParserConfiguration } from './TSDocParserConfiguration';
import { DocCommentAssembler } from './DocCommentAssembler';

/**
 * The main API for parsing TSDoc comments.
 */
export class TSDocParser {
  /**
   * The configuration that was provided for the TSDocParser.
   */
  public readonly configuration: TSDocParserConfiguration;

  public constructor(configuration?: TSDocParserConfiguration) {
    if (configuration) {
      this.configuration = configuration;
    } else {
      this.configuration = new TSDocParserConfiguration();
    }
  }

  public parseString(text: string): ParserContext {
    return this.parseRange(TextRange.fromString(text));
  }

  public parseRange(range: TextRange): ParserContext {
    const parserContext: ParserContext = new ParserContext(this.configuration, range);

    LineExtractor.extract(parserContext);

    /**
     * If we can't extract any lines, then skip the other stages
     * of analysis.
     */
    if (parserContext.parseErrors.length === 0) {
      parserContext.tokens = Tokenizer.readTokens(parserContext.lines);
      const nodeParser: NodeParser = new NodeParser(parserContext);
      nodeParser.parse();

      const docCommentAssembler: DocCommentAssembler = new DocCommentAssembler(parserContext);
      docCommentAssembler.assemble();
    }

    return parserContext;
  }
}
