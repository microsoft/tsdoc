import { DocComment, IDocCommentParameters } from './nodes/DocComment';
import { TextRange } from './TextRange';
import { ParserContext } from './ParserContext';
import { LineExtractor } from './LineExtractor';

/**
 * The main API for parsing TSDoc comments.
 */
export class TSDocParser {
  public parseString(text: string): DocComment {
    return this.parseRange(TextRange.fromString(text));
  }

  public parseRange(range: TextRange): DocComment {
    const parserContext: ParserContext = new ParserContext(range);

    LineExtractor.extract(parserContext);

    /**
     * If we can't extract any lines, then skip the other stages
     * of analysis.
     */
    if (parserContext.parseErrors.length === 0) {

    }

    return new DocComment({
      range: parserContext.commentRange,
      sourceRange: parserContext.sourceRange,
      lines: parserContext.lines,
      parseErrors: parserContext.parseErrors
    } as IDocCommentParameters);
  }
}
