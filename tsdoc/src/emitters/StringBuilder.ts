
export class StringBuilder {
  private _chunks: string[];

  constructor() {
    this._chunks = [];
  }

  public append(text: string): void {
    this._chunks.push(text);
  }

  public toString(): string {
    if (this._chunks.length === 0) {
      return '';
    }

    if (this._chunks.length > 1) {
      const joined: string = this._chunks.join('');
      this._chunks.length = 1;
      this._chunks[0] = joined;
    }

    return this._chunks[0];
  }
}
