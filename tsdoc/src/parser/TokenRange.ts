import { ParserContext } from './ParserContext';
import { Token } from './Token';

/**
 * Represents a range of tokens extracted from `ParserContext.tokens`.
 */
export class TokenRange {
  /**
   * The associated parser context that the tokens come from.
   */
  public readonly parserContext: ParserContext;

  private _pos: number;
  private _end: number;

  public constructor(parserContext: ParserContext) {
    this._pos = -1;
    this._end = -1;
  }

  /**
   * The starting index into the associated `ParserContext.tokens` list.
   */
  public get pos(): number {
    return this._pos;
  }

  /**
   * The (non-inclusive) ending index into the associated `ParserContext.tokens` list.
   */
  public get end(): number {
    return this._end;
  }

  public get tokens(): ReadonlyArray<Token> {
    return this.parserContext.tokens.slice(this._pos, this._end);
  }
}
