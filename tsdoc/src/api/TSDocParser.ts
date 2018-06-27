import { Character } from '../internal/Character';

import { DocComment, IDocCommentParameters } from './nodes/DocComment';
import { TextRange } from './TextRange';
import { ParseError } from './ParseError';

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
export class TSDocParser {
  private static _addError(parameters: IDocCommentParameters, range: TextRange,
    message: string, pos: number, end?: number): void {
    if (!end) {
      if (pos + 1 <= range.buffer.length) {
        end = pos + 1;
      } else {
        end = pos;
      }
    }
    parameters.parseErrors.push(
      new ParseError(message, range.getNewRange(pos, end))
    );
  }

  public parseString(text: string): DocComment {
    return this.parseRange(TextRange.fromString(text));
  }

  public parseRange(range: TextRange): DocComment {
    const parameters: IDocCommentParameters = {
      range: TextRange.empty,
      sourceRange: range,
      lines: [],
      parseErrors: []
    };
    this._parseLines(parameters);

    return new DocComment(parameters);
  }

  /**
   * This step parses an entire code comment from slash-star-star until star-slash,
   * and extracts the content lines.  The lines are stored in IDocCommentParameters.lines
   * and the overall text range is assigned to IDocCommentParameters.range.
   */
  private _parseLines(parameters: IDocCommentParameters): void {
    const range: TextRange = parameters.sourceRange;
    const buffer: string = range.buffer;

    let commentRangeStart: number = 0;
    let commentRangeEnd: number = 0;

    // These must be set before entering CollectingFirstLine, CollectingLine, or AdvancingLine
    let collectingLineStart: number = 0;
    let collectingLineEnd: number = 0;

    let nextIndex: number = range.pos;
    let state: State = State.BeginComment1;

    while (state !== State.Done) {
      if (nextIndex >= range.end) {
        // reached the end of the input
        switch (state) {
          case State.BeginComment1:
          case State.BeginComment2:
            TSDocParser._addError(parameters, range, 'Expecting a "/**" comment', range.pos);
              return;
          default:
            TSDocParser._addError(parameters, range, 'Unexpected end of input', range.pos);
            return;
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
          } else if (!Character.isWhitespace(current)) {
            TSDocParser._addError(parameters, range, 'Expecting a leading "/**"', nextIndex);
            return;
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
            TSDocParser._addError(parameters, range, 'Expecting a leading "/**"', nextIndex);
            return;
          }
          break;
        case State.CollectingFirstLine:
        case State.CollectingLine:
          if (current === '\n') {
            // Ignore an empty line if it is immediately after the "/**"
            if (state !== State.CollectingFirstLine || collectingLineEnd > collectingLineStart) {
              // Record the line that we collected
              parameters.lines.push(range.getNewRange(collectingLineStart, collectingLineEnd));
            }
            collectingLineStart = nextIndex;
            collectingLineEnd = nextIndex;
            state = State.AdvancingLine;
          } else if (current === '*' && next === '/') {
            if (collectingLineEnd > collectingLineStart) {
              parameters.lines.push(range.getNewRange(collectingLineStart, collectingLineEnd));
            }
            collectingLineStart = 0;
            collectingLineEnd = 0;
            ++nextIndex; // skip the slash
            commentRangeEnd = nextIndex;
            state = State.Done;
          } else if (!Character.isWhitespace(current)) {
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
            parameters.lines.push(range.getNewRange(currentIndex, currentIndex));
            collectingLineStart = nextIndex;
          } else if (!Character.isWhitespace(current)) {
            // If the star is missing, then start the line here
            // Example: "/**\nL1*/"

            // (collectingLineStart was the start of this line)
            collectingLineEnd = currentIndex;
            state = State.CollectingLine;
          }
          break;
      }
    }

    parameters.range = range.getNewRange(commentRangeStart, commentRangeEnd);
  }
}
