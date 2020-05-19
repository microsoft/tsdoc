import { StandardTags } from '../details/StandardTags';
import { TSDocTagDefinition, ITSDocTagDefinitionInternalParameters } from './TSDocTagDefinition';
import { TSDocValidationConfiguration } from './TSDocValidationConfiguration';
import { DocNodeManager } from './DocNodeManager';
import { BuiltInDocNodes } from '../nodes/BuiltInDocNodes';
import { TSDocMessageId, allTsdocMessageIds, allTsdocMessageIdsSet } from '../parser/TSDocMessageId';
import { TSDocSynonymCollection } from './TSDocSynonymCollection';
import { StringChecks } from '../parser/StringChecks';

interface ITSDocTagDefinitionOverride {
  derivedTagDefinition: TSDocTagDefinition;
  synonymCollection: TSDocSynonymCollection;
}

/**
 * Configuration for the TSDocParser.
 */
export class TSDocConfiguration {
  private readonly _baseTagDefinitionsByName: Map<string, TSDocTagDefinition>;
  private readonly _baseTagDefinitions: TSDocTagDefinition[];
  private readonly _supportedBaseTagDefinitions: Set<TSDocTagDefinition>;
  private readonly _validation: TSDocValidationConfiguration;
  private readonly _docNodeManager: DocNodeManager;
  private _tagDefinitionOverrides: Map<TSDocTagDefinition, ITSDocTagDefinitionOverride> | undefined;
  private _tagDefinitionOverridesReverseMap: Map<TSDocTagDefinition, TSDocTagDefinition> | undefined;
  private _derivedTagDefinitions: TSDocTagDefinition[] | undefined;
  private _supportedDerivedTagDefinitions: TSDocTagDefinition[] | undefined;

  public constructor() {
    this._baseTagDefinitions = [];
    this._baseTagDefinitionsByName = new Map<string, TSDocTagDefinition>();
    this._supportedBaseTagDefinitions = new Set<TSDocTagDefinition>();
    this._validation = new TSDocValidationConfiguration();
    this._docNodeManager = new DocNodeManager();

    // Define all the standard tags
    this.addTagDefinitions(StandardTags.allDefinitions);

    // Register the built-in node kinds
    BuiltInDocNodes.register(this);
  }

  /**
   * The TSDoc tags that are defined in this configuration.
   *
   * @remarks
   * The subset of "supported" tags is tracked by {@link TSDocConfiguration.supportedTagDefinitions}.
   */
  public get tagDefinitions(): ReadonlyArray<TSDocTagDefinition> {
    if (!this._derivedTagDefinitions) {
      this._derivedTagDefinitions = this._baseTagDefinitions.map(tagDefinition => this.getConfiguredTagDefinition(tagDefinition));
    }
    return this._derivedTagDefinitions;
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
    if (!this._supportedDerivedTagDefinitions) {
      this._supportedDerivedTagDefinitions = this.tagDefinitions.filter(x => this.isTagSupported(x));
    }
    return this._supportedDerivedTagDefinitions;
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
    return this.tryGetTagDefinitionWithUpperCase(tagName.toUpperCase());
  }

  /**
   * Return the tag that was defined with the specified name, or undefined
   * if not found.
   */
  public tryGetTagDefinitionWithUpperCase(alreadyUpperCaseTagName: string): TSDocTagDefinition | undefined {
    const tagDefinition: TSDocTagDefinition | undefined
      = this._baseTagDefinitionsByName.get(alreadyUpperCaseTagName);
    return tagDefinition && this.getConfiguredTagDefinition(tagDefinition);
  }

  /**
   * Return the configured version of a tag definition. If a tag definition has been configured
   * with additional synonyms, the derived tag definition is returned.
   */
  public getConfiguredTagDefinition(tagDefinition: TSDocTagDefinition): TSDocTagDefinition {
    const override: ITSDocTagDefinitionOverride | undefined =
      this._tagDefinitionOverrides && this._tagDefinitionOverrides.get(tagDefinition);
    return override ? override.derivedTagDefinition : tagDefinition;
  }

  /**
   * Define a new TSDoc tag to be recognized by the TSDocParser, and mark it as unsupported.
   * Use {@link TSDocConfiguration.setSupportForTag} to mark it as supported.
   *
   * @remarks
   * If a tag is "defined" this means that the parser recognizes it and understands its syntax.
   * Whereas if a tag is "supported", this means it is defined AND the application implements the tag.
   */
  public addTagDefinition(tagDefinition: TSDocTagDefinition, supported?: boolean | undefined): void {
    this._addTagDefinition(tagDefinition);
    if (supported !== undefined) {
      this.setSupportForTag(tagDefinition, supported);
    }
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
      this.addTagDefinition(tagDefinition, supported);
    }
  }

  /**
   * Returns true if the tag is supported in this configuration.
   */
  public isTagSupported(tagDefinition: TSDocTagDefinition): boolean {
    const baseTagDefinition: TSDocTagDefinition = this._getBaseTagDefinition(tagDefinition);
    this._requireTagToBeDefined(baseTagDefinition);
    return this._supportedBaseTagDefinitions.has(baseTagDefinition);
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
    const baseTagDefinition: TSDocTagDefinition = this._getBaseTagDefinition(tagDefinition);
    this._requireTagToBeDefined(baseTagDefinition);
    if (supported) {
      this._supportedBaseTagDefinitions.add(baseTagDefinition);
    } else {
      this._supportedBaseTagDefinitions.delete(baseTagDefinition);
    }

    this.validation.reportUnsupportedTags = true;
    this._invalidateDerived();
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
   * Adds a synonym to a registered tag definition.
   * @param tagDefinition - The tag definition to which to add a new synonym.
   * @param synonyms - The synonyms to add.
   * @returns The configured version of the provided tag definition.
   */
  public addSynonym(tagDefinition: TSDocTagDefinition, ...synonyms: string[]): TSDocTagDefinition {
    const baseTagDefinition: TSDocTagDefinition = this._getBaseTagDefinition(tagDefinition);
    this._requireTagToBeDefined(baseTagDefinition);

    const synonymsWithUpperCase: string[] = synonyms.map(synonym => synonym.toUpperCase());
    const synonymsToAdd: string[] = [];
    const synonymsWithUpperCaseToAdd: string[] = [];
    for (let i: number = 0; i < synonyms.length; i++) {
      const synonym: string = synonyms[i];
      const synonymWithUpperCase: string = synonymsWithUpperCase[i];
      StringChecks.validateTSDocTagName(synonym);
      
      const existingDefinition: TSDocTagDefinition | undefined
        = this._baseTagDefinitionsByName.get(synonymWithUpperCase);

      if (existingDefinition) {
        if (existingDefinition !== baseTagDefinition) {
          throw new Error(`A tag is already defined using the name ${synonym}`);
        }
        continue;
      }

      synonymsToAdd.push(synonym);
      synonymsWithUpperCaseToAdd.push(synonymWithUpperCase);
    }

    if (synonymsToAdd.length === 0) {
      return this.getConfiguredTagDefinition(baseTagDefinition);
    }

    const override: ITSDocTagDefinitionOverride = this._overrideTagDefinition(baseTagDefinition);
    for (let i: number = 0; i < synonymsToAdd.length; i++) {
      override.synonymCollection.add(synonymsToAdd[i]);
      this._baseTagDefinitionsByName.set(synonymsWithUpperCaseToAdd[i], baseTagDefinition);
    }

    return override.derivedTagDefinition;
  }

  /**
   * Removes a synonym from a registered tag definition.
   * @param tagDefinition - The tag definition from which to remove a synonym.
   * @param synonyms - The synonyms to remove.
   * @returns The configured version of the provided tag definition.
   */
  public removeSynonym(tagDefinition: TSDocTagDefinition, ...synonyms: string[]): TSDocTagDefinition {
    const baseTagDefinition: TSDocTagDefinition = this._getBaseTagDefinition(tagDefinition);
    this._requireTagToBeDefined(baseTagDefinition);

    const synonymsWithUpperCase: string[] = synonyms.map(synonym => synonym.toUpperCase());
    const synonymsToRemove: string[] = [];
    const synonymsWithUpperCaseToRemove: string[] = [];
    for (let i: number = 0; i < synonyms.length; i++) {
      const synonym: string = synonyms[i];
      const synonymWithUpperCase: string = synonymsWithUpperCase[i];
      StringChecks.validateTSDocTagName(synonym);
      
      const existingDefinition: TSDocTagDefinition | undefined
        = this._baseTagDefinitionsByName.get(synonymWithUpperCase);

      if (!existingDefinition) {
        continue;
      }

      if (existingDefinition !== baseTagDefinition) {
        throw new Error(`The synonym ${synonym} is not provided by this tag.`);
      }

      if (baseTagDefinition.tagNameWithUpperCase === synonymWithUpperCase) {
        throw new Error(`${synonym} is the primary tag name for this definition and cannot be removed.`);
      }
  
      synonymsToRemove.push(synonym);
      synonymsWithUpperCaseToRemove.push(synonymWithUpperCase);
    }

    if (synonymsToRemove.length === 0) {
      return this.getConfiguredTagDefinition(baseTagDefinition);
    }
    
    const override: ITSDocTagDefinitionOverride = this._overrideTagDefinition(baseTagDefinition);
    for (let i: number = 0; i < synonymsToRemove.length; i++) {
      override.synonymCollection.delete(synonymsToRemove[i]);
      this._baseTagDefinitionsByName.delete(synonymsWithUpperCaseToRemove[i]);
    }

    return override.derivedTagDefinition;
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

  private _requireTagToBeDefined(baseTagDefinition: TSDocTagDefinition): void {
    const matching: TSDocTagDefinition | undefined
      = this._baseTagDefinitionsByName.get(baseTagDefinition.tagNameWithUpperCase);
    if (matching) {
      if (matching === baseTagDefinition) {
        return;
      }
    }
    throw new Error('The specified TSDocTagDefinition is not defined for this TSDocConfiguration');
  }

  private _getBaseTagDefinition(tagDefinition: TSDocTagDefinition): TSDocTagDefinition {
    return this._tagDefinitionOverridesReverseMap &&
      this._tagDefinitionOverridesReverseMap.get(tagDefinition) || tagDefinition;
  }

  private _addTagDefinition(tagDefinition: TSDocTagDefinition): void {
    const baseTagDefinition: TSDocTagDefinition = this._getBaseTagDefinition(tagDefinition);
    const existingDefinition: TSDocTagDefinition | undefined
      = this._baseTagDefinitionsByName.get(baseTagDefinition.tagNameWithUpperCase);

    if (existingDefinition === baseTagDefinition) {
      return;
    }

    if (existingDefinition) {
      throw new Error(`A tag is already defined using the name ${existingDefinition.tagName}`);
    }

    const synonyms: ReadonlyArray<string> = baseTagDefinition.synonyms;
    const synonymsWithUpperCase: ReadonlyArray<string> = baseTagDefinition.synonymsWithUpperCase;
    const synonymsToAdd: string[] = [];
    for (let i: number = 0; i < synonymsWithUpperCase.length; i++) {
      const synonymWithUpperCase: string = synonymsWithUpperCase[i];
      const existingDefinition: TSDocTagDefinition | undefined
        = this._baseTagDefinitionsByName.get(synonymWithUpperCase);
      if (existingDefinition) {
        if (existingDefinition !== baseTagDefinition) {
          throw new Error(`A tag is already defined using the name ${synonyms[i]}`);
        }
        continue;
      }
      synonymsToAdd.push(synonymWithUpperCase);
    }

    this._baseTagDefinitions.push(baseTagDefinition);
    this._baseTagDefinitionsByName.set(baseTagDefinition.tagNameWithUpperCase, baseTagDefinition);
    for (const synonym of synonymsToAdd) {
      this._baseTagDefinitionsByName.set(synonym, baseTagDefinition);
    }

    this._invalidateDerived();
  }

  private _overrideTagDefinition(baseTagDefinition: TSDocTagDefinition): ITSDocTagDefinitionOverride {
    if (!this._tagDefinitionOverrides) {
      this._tagDefinitionOverrides = new Map<TSDocTagDefinition, ITSDocTagDefinitionOverride>();
    }
    if (!this._tagDefinitionOverridesReverseMap) {
      this._tagDefinitionOverridesReverseMap = new Map<TSDocTagDefinition, TSDocTagDefinition>();
    }

    let override: ITSDocTagDefinitionOverride | undefined =
      this._tagDefinitionOverrides.get(baseTagDefinition);

    if (!override) {
      const synonymCollection: TSDocSynonymCollection = new TSDocSynonymCollection();
      const derivedTagParameters: ITSDocTagDefinitionInternalParameters = {
        tagName: baseTagDefinition.tagName,
        syntaxKind: baseTagDefinition.syntaxKind,
        allowMultiple: baseTagDefinition.allowMultiple,
        standardization: baseTagDefinition.standardization,
        synonyms: baseTagDefinition.synonyms.slice(),
        synonymCollection,
      };

      const derivedTagDefinition: TSDocTagDefinition = new TSDocTagDefinition(derivedTagParameters);
      override = { derivedTagDefinition, synonymCollection };

      this._tagDefinitionOverrides.set(baseTagDefinition, override);
      this._tagDefinitionOverridesReverseMap.set(derivedTagDefinition, baseTagDefinition);
      this._invalidateDerived();
    }

    return override;
  }

  private _invalidateDerived(): void {
    if (this._derivedTagDefinitions) {
      this._derivedTagDefinitions = undefined;
    }
    if (this._supportedDerivedTagDefinitions) {
      this._supportedDerivedTagDefinitions = undefined;
    }
  }
}
