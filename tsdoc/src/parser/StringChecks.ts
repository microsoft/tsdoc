/**
 * Helpers for validating various text string formats.
 */
export class StringChecks {
  private static readonly _tsdocTagNameRegExp: RegExp = /^@[a-z][a-z0-9]*$/i;

  private static readonly _urlSchemeRegExp: RegExp = /^[a-z][a-z0-9]*\:\/\//i;
  private static readonly _urlSchemeAfterRegExp: RegExp = /^[a-z][a-z0-9]*\:\/\/./i;

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

  private static readonly _validPackageNameRegExp: RegExp = /^(?:@[a-z0-9\-_\.]+\/)?[a-z0-9\-_\.]+$/i;

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
   * Tests whether the input string is a URL form supported inside an "@link" tag; if not,
   * returns an error message.
   */
  public static explainIfInvalidLinkUrl(url: string): string | undefined {
    if (url.length === 0) {
      return 'The URL cannot be empty';
    }
    if (!StringChecks._urlSchemeRegExp.test(url)) {
      return 'An @link URL must begin with a scheme comprised only of letters and numbers followed by "://".'
        + ' (For general URLs, use an HTML "<a>" tag instead.)';
    }
    if (!StringChecks._urlSchemeAfterRegExp.test(url)) {
      return 'An @link URL must have at least one character after "://"';
    }

    return undefined;
  }

  /**
   * Tests whether the input string is a valid NPM package name.
   */
  public static explainIfInvalidPackageName(packageName: string): string | undefined {
    if (packageName.length === 0) {
      return 'The package name cannot be an empty string';
    }

    if (!StringChecks._validPackageNameRegExp.test(packageName)) {
      return `The package name ${JSON.stringify(packageName)} is not a valid package name`;
    }

    return undefined;
  }

  /**
   * Tests whether the input string is a valid declaration reference import path.
   */
  public static explainIfInvalidImportPath(importPath: string, prefixedByPackageName: boolean): string | undefined {
    if (importPath.length > 0) {
      if (importPath.indexOf('//') >= 0) {
        return 'An import path must not contain "//"';
      }
      if (importPath[importPath.length - 1] === '/') {
        return 'An import path must not end with "/"';
      }

      if (!prefixedByPackageName) {
        if (importPath[0] === '/') {
          return 'An import path must not start with "/" unless prefixed by a package name';
        }
      }
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
}
