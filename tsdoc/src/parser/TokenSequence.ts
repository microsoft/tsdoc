import { ParserContext } from './ParserContext';
import { Token } from './Token';

export interface ITokenSequenceParameters {
  parserContext: ParserContext;
  pos: number;
  end: number;
}

/**
 * Represents a range of tokens extracted from `ParserContext.tokens`.
 */
export class TokenSequence {
  /**
   * The associated parser context that the tokens come from.
   */
  public readonly parserContext: ParserContext;

  private _pos: number;
  private _end: number;

  /**
   * Constructs a TokenSequence object with no tokens.
   */
  public static createEmpty(parserContext: ParserContext): TokenSequence {
    return new TokenSequence({ parserContext, pos: 0, end: 0 });
  }

  public constructor(parameters: ITokenSequenceParameters) {
    this.parserContext = parameters.parserContext;
    this._pos = parameters.pos;
    this._end = parameters.end;
    this._validateBounds();
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

  public isEmpty(): boolean {
    return this._pos === this._end;
  }

  /**
   * Returns the concatenated text of all the tokens.
   */
  public toString(): string {
    return this.tokens.map(x => x.toString()).join('');
  }

  private _validateBounds(): void {
    if (this.pos < 0) {
      throw new Error('TokenSequence.pos cannot be negative');
    }
    if (this.end < 0) {
      throw new Error('TokenSequence.end cannot be negative');
    }
    if (this.end < this.pos) {
      throw new Error('TokenSequence.end cannot be smaller than TokenSequence.pos');
    }
    if (this.pos > this.parserContext.tokens.length) {
      throw new Error('TokenSequence.pos cannot exceed the associated token array');
    }
    if (this.end > this.parserContext.tokens.length) {
      throw new Error('TokenSequence.end cannot exceed the associated token array');
    }
  }
}
