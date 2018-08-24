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
  public isAlpha(): boolean {
    return this.hasModifierTagWithUpperCase(StandardTags.alpha.tagNameWithUpperCase);
  }

  /**
   * Returns true if the `@beta` modifier tag was specified.
   */
  public isBeta(): boolean {
    return this.hasModifierTagWithUpperCase(StandardTags.beta.tagNameWithUpperCase);
  }

  /**
   * Returns true if the `@eventProperty` modifier tag was specified.
   */
  public isEventProperty(): boolean {
    return this.hasModifierTagWithUpperCase(StandardTags.eventProperty.tagNameWithUpperCase);
  }

  /**
   * Returns true if the `@experimental` modifier tag was specified.
   */
  public isExperimental(): boolean {
    return this.hasModifierTagWithUpperCase(StandardTags.experimental.tagNameWithUpperCase);
  }

  /**
   * Returns true if the `@internal` modifier tag was specified.
   */
  public isInternal(): boolean {
    return this.hasModifierTagWithUpperCase(StandardTags.internal.tagNameWithUpperCase);
  }

  /**
   * Returns true if the `@override` modifier tag was specified.
   */
  public isOverride(): boolean {
    return this.hasModifierTagWithUpperCase(StandardTags.override.tagNameWithUpperCase);
  }

  /**
   * Returns true if the `@packageDocumentation` modifier tag was specified.
   */
  public isPackageDocumentation(): boolean {
    return this.hasModifierTagWithUpperCase(StandardTags.packageDocumentation.tagNameWithUpperCase);
  }

  /**
   * Returns true if the `@public` modifier tag was specified.
   */
  public isPublic(): boolean {
    return this.hasModifierTagWithUpperCase(StandardTags.public.tagNameWithUpperCase);
  }

  /**
   * Returns true if the `@readonly` modifier tag was specified.
   */
  public isReadonly(): boolean {
    return this.hasModifierTagWithUpperCase(StandardTags.readonly.tagNameWithUpperCase);
  }

  /**
   * Returns true if the `@sealed` modifier tag was specified.
   */
  public isSealed(): boolean {
    return this.hasModifierTagWithUpperCase(StandardTags.sealed.tagNameWithUpperCase);
  }

  /**
   * Returns true if the `@virtual` modifier tag was specified.
   */
  public isVirtual(): boolean {
    return this.hasModifierTagWithUpperCase(StandardTags.virtual.tagNameWithUpperCase);
  }
}
