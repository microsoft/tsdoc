import {
  TSDocTagDefinition,
  TSDocTagSyntaxKind,
  ITSDocTagDefinitionInternalParameters
} from '../parser/TSDocParserConfiguration';

/**
 * Used to group the {@link StandardTags} definitions according to the level of support
 * expected from documentation tools that implement the standard.
 */
export const enum Standardization {
  /**
   * TSDoc tags belonging to the "Core" set are considered essential.
   * Their meaning is standardized, and every documentation tool is expected
   * to recognize them.
   */
  Core = 'Core',

  /**
   * TSDoc tags belonging to the "Extended" set are optional.  Documentation tools may
   * or may not support them.  If they do, the syntax and semantics should conform to
   * the TSDoc standard definitions.
   */
  Extended = 'Extended',

  /**
   * TSDoc tags belonging to the "Discretionary" set are optional, and their semantics
   * are implementation-defined.  They are included in the standard to ensure that
   * if two different popular tools use the same tag name, they can at least agree about
   * the syntax for the tag.  For example, an implementor should avoid treating
   * `@preapproved` as an inline tag, because the TSDoc standard defines it to be
   * a modifier tag. (The effect of the tag may differ between implementations.)
   */
  Discretionary = 'Discretionary',

  /**
   * The tag is not part of the TSDoc standard.  All custom tags use this group.
   */
  None = 'None'
}

/**
 * Tags whose meaning is defined by the TSDoc standard.
 */
export class StandardTags {
  /**
   * (Discretionary)
   *
   * Suggested meaning: Designates that an API item's release stage is "alpha".
   * It is intended to be used by third-party developers eventually, but has not
   * yet been released.  The tooling may trim the declaration from a public release.
   *
   * Example implementations:  API Extractor
   */
  public static readonly alpha: TSDocTagDefinition = StandardTags._defineTag({
    tagName: '@alpha',
    syntaxKind: TSDocTagSyntaxKind.ModifierTag,
    standardization: Standardization.Discretionary
  });

  /**
   * (Discretionary)
   *
   * Suggested meaning: Designates that an API item's release stage is "beta".
   * It has been released to third-party developers experimentally for the purpose of
   * collecting feedback.  The API should not be used in production, because its contract may
   * change without notice.  The tooling may trim the declaration from a public release,
   * but may include it in a developer preview release.
   *
   * Example implementations:  API Extractor
   *
   * Synonyms: `@experimental`
   */
  public static readonly beta: TSDocTagDefinition = StandardTags._defineTag({
    tagName: '@beta',
    syntaxKind: TSDocTagSyntaxKind.ModifierTag,
    standardization: Standardization.Discretionary
  });

  /**
   * (Discretionary)
   *
   * Suggested meaning:  Same semantics as `@beta`, but used by tools that don't support
   * an `@alpha` release stage.
   *
   * Example implementations:  Angular API documenter
   *
   * Synonyms: `@beta`
   */
  public static readonly experimental: TSDocTagDefinition = StandardTags._defineTag({
    tagName: '@experimental',
    syntaxKind: TSDocTagSyntaxKind.ModifierTag,
    standardization: Standardization.Discretionary
  });

  /**
   * (Discretionary)
   *
   * Suggested meaning:  Designates that an API item is not planned to be used by
   * third-party developers.  The tooling may trim the declaration from a public release.
   * In some implementations, certain designated packages may be allowed to consume
   * internal API items, e.g. because the packages are components of the same product.
   *
   * Example implementations:  API Extractor
   */
  public static readonly internal: TSDocTagDefinition = StandardTags._defineTag({
    tagName: '@internal',
    syntaxKind: TSDocTagSyntaxKind.ModifierTag,
    standardization: Standardization.Discretionary
  });

  /**
   * (Core)
   *
   * Used to document a function parameter.  The `@param` tag is followed by a parameter
   * name, followed by a hyphen, followed by a description.  The TSDoc parser recognizes
   * this syntax and will extract it into a DocParamBlock node.
   */
  public static readonly param: TSDocTagDefinition = StandardTags._defineTag({
    tagName: '@param',
    syntaxKind: TSDocTagSyntaxKind.BlockTag,
    standardization: Standardization.Core
  });

  /**
   * (Extended)
   *
   * This modifier tag indicates that an API item should be documented as being read-only,
   * even if the TypeScript type system may indicate otherwise.  For example, suppose a
   * class property has a setter function that always throws an exception explaining that
   * the property cannot be assigned; in this situation, the `@readonly` modifier can be
   * added so that the property is shown as read-only in the documentation.
   *
   * Example implementations:  API Extractor
   */
  public static readonly readonly: TSDocTagDefinition = StandardTags._defineTag({
    tagName: '@readonly',
    syntaxKind: TSDocTagSyntaxKind.ModifierTag,
    standardization: Standardization.Extended
  });

  /**
   * (Core)
   *
   * The main documentation for an API item is separated into a brief "summary" section,
   * optionally followed by a more detailed "remarks" section.  On a documentation web site,
   * index pages (e.g. showing members of a class) will show only the brief summaries,
   * whereas a detail pages (e.g. describing a single member) will show the summary followed
   * by the remarks.  The `@remarks` block tag ends the summary section, and begins the
   * remarks section for a doc comment.
   */
  public static readonly remarks: TSDocTagDefinition = StandardTags._defineTag({
    tagName: '@remarks',
    syntaxKind: TSDocTagSyntaxKind.BlockTag,
    singleton: true,
    standardization: Standardization.Core
  });

  /**
   * (Core)
   *
   * Used to document the return value for a function.
   */
  public static readonly returns: TSDocTagDefinition = StandardTags._defineTag({
    tagName: '@returns',
    syntaxKind: TSDocTagSyntaxKind.BlockTag,
    singleton: true,
    standardization: Standardization.Core
  });

  /**
   * Returns the full list of all core tags.
   */
  public static allDefinitions: ReadonlyArray<TSDocTagDefinition> = [
    StandardTags.alpha,
    StandardTags.beta,
    StandardTags.experimental,
    StandardTags.internal,
    StandardTags.param,
    StandardTags.readonly,
    StandardTags.remarks,
    StandardTags.returns
  ];

  private static _defineTag(parameters: ITSDocTagDefinitionInternalParameters): TSDocTagDefinition {
    return new TSDocTagDefinition(parameters);
  }
}
