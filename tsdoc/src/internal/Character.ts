
/**
 * Internal helper class for character tests.
 */
export class Character {
  private static _whitespaceRegExp: RegExp = /^\s$/;

  /**
   * Returns true if "c" is a whitespace character.
   * Matches space, tab, form feed, line feed and other Unicode spaces.
   */
  public static isWhitespace(c: string): boolean {
    return Character._whitespaceRegExp.test(c);
  }
}
