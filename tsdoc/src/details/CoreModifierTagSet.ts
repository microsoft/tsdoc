import { ModifierTagSet } from './ModifierTagSet';
import {
  TSDocParserConfiguration,
  TSDocTagDefinition,
  TSDocTagSyntaxKind
} from '../parser/TSDocParserConfiguration';

/**
 * Extends the ModifierTagSet base class with getters for modifiers that
 * are part of the standardized core tags for TSDoc.
 */
export class CoreModifierTagSet extends ModifierTagSet {
  public static alphaTag: string = '@alpha';
  public static betaTag: string = '@beta';
  public static experimentalTag: string = '@experimental';
  public static internalTag: string = '@internal';
  public static readonlyTag: string = '@readonly';

  public static defineTags(parserConfiguration: TSDocParserConfiguration): void {
    parserConfiguration.addTagDefinitions([
      new TSDocTagDefinition(
        CoreModifierTagSet.alphaTag,
        TSDocTagSyntaxKind.ModifierTag
      ),
      new TSDocTagDefinition(
        CoreModifierTagSet.betaTag,
        TSDocTagSyntaxKind.ModifierTag
      ),
      new TSDocTagDefinition(
        CoreModifierTagSet.experimentalTag,
        TSDocTagSyntaxKind.ModifierTag
      ),
      new TSDocTagDefinition(
        CoreModifierTagSet.internalTag,
        TSDocTagSyntaxKind.ModifierTag
      ),
      new TSDocTagDefinition(
        CoreModifierTagSet.readonlyTag,
        TSDocTagSyntaxKind.ModifierTag
      )
    ]);
  }

  /**
   * Returns true if the `@alpha` modifier tag was specified.
   */
  public get isAlpha(): boolean {
    return this.hasModifierTag(CoreModifierTagSet.alphaTag);
  }

  /**
   * Returns true if the `@beta` modifier tag was specified.
   */
  public get isBeta(): boolean {
    return this.hasModifierTag(CoreModifierTagSet.betaTag);
  }

  /**
   * Returns true if the `@experimental` modifier tag was specified.
   */
  public get isExperimental(): boolean {
    return this.hasModifierTag(CoreModifierTagSet.experimentalTag);
  }

  /**
   * Returns true if the `@internal` modifier tag was specified.
   */
  public get isInternal(): boolean {
    return this.hasModifierTag(CoreModifierTagSet.internalTag);
  }

  /**
   * Returns true if the `@readonly` modifier tag was specified.
   */
  public get isReadonly(): boolean {
    return this.hasModifierTag(CoreModifierTagSet.readonlyTag);
  }
}
