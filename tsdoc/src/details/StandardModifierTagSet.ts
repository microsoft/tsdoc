import { ModifierTagSet } from './ModifierTagSet';
import { StandardTags } from './StandardTags';

/**
 * Extends the ModifierTagSet base class with getters for modifiers that
 * are part of the standardized core tags for TSDoc.
 */
export class StandardModifierTagSet extends ModifierTagSet {
  /**
   * Returns true if the `@alpha` modifier tag was specified.
   */
  public get isAlpha(): boolean {
    return this.hasModifierTagWithUpperCase(StandardTags.alpha.tagNameWithUpperCase);
  }

  /**
   * Returns true if the `@beta` modifier tag was specified.
   */
  public get isBeta(): boolean {
    return this.hasModifierTagWithUpperCase(StandardTags.beta.tagNameWithUpperCase);
  }

  /**
   * Returns true if the `@experimental` modifier tag was specified.
   */
  public get isExperimental(): boolean {
    return this.hasModifierTagWithUpperCase(StandardTags.experimental.tagNameWithUpperCase);
  }

  /**
   * Returns true if the `@internal` modifier tag was specified.
   */
  public get isInternal(): boolean {
    return this.hasModifierTagWithUpperCase(StandardTags.internal.tagNameWithUpperCase);
  }

  /**
   * Returns true if the `@readonly` modifier tag was specified.
   */
  public get isReadonly(): boolean {
    return this.hasModifierTagWithUpperCase(StandardTags.readonly.tagNameWithUpperCase);
  }
}
