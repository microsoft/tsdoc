import { Character } from '../internal/Character';

import { DocComment, IDocCommentParameters } from './DocComment';
import { TextRange } from './TextRange';
import { ParseError } from './ParseError';

/**
 * The main API for parsing TSDoc comments.
 */
export class TSDocParser {
  public parseRange(range: TextRange, buffer: string): DocComment {
    return new DocComment(this._parseRange(range, buffer));
  }

  public parseString(text: string): DocComment {
    return this.parseRange(
      new TextRange(0, text.length),
      text
    );
  }

  private _parseRange(range: TextRange, buffer: string): IDocCommentParameters {
    const parameters: IDocCommentParameters = {
      buffer: buffer,
      sourceRange: range,
      commentRange: TextRange.empty,
      lines: [],
      parseErrors: []
    };

    range.validateBounds(buffer);

    let index: number = range.pos;

    enum State {
      Start,
      ExpectOpeningStar1,
      ExpectOpeningStar2,
      Scanning,
      Done
    }
    let state: State = State.Start;

    let commentRangeStart: number = 0;
    let commentRangeEnd: number = 0;

    while (state !== State.Done) {
      if (index > range.end) {
        parameters.parseErrors.push(
          new ParseError('Expecting a leading "/**"', new TextRange(index, 1), buffer)
        );
        return parameters;
      }

      const c: string = buffer[index];

      switch (state) {
        case State.Start:
          if (c === '/') {
            state = State.ExpectOpeningStar1;
          } else if (!Character.isWhitespace(c)) {
            parameters.parseErrors.push(
              new ParseError('Expecting a leading "/**"', new TextRange(index, 1), buffer)
            );
            return parameters;
          }
          commentRangeStart = index;
          ++index;
          break;
        case State.ExpectOpeningStar1:
          if (c !== '*') {
            parameters.parseErrors.push(
              new ParseError('Expecting a leading "/**"', new TextRange(index, 1), buffer)
            );
            return parameters;
          }
          state = State.ExpectOpeningStar2;
          ++index;
          break;
        case State.ExpectOpeningStar2:
          if (c !== '*') {
            parameters.parseErrors.push(
              // We can relax this later
              new ParseError('Expecting a "/**" comment instead of "/*"', new TextRange(index, 1), buffer)
            );
            return parameters;
          }
          commentRangeEnd = index + 1;
          state = State.Done;
          ++index;
          break;
      }
    }

    parameters.commentRange = new TextRange(commentRangeStart, commentRangeEnd);

    return parameters;
  }
}
