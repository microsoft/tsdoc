
export class Character {
  private static _whitespaceRegExp: RegExp = /^\s$/;

  public static isWhitespace(c: string): boolean {
    return Character._whitespaceRegExp.test(c);
  }
}
