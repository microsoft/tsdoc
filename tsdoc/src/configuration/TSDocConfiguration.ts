import { StandardTags } from '../details/StandardTags';
import { TSDocTagDefinition } from './TSDocTagDefinition';
import { TSDocValidationConfiguration } from './TSDocValidationConfiguration';
import { DocNodeManager } from './DocNodeManager';
import { BuiltInDocNodes } from '../nodes/BuiltInDocNodes';
import { TSDocMessageId, allTsdocMessageIds } from '../parser/TSDocMessageId';

/**
 * Configuration for the TSDocParser.
 */
export class TSDocConfiguration {
  private readonly _tagDefinitions: TSDocTagDefinition[];
  private readonly _tagDefinitionsByName: Map<string, TSDocTagDefinition>;
  private readonly _supportedTagDefinitions: Set<TSDocTagDefinition>;
  private readonly _validation: TSDocValidationConfiguration;
  private readonly _docNodeManager: DocNodeManager;

  public constructor() {
    this._tagDefinitions = [];
    this._tagDefinitionsByName = new Map<string, TSDocTagDefinition>();
    this._supportedTagDefinitions = new Set<TSDocTagDefinition>();
    this._validation = new TSDocValidationConfiguration();
    this._docNodeManager = new DocNodeManager();

    // Define all the standard tags
    this.addTagDefinitions(StandardTags.allDefinitions);

    // Register the built-in node kinds
    BuiltInDocNodes.register(this);
  }

  /**
   * The TSDoc block tag names that will be interpreted as modifier tags.
   */
  public get tagDefinitions(): readonly TSDocTagDefinition[] {
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
  public get supportedTagDefinitions(): readonly TSDocTagDefinition[] {
    return this.tagDefinitions.filter(x => this.isTagSupported(x));
  }

  /**
   * Enable/disable validation checks performed by the parser.
   */
  public get validation(): TSDocValidationConfiguration {
    return this._validation;
  }

  /**
   * Register custom DocNode subclasses.
   */
  public get docNodeManager(): DocNodeManager {
    return this._docNodeManager;
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
  public addTagDefinitions(tagDefinitions: readonly TSDocTagDefinition[],
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
  public setSupportForTags(tagDefinitions: readonly TSDocTagDefinition[], supported: boolean): void {
    for (const tagDefinition of tagDefinitions) {
      this.setSupportForTag(tagDefinition, supported);
    }
  }

  /**
   * Returns true if the specified {@link TSDocMessageId} string is implemented by this release of the TSDoc parser.
   * This can be used to detect misspelled identifiers.
   *
   * @privateRemarks
   *
   * Why this API is associated with TSDocConfiguration:  In the future, if we enable support for custom extensions
   * of the TSDoc parser, we may provide a way to register custom message identifiers.
   */
  public isKnownMessageId(messageId: TSDocMessageId | string): boolean {
    return allTsdocMessageIds.has(messageId);
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
