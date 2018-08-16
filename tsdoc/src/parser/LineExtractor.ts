import { TextRange } from './TextRange';
import { ParserContext } from './ParserContext';

// Internal parser state
enum State {
  // Initial state, looking for "/*"
  BeginComment1,
  // Looking for "*" or "* " after "/*"
  BeginComment2,
  // Like State.CollectingLine except immediately after the "/**"
  CollectingFirstLine,
  // Collecting characters until we reach a newline
  CollectingLine,
  // After a newline, looking for the "*" that begins a new line, or the "*/" to end the comment
  AdvancingLine,
  // Exiting the parser loop
  Done
}

/**
 * The main API for parsing TSDoc comments.
 */
export class LineExtractor {
  private static readonly _whitespaceRegExp: RegExp = /^\s$/;

  /**
   * This step parses an entire code comment from slash-star-star until star-slash,
   * and extracts the content lines.  The lines are stored in IDocCommentParameters.lines
   * and the overall text range is assigned to IDocCommentParameters.range.
   */
  public static extract(parserContext: ParserContext): boolean {
    const range: TextRange = parserContext.sourceRange;
    const buffer: string = range.buffer;

    let commentRangeStart: number = 0;
    let commentRangeEnd: number = 0;

    // These must be set before entering CollectingFirstLine, CollectingLine, or AdvancingLine
    let collectingLineStart: number = 0;
    let collectingLineEnd: number = 0;

    let nextIndex: number = range.pos;
    let state: State = State.BeginComment1;

    const lines: TextRange[] = [];

    while (state !== State.Done) {
      if (nextIndex >= range.end) {
        // reached the end of the input
        switch (state) {
          case State.BeginComment1:
          case State.BeginComment2:
            parserContext.log.addMessageForTextRange('Expecting a "/**" comment', range);
            return false;
          default:
            parserContext.log.addMessageForTextRange('Unexpected end of input', range);
            return false;
        }
      }

      const current: string = buffer[nextIndex];
      const currentIndex: number = nextIndex;
      ++nextIndex;
      const next: string = nextIndex < range.end ? buffer[nextIndex] : '';

      switch (state) {
        case State.BeginComment1:
          if (current === '/' && next === '*') {
            commentRangeStart = currentIndex;
            ++nextIndex; // skip the star
            state = State.BeginComment2;
          } else if (!LineExtractor._whitespaceRegExp.test(current)) {
            parserContext.log.addMessageForTextRange('Expecting a leading "/**"',
              range.getNewRange(currentIndex, currentIndex + 1));
            return false;
          }
          break;
        case State.BeginComment2:
          if (current === '*') {
            if (next === ' ') {
              ++nextIndex; // Discard the space after the star
            }
            collectingLineStart = nextIndex;
            collectingLineEnd = nextIndex;
            state = State.CollectingFirstLine;
          } else {
            parserContext.log.addMessageForTextRange('Expecting a leading "/**"',
              range.getNewRange(currentIndex, currentIndex + 1));
            return false;
          }
          break;
        case State.CollectingFirstLine:
        case State.CollectingLine:
          if (current === '\n') {
            // Ignore an empty line if it is immediately after the "/**"
            if (state !== State.CollectingFirstLine || collectingLineEnd > collectingLineStart) {
              // Record the line that we collected
              lines.push(range.getNewRange(collectingLineStart, collectingLineEnd));
            }
            collectingLineStart = nextIndex;
            collectingLineEnd = nextIndex;
            state = State.AdvancingLine;
          } else if (current === '*' && next === '/') {
            if (collectingLineEnd > collectingLineStart) {
              lines.push(range.getNewRange(collectingLineStart, collectingLineEnd));
            }
            collectingLineStart = 0;
            collectingLineEnd = 0;
            ++nextIndex; // skip the slash
            commentRangeEnd = nextIndex;
            state = State.Done;
          } else if (!LineExtractor._whitespaceRegExp.test(current)) {
            collectingLineEnd = nextIndex;
          }
          break;
        case State.AdvancingLine:
          if (current === '*') {
            if (next === '/') {
              collectingLineStart = 0;
              collectingLineEnd = 0;

              ++nextIndex; // skip the slash
              commentRangeEnd = nextIndex;
              state = State.Done;
            } else {
              // Discard the "*" at the start of a line

              if (next === ' ') {
                ++nextIndex; // Discard the space after the star
              }

              collectingLineStart = nextIndex;
              collectingLineEnd = nextIndex;
              state = State.CollectingLine;
            }
          } else if (current === '\n') {
            // Blank line
            lines.push(range.getNewRange(currentIndex, currentIndex));
            collectingLineStart = nextIndex;
          } else if (!LineExtractor._whitespaceRegExp.test(current)) {
            // If the star is missing, then start the line here
            // Example: "/**\nL1*/"

            // (collectingLineStart was the start of this line)
            collectingLineEnd = currentIndex;
            state = State.CollectingLine;
          }
          break;
      }
    }

    /**
     * Only fill in these if we successfully scanned a comment
     */
    parserContext.commentRange = range.getNewRange(commentRangeStart, commentRangeEnd);
    parserContext.lines = lines;
    return true;
  }
}
