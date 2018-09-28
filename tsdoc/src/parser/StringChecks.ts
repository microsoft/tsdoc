/**
 * Helpers for validating various text string formats.
 */
export class StringChecks {
  private static readonly _tsdocTagNameRegExp: RegExp = /^@[a-z][a-z0-9]*$/i;

  private static readonly _urlSchemeRegExp: RegExp = /^[a-z][a-z0-9+\-.]*\:/i;

  private static readonly _identifierNotWordCharRegExp: RegExp = /\W/u;
  private static readonly _identifierNumberStartRegExp: RegExp = /^[0-9]/u;

  private static readonly _reservedWords: Set<string> = new Set<string>([
    'abstract', 'arguments', 'await', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const',
    'continue', 'debugger', 'default', 'delete', 'do', 'double', 'else', 'enum', 'eval', 'export', 'extends',
    'false', 'final', 'finally', 'float', 'for', 'function', 'goto', 'if', 'implements', 'import', 'in',
    'instanceof', 'int', 'interface', 'let', 'long', 'native', 'new', 'null', 'package', 'private', 'protected',
    'public', 'return', 'short', 'static', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws',
    'transient', 'true', 'try', 'typeof', 'var', 'void', 'volatile', 'while', 'with', 'yield'
  ]);

  private static readonly _systemSelectors: Set<string> = new Set<string>([
    // For classes:
    'instance', 'static', 'constructor',

    // For merged declarations:
    'class', 'enum', 'function', 'interface', 'namespace', 'type', 'variable'
  ]);

  private static readonly _customSelectorRegExp: RegExp = /^[A-Z_][A-Z0-9_]+$/;

  private static readonly _positiveIntegerRegExp: RegExp = /^[1-9][0-9]*$/;

  /**
   * Tests whether the input string is a valid TSDoc tag name; if not, returns an error message.
   * TSDoc tag names start with an at-sign ("@") followed by ASCII letters using
   * "camelCase" capitalization.
   */
  public static explainIfInvalidTSDocTagName(tagName: string): string | undefined {
    if (tagName[0] !== '@') {
      return 'A TSDoc tag name must start with an "@" symbol';
    }

    if (!StringChecks._tsdocTagNameRegExp.test(tagName)) {
      return 'A TSDoc tag name must start with a letter and contain only letters and numbers';
    }

    return undefined;
  }

  /**
   * Throws an exception if the input string is not a valid TSDoc tag name.
   * TSDoc tag names start with an at-sign ("@") followed by ASCII letters using
   * "camelCase" capitalization.
   */
  public static validateTSDocTagName(tagName: string): void {
    const explanation: string | undefined = StringChecks.explainIfInvalidTSDocTagName(tagName);
    if (explanation) {
      throw new Error(explanation);
    }
  }

  /**
   * Tests whether the input string is a URL; if not, returns an error message.
   * This check is fairly basic and accepts anything starting with a URI scheme.
   */
  public static explainIfInvalidUrl(url: string): string | undefined {
    if (url.length === 0) {
      return 'The URL cannot be empty';
    }
    if (!StringChecks._urlSchemeRegExp.test(url)) {
      return 'The URL must begin with a scheme followed by a colon character';
    }

    return undefined;
  }

  /**
   * Tests whether the input string is a valid ECMAScript identifier.
   * A precise check is extremely complicated and highly dependent on the standard version
   * and how faithfully the interpreter implements it, so here we use a conservative heuristic.
   */
  public static explainIfInvalidEcmaScriptIdentifier(identifier: string): string | undefined {
    if (identifier.length === 0) {
      return 'The identifier cannot be an empty string';
    }

    if (StringChecks._identifierNotWordCharRegExp.test(identifier)) {
      return 'The identifier cannot non-word characters';
    }

    if (StringChecks._identifierNumberStartRegExp.test(identifier)) {
      return 'The identifier must not start with a number';
    }

    if (StringChecks._reservedWords.has(identifier)) {
      return 'The identifier must not be a reserved word';
    }

    return undefined;
  }

  /**
   * Tests whether the input string is a valid TSDoc system selector label for usage
   * in a declaration reference expression.
   */
  public static explainIfInvalidSystemSelectorLabel(selector: string): string | undefined {
    if (selector.length === 0) {
      return 'The selector label cannot be an empty string';
    }

    if (!StringChecks._systemSelectors.has(selector)) {
      return 'The label is not one of the standard TSDoc system selector names';
    }

    return undefined;
  }

  /**
   * Tests whether the input string is a valid TSDoc user-defined selector label
   * for usage in a declaration reference expression.
   */
  public static explainIfInvalidCustomSelectorLabel(selector: string): string | undefined {
    if (selector.length === 0) {
      return 'The selector label cannot be an empty string';
    }

    if (!StringChecks._customSelectorRegExp.test(selector)) {
      return 'A custom selector label must be comprised of upper case letters, numbers,'
        + ' and underscores and must not start with a number';
    }

    return undefined;
  }

  /**
   * Returns true if the provided string is a positive integer without any spaces.
   */
  public static isPositiveInteger(input: string): boolean {
    return StringChecks._positiveIntegerRegExp.test(input);
  }
}
