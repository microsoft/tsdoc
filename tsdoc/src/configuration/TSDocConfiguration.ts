import { StandardTags } from '../details/StandardTags';
import { TSDocTagDefinition } from './TSDocTagDefinition';
import { TSDocValidationConfiguration } from './TSDocValidationConfiguration';
import { DocNodeManager } from './DocNodeManager';
import { BuiltInDocNodes } from '../nodes/BuiltInDocNodes';
import { TSDocMessageId, allTsdocMessageIds, allTsdocMessageIdsSet } from '../parser/TSDocMessageId';

/**
 * Configuration for the TSDocParser.
 */
export class TSDocConfiguration {
  private readonly _tagDefinitions: TSDocTagDefinition[];
  private readonly _tagDefinitionsByName: Map<string, TSDocTagDefinition>;
  private readonly _supportedTagDefinitions: Set<TSDocTagDefinition>;
  private readonly _validation: TSDocValidationConfiguration;
  private readonly _docNodeManager: DocNodeManager;
  private readonly _supportedHtmlElements: Set<string>;

  public constructor() {
    this._tagDefinitions = [];
    this._tagDefinitionsByName = new Map<string, TSDocTagDefinition>();
    this._supportedTagDefinitions = new Set<TSDocTagDefinition>();
    this._validation = new TSDocValidationConfiguration();
    this._docNodeManager = new DocNodeManager();
    this._supportedHtmlElements = new Set();

    this.clear(false);

    // Register the built-in node kinds
    BuiltInDocNodes.register(this);
  }

  /**
   * Resets the `TSDocConfiguration` object to its initial empty state.
   * @param noStandardTags - The `TSDocConfiguration` constructor normally adds definitions for the
   * standard TSDoc tags.  Set `noStandardTags` to true for a completely empty `tagDefinitions` collection.
   */
  public clear(noStandardTags: boolean = false): void {
    this._tagDefinitions.length = 0;
    this._tagDefinitionsByName.clear();
    this._supportedTagDefinitions.clear();
    this._validation.ignoreUndefinedTags = false;
    this._validation.reportUnsupportedTags = false;
    this._supportedHtmlElements.clear();

    if (!noStandardTags) {
      // Define all the standard tags
      this.addTagDefinitions(StandardTags.allDefinitions);
    }
  }

  /**
   * The TSDoc tags that are defined in this configuration.
   *
   * @remarks
   * The subset of "supported" tags is tracked by {@link TSDocConfiguration.supportedTagDefinitions}.
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
    return this.tagDefinitions.filter((x) => this.isTagSupported(x));
  }

  /**
   * Enable/disable validation checks performed by the parser.
   */
  public get validation(): TSDocValidationConfiguration {
    return this._validation;
  }

  /**
   * The html tags that are supported in this configuration.
   */
  public get supportedHtmlElements(): string[] {
    return Array.from(this._supportedHtmlElements.values());
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
    const existingDefinition: TSDocTagDefinition | undefined = this._tagDefinitionsByName.get(
      tagDefinition.tagNameWithUpperCase
    );

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
  public addTagDefinitions(
    tagDefinitions: ReadonlyArray<TSDocTagDefinition>,
    supported?: boolean | undefined
  ): void {
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

  /**
   * Overwrite the supported HTML elements.
   */
  public setSupportedHtmlElements(htmlTags: string[]): void {
    this._supportedHtmlElements.clear();
    for (const htmlTag of htmlTags) {
      this._supportedHtmlElements.add(htmlTag);
    }
  }

  /**
   * Overwrite the validator's existing value for `reportUnsupportedHtmlElements`.
   */
  public setReportUnsupportedHtmlElements(reportUnsupportedHtmlElements: boolean): void {
    this.validation.reportUnsupportedHtmlElements = reportUnsupportedHtmlElements;
  }

  /**
   * Returns true if the html tag is supported in this configuration.
   */
  public isHtmlTagSupported(htmlTag: string): boolean {
    if (this._supportedHtmlElements.size === 0) {
      return true;
    }
    return this._supportedHtmlElements.has(htmlTag);
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
    return allTsdocMessageIdsSet.has(messageId);
  }

  /**
   * Returns the list of {@link TSDocMessageId} strings that are implemented by this release of the TSDoc parser.
   *
   * @privateRemarks
   *
   * Why this API is associated with TSDocConfiguration:  In the future, if we enable support for custom extensions
   * of the TSDoc parser, we may provide a way to register custom message identifiers.
   */
  public get allTsdocMessageIds(): ReadonlyArray<TSDocMessageId> {
    return allTsdocMessageIds as ReadonlyArray<TSDocMessageId>;
  }

  private _requireTagToBeDefined(tagDefinition: TSDocTagDefinition): void {
    const matching: TSDocTagDefinition | undefined = this._tagDefinitionsByName.get(
      tagDefinition.tagNameWithUpperCase
    );
    if (matching) {
      if (matching === tagDefinition) {
        return;
      }
    }
    throw new Error('The specified TSDocTagDefinition is not defined for this TSDocConfiguration');
  }
}
