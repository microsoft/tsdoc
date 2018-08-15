/**
 * Helpers for validating various text string formats.
 */
export class StringChecks {
  private static readonly tsdocTagNameRegExp: RegExp = /^@[a-z][a-z0-9]*$/i;

  /**
   * Tests tagName to see whether it is a valid TSDoc tag name; if not, returns an error message.
   * TSDoc tag names start with an at-sign ("@") followed by ASCII letters using
   * "camelCase" capitalization.
   */
  public static explainIfNotTSDocTagName(tagName: string): string | undefined {
    if (tagName[0] !== '@') {
      return 'A TSDoc tag name must start with an "@" symbol';
    }

    if (!StringChecks.tsdocTagNameRegExp.test(tagName)) {
      return 'A TSDoc tag name must start with a letter and contain only letters and numbers';
    }

    return undefined;
  }

  /**
   * Throws an exception if the input is not a valid TSDoc tag name.
   * TSDoc tag names start with an at-sign ("@") followed by ASCII letters using
   * "camelCase" capitalization.
   */
  public static validateTSDocTagName(tagName: string): void {
    const explanation: string | undefined = StringChecks.explainIfNotTSDocTagName(tagName);
    if (explanation) {
      throw new Error(explanation);
    }
  }
}
