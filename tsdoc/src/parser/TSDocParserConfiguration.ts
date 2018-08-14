
/**
 * Determines the type of syntax for a TSDocTagDefinition
 */
export enum TSDocTagSyntaxKind {
  /**
   * The tag is intended to be an inline tag.  For example: `{@link}`.
   */
  InlineTag,

  /**
   * The tag is intended to be a block tag that starts a new documentation
   * section.  For example: `@remarks`
   */
  BlockTag,

  /**
   * The tag is intended to be a modifier tag whose presences indicates
   * an aspect of the associated API item.  For example: `@internal`
   */
  ModifierTag
}

/**
 * Defines a TSDoc tag that will be understood by the TSDocParser.
 */
export class TSDocTagDefinition {
  /**
   * The TSDoc tag name.  TSDoc tag names start with an at-sign ("@") followed
   * by ASCII letters using "camelCase" capitalization.
   */
  public readonly tagName: string;

  /**
   * The TSDoc tag name in all capitals, which is used for performing
   * case-insensitive comparisons or lookups.
   */
  public readonly tagNameForComparisons: string;

  /**
   * Specifies the expected syntax for this tag.
   */
  public readonly syntaxKind: TSDocTagSyntaxKind;

  public constructor(tagName: string, syntaxKind: TSDocTagSyntaxKind) {
    this.tagName = tagName;
    this.tagNameForComparisons = tagName.toUpperCase();
    this.syntaxKind = syntaxKind;
  }
}

/**
 * Configuration for the TSDocParser.
 */
export class TSDocParserConfiguration {
  private _tagDefinitions: TSDocTagDefinition[];
  private _tagDefinitionsByName: Map<string, TSDocTagDefinition>;
  /**
   * The TSDoc block tag names that will be interpreted as modifier tags.
   */
  public get tagDefinitions(): ReadonlyArray<TSDocTagDefinition> {
    return this._tagDefinitions;
  }

  /**
   * Return the tag that was defined with the specified name, or undefined
   * if not found.
   */
  public tryGetTagDefinition(tagName: string): TSDocTagDefinition | undefined {
    return this._tagDefinitionsByName.get(tagName.toUpperCase());
  }

  /**
   * Define a new TSDoc tag to be recognized by the TSDocParser.
   */
  public addTagDefinition(tagDefinition: TSDocTagDefinition): void {
    const existingDefinition: TSDocTagDefinition | undefined
      = this._tagDefinitionsByName.get(tagDefinition.tagNameForComparisons);

    if (existingDefinition) {
      throw new Error(`A tag is already defined using the name ${existingDefinition.tagName}`);
    }

    this._tagDefinitions.push(tagDefinition);
    this._tagDefinitionsByName.set(tagDefinition.tagNameForComparisons, tagDefinition);
  }
}
