import { StringChecks } from '../parser/StringChecks';
import { Standardization } from '../details/Standardization';
import { DocBlockTag, DocInlineTagBase } from '../nodes';
import { TSDocSynonymCollection } from './TSDocSynonymCollection';

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
  synonyms?: string[];
  allowMultiple?: boolean;
}

/**
 * @internal
 */
export interface ITSDocTagDefinitionInternalParameters extends ITSDocTagDefinitionParameters {
  standardization: Standardization;
  synonymCollection?: TSDocSynonymCollection;
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

  private _synonymCollection: TSDocSynonymCollection;

  public constructor(parameters: ITSDocTagDefinitionParameters) {
    StringChecks.validateTSDocTagName(parameters.tagName);
    this.tagName = parameters.tagName;
    this.tagNameWithUpperCase = parameters.tagName.toUpperCase();
    this.syntaxKind = parameters.syntaxKind;
    this.standardization = (parameters as ITSDocTagDefinitionInternalParameters).standardization
      || Standardization.None;
    this.allowMultiple = !!parameters.allowMultiple;
    this._synonymCollection = (parameters as ITSDocTagDefinitionInternalParameters).synonymCollection ||
      new TSDocSynonymCollection();
    if (parameters.synonyms) {
      for (const synonym of parameters.synonyms) {
        if (synonym !== this.tagName) {
          this._synonymCollection.add(synonym);
        }
      }
    }
  }

  /**
   * Synonyms for the TSDoc tag.  TSDoc tag names start with an at-sign ("@") followed
   * by ASCII letters using "camelCase" capitalization.
   */
  public get synonyms(): ReadonlyArray<string> {
    return this._synonymCollection.synonyms;
  }

  /**
   * Synonyms for the TSDoc tag in all capitals, which is used for performing
   * case-insensitive comparisons or lookups.
   */
  public get synonymsWithUpperCase(): ReadonlyArray<string> {
    return this._synonymCollection.synonymsWithUpperCase;
  }

  /**
   * Returns whether this tag definition is a definition of the provided tag.
   */
  public isDefinitionOfTag(tag: DocBlockTag | DocInlineTagBase): boolean {
    const hasCorrectKind: boolean = this.syntaxKind === TSDocTagSyntaxKind.InlineTag ?
      tag instanceof DocInlineTagBase :
      tag instanceof DocBlockTag;
    return hasCorrectKind && this.hasTagName(tag.tagNameWithUpperCase);
  }

  /**
   * Returns whether the provided tag name is defined by this tag definition.
   */
  public hasTagName(tagName: string): boolean {
    const tagNameWithUpperCase: string = tagName.toUpperCase();
    return this.tagNameWithUpperCase === tagNameWithUpperCase ||
      this.synonymsWithUpperCase.indexOf(tagNameWithUpperCase) >= 0;
  }
}
