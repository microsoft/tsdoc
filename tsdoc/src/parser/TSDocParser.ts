import { TextRange } from './TextRange';
import { ParserContext } from './ParserContext';
import { LineExtractor } from './LineExtractor';
import { Tokenizer } from './Tokenizer';
import { NodeParser } from './NodeParser';

/**
 * The main API for parsing TSDoc comments.
 */
export class TSDocParser {
  public parseString(text: string): ParserContext {
    return this.parseRange(TextRange.fromString(text));
  }

  public parseRange(range: TextRange): ParserContext {
    const parserContext: ParserContext = LineExtractor.extract(range);

    /**
     * If we can't extract any lines, then skip the other stages
     * of analysis.
     */
    if (parserContext.parseErrors.length === 0) {
      parserContext.tokens = Tokenizer.readTokens(parserContext.lines);
      const nodeParser: NodeParser = new NodeParser(parserContext);
      nodeParser.parse();
    }

    return parserContext;
  }
}
