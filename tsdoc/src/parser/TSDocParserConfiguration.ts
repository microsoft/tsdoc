import { StandardTags } from '../details/StandardTags';
import { TSDocTagDefinition } from './TSDocTagDefinition';
import { Standardization } from '../details/Standardization';

/**
 * Part of the {@link TSDocParserConfiguration} object.
 */
export class TSDocParserValidationConfiguration {
  /**
   * Normally the parser will issue errors when it encounters tag names that do not
   * have a corresponding definition in {@link TSDocParserConfiguration.tagDefinitions}.
   *
   * Set this to true to silently ignore such tags.
   *
   * @defaultValue `false`
   */
  public ignoreUndefinedTags: boolean = false;

  /**
   * Normally the parser will issue errors when it encounters tag names that are not
   * listed in {@link TSDocParserConfiguration.supportedTagDefinitions}.
   *
   * Set this to true to silently ignore such tags.
   *
   * @defaultValue `false`
   */
  public ignoreUnsupportedTags: boolean = false;
}

/**
 * Configuration for the TSDocParser.
 */
export class TSDocParserConfiguration {
  private readonly _tagDefinitions: TSDocTagDefinition[];
  private readonly _tagDefinitionsByName: Map<string, TSDocTagDefinition>;
  private readonly _supportedTagDefinitions: Set<TSDocTagDefinition>;
  private readonly _validation: TSDocParserValidationConfiguration;

  public constructor() {
    this._tagDefinitions = [];
    this._tagDefinitionsByName = new Map<string, TSDocTagDefinition>();
    this._supportedTagDefinitions = new Set<TSDocTagDefinition>();
    this._validation = new TSDocParserValidationConfiguration();

    // Define all the standard tags
    this.addTagDefinitions(StandardTags.allDefinitions);

    // But conservatively assume that the application only supports the core tags
    this.setSupportForTags(StandardTags.allDefinitions.filter(
      x => x.standardization === Standardization.Core
    ), true);
  }

  /**
   * The TSDoc block tag names that will be interpreted as modifier tags.
   */
  public get tagDefinitions(): ReadonlyArray<TSDocTagDefinition> {
    return this._tagDefinitions;
  }

  /**
   * Returns the subset of {@link TSDocParserConfiguration.tagDefinitions}
   * that are supported in this configuration.
   */
  public get supportedTagDefinitions(): ReadonlyArray<TSDocTagDefinition> {
    return this.tagDefinitions.filter(x => this.isTagSupported(x));
  }

  /**
   * Enable/disable validation checks performed by the parser.
   */
  public get validation(): TSDocParserValidationConfiguration {
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
   * Use {@link TSDocParserConfiguration.setSupportForTag} to mark it as supported.
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

  public addTagDefinitions(tagDefinitions: ReadonlyArray<TSDocTagDefinition>): void {
    for (const tagDefinition of tagDefinitions) {
      this.addTagDefinition(tagDefinition);
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
   */
  public setSupportForTag(tagDefinition: TSDocTagDefinition, supported: boolean): void {
    this._requireTagToBeDefined(tagDefinition);
    if (supported) {
      this._supportedTagDefinitions.add(tagDefinition);
    } else {
      this._supportedTagDefinitions.delete(tagDefinition);
    }
  }

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
    throw new Error('The specified TSDocTagDefinition is not defined for this TSDocParserConfiguration');
  }
}
