import { StandardTags } from '../details/StandardTags';
import { TSDocTagDefinition } from './TSDocTagDefinition';

/**
 * Configuration for the TSDocParser.
 */
export class TSDocParserConfiguration {
  private _tagDefinitions: TSDocTagDefinition[];
  private _tagDefinitionsByName: Map<string, TSDocTagDefinition>;

  public constructor() {
    this._tagDefinitions = [];
    this._tagDefinitionsByName = new Map<string, TSDocTagDefinition>();

    this.addTagDefinitions(StandardTags.allDefinitions);
  }

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
   * Return the tag that was defined with the specified name, or undefined
   * if not found.
   */
  public tryGetTagDefinitionWithUpperCase(alreadyUpperCaseTagName: string): TSDocTagDefinition | undefined {
    return this._tagDefinitionsByName.get(alreadyUpperCaseTagName);
  }

  /**
   * Define a new TSDoc tag to be recognized by the TSDocParser.
   */
  public addTagDefinition(tagDefinition: TSDocTagDefinition): void {
    const existingDefinition: TSDocTagDefinition | undefined
      = this._tagDefinitionsByName.get(tagDefinition.tagNameWithUpperCase);

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
}
