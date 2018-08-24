import { StringChecks } from './StringChecks';
import { StandardTags, Standardization } from '../details/StandardTags';

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
 * Constructor parameters for {@link TSDocTagDefinition}
 */
export interface ITSDocTagDefinitionParameters {
  tagName: string;
  syntaxKind: TSDocTagSyntaxKind;
  allowMultiple?: boolean;
}

/**
 * @internal
 */
export interface ITSDocTagDefinitionInternalParameters extends ITSDocTagDefinitionParameters {
  standardization: Standardization;
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
  public readonly tagNameWithUpperCase: string;

  /**
   * Specifies the expected syntax for this tag.
   */
  public readonly syntaxKind: TSDocTagSyntaxKind;

  /**
   * Indicates the level of support expected from documentation tools that implement
   * the standard.
   */
  public readonly standardization: Standardization;

  /**
   * If true, then this TSDoc tag may appear multiple times in a doc comment.
   * By default, a tag may only appear once.
   */
  public readonly allowMultiple: boolean;

  public constructor(parameters: ITSDocTagDefinitionParameters) {
    StringChecks.validateTSDocTagName(parameters.tagName);
    this.tagName = parameters.tagName;
    this.tagNameWithUpperCase = parameters.tagName.toUpperCase();
    this.syntaxKind = parameters.syntaxKind;
    this.standardization = (parameters as ITSDocTagDefinitionInternalParameters).standardization
      || Standardization.None;
    this.allowMultiple = !!parameters.allowMultiple;
  }
}

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
