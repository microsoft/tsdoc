import { ModifierTagSet } from './ModifierTagSet';
import { CoreTags } from './CoreTags';

/**
 * Extends the ModifierTagSet base class with getters for modifiers that
 * are part of the standardized core tags for TSDoc.
 */
export class CoreModifierTagSet extends ModifierTagSet {
  /**
   * Returns true if the `@alpha` modifier tag was specified.
   */
  public get isAlpha(): boolean {
    return this.hasModifierTagWithUpperCase(CoreTags.alpha.tagNameWithUpperCase);
  }

  /**
   * Returns true if the `@beta` modifier tag was specified.
   */
  public get isBeta(): boolean {
    return this.hasModifierTagWithUpperCase(CoreTags.beta.tagNameWithUpperCase);
  }

  /**
   * Returns true if the `@experimental` modifier tag was specified.
   */
  public get isExperimental(): boolean {
    return this.hasModifierTagWithUpperCase(CoreTags.experimental.tagNameWithUpperCase);
  }

  /**
   * Returns true if the `@internal` modifier tag was specified.
   */
  public get isInternal(): boolean {
    return this.hasModifierTagWithUpperCase(CoreTags.internal.tagNameWithUpperCase);
  }

  /**
   * Returns true if the `@readonly` modifier tag was specified.
   */
  public get isReadonly(): boolean {
    return this.hasModifierTagWithUpperCase(CoreTags.readonly.tagNameWithUpperCase);
  }
}
