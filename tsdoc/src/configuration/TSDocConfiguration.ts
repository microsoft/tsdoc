import { StandardTags } from '../details/StandardTags';
import { TSDocTagDefinition } from '../parser/TSDocTagDefinition';

/**
 * Part of the {@link TSDocConfiguration} object.
 */
export class TSDocValidationConfiguration {
  /**
   * Set `ignoreUndefinedTags` to true to silently ignore unrecognized tags,
   * instead of reporting a warning.
   *
   * @remarks
   * Normally the parser will issue errors when it encounters tag names that do not
   * have a corresponding definition in {@link TSDocConfiguration.tagDefinitions}.
   * This helps to catch common mistakes such as a misspelled tag.
   *
   * @defaultValue `false`
   */
  public ignoreUndefinedTags: boolean = false;

  /**
   * Set `reportUnsupportedTags` to true to issue a warning for tags that are not
   * supported by your tool.
   *
   * @remarks
   * The TSDoc standard defines may tags.  By default it assumes that if your tool does
   * not implement one of these tags, then it will simply ignore it.  But sometimes this
   * may be misleading for developers. (For example, they might write an `@example` block
   * and then be surprised if it doesn't appear in the documentation output.).
   *
   * For a better experience, you can tell the parser which tags you support, and then it
   * will issue warnings wherever unsupported tags are used.  This is done using
   * {@link TSDocConfiguration.setSupportForTag}.  Note that calling that function
   * automatically sets `reportUnsupportedTags` to true.
   *
   * @defaultValue `false`
   */
  public reportUnsupportedTags: boolean = false;
}

/**
 * Configuration for the TSDocParser.
 */
export class TSDocConfiguration {
  private readonly _tagDefinitions: TSDocTagDefinition[];
  private readonly _tagDefinitionsByName: Map<string, TSDocTagDefinition>;
  private readonly _supportedTagDefinitions: Set<TSDocTagDefinition>;
  private readonly _validation: TSDocValidationConfiguration;

  public constructor() {
    this._tagDefinitions = [];
    this._tagDefinitionsByName = new Map<string, TSDocTagDefinition>();
    this._supportedTagDefinitions = new Set<TSDocTagDefinition>();
    this._validation = new TSDocValidationConfiguration();

    // Define all the standard tags
    this.addTagDefinitions(StandardTags.allDefinitions);
  }

  /**
   * The TSDoc block tag names that will be interpreted as modifier tags.
   */
  public get tagDefinitions(): ReadonlyArray<TSDocTagDefinition> {
    return this._tagDefinitions;
  }

  /**
   * Returns the subset of {@link TSDocConfiguration.tagDefinitions}
   * that are supported in this configuration.
   *
   * @remarks
   * This property is only used when
   * {@link TSDocValidationConfiguration.reportUnsupportedTags} is enabled.
   */
  public get supportedTagDefinitions(): ReadonlyArray<TSDocTagDefinition> {
    return this.tagDefinitions.filter(x => this.isTagSupported(x));
  }

  /**
   * Enable/disable validation checks performed by the parser.
   */
  public get validation(): TSDocValidationConfiguration {
    return this._validation;
  }

  /**
   * Return the tag that was defined with the specified name, or undefined
   * if not found.
   */
  public tryGetTagDefinition(tagName: string): TSDocTagDefinition | undefined {
    return this._tagDefinitionsByName.get(tagName.toUpperCase());
  }

  /**
   * Return the tag that was defined with the specified name, or undefined
   * if not found.
   */
  public tryGetTagDefinitionWithUpperCase(alreadyUpperCaseTagName: string): TSDocTagDefinition | undefined {
    return this._tagDefinitionsByName.get(alreadyUpperCaseTagName);
  }

  /**
   * Define a new TSDoc tag to be recognized by the TSDocParser, and mark it as unsupported.
   * Use {@link TSDocConfiguration.setSupportForTag} to mark it as supported.
   *
   * @remarks
   * If a tag is "defined" this means that the parser recognizes it and understands its syntax.
   * Whereas if a tag is "supported", this means it is defined AND the application implements the tag.
   */
  public addTagDefinition(tagDefinition: TSDocTagDefinition): void {
    const existingDefinition: TSDocTagDefinition | undefined
      = this._tagDefinitionsByName.get(tagDefinition.tagNameWithUpperCase);

    if (existingDefinition === tagDefinition) {
      return;
    }

    if (existingDefinition) {
      throw new Error(`A tag is already defined using the name ${existingDefinition.tagName}`);
    }

    this._tagDefinitions.push(tagDefinition);
    this._tagDefinitionsByName.set(tagDefinition.tagNameWithUpperCase, tagDefinition);
  }

  /**
   * Calls {@link TSDocConfiguration.addTagDefinition} for a list of definitions,
   * and optionally marks them as supported.
   * @param tagDefinitions - the definitions to be added
   * @param supported - if specified, calls the {@link TSDocConfiguration.setSupportForTag}
   *    method to mark the definitions as supported or unsupported
   */
  public addTagDefinitions(tagDefinitions: ReadonlyArray<TSDocTagDefinition>,
    supported?: boolean | undefined): void {

    for (const tagDefinition of tagDefinitions) {
      this.addTagDefinition(tagDefinition);

      if (supported !== undefined) {
        this.setSupportForTag(tagDefinition, supported);
      }
    }
  }

  /**
   * Returns true if the tag is supported in this configuration.
   */
  public isTagSupported(tagDefinition: TSDocTagDefinition): boolean {
    this._requireTagToBeDefined(tagDefinition);
    return this._supportedTagDefinitions.has(tagDefinition);
  }

  /**
   * Specifies whether the tag definition is supported in this configuration.
   * The parser may issue warnings for unsupported tags.
   *
   * @remarks
   * If a tag is "defined" this means that the parser recognizes it and understands its syntax.
   * Whereas if a tag is "supported", this means it is defined AND the application implements the tag.
   *
   * This function automatically sets {@link TSDocValidationConfiguration.reportUnsupportedTags}
   * to true.
   */
  public setSupportForTag(tagDefinition: TSDocTagDefinition, supported: boolean): void {
    this._requireTagToBeDefined(tagDefinition);
    if (supported) {
      this._supportedTagDefinitions.add(tagDefinition);
    } else {
      this._supportedTagDefinitions.delete(tagDefinition);
    }

    this.validation.reportUnsupportedTags = true;
  }

  /**
   * Calls {@link TSDocConfiguration.setSupportForTag} for multiple tag definitions.
   */
  public setSupportForTags(tagDefinitions: ReadonlyArray<TSDocTagDefinition>, supported: boolean): void {
    for (const tagDefinition of tagDefinitions) {
      this.setSupportForTag(tagDefinition, supported);
    }
  }

  private _requireTagToBeDefined(tagDefinition: TSDocTagDefinition): void {
    const matching: TSDocTagDefinition | undefined
      = this._tagDefinitionsByName.get(tagDefinition.tagNameWithUpperCase);
    if (matching) {
      if (matching === tagDefinition) {
        return;
      }
    }
    throw new Error('The specified TSDocTagDefinition is not defined for this TSDocConfiguration');
  }
}
