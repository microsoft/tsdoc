import { DocBlockTag } from '../nodes/DocBlockTag';
import { TSDocTagDefinition, TSDocTagSyntaxKind } from '../parser/TSDocParserConfiguration';

/**
 * Represents a set of modifier tags that were extracted from a doc comment.
 *
 * @remarks
 * TSDoc modifier tags are block tags that do not have any associated rich text content.
 * Instead, their presence or absence acts as an on/off switch, indicating some aspect
 * of the underlying API item.  For example, the `@internal` modifier indicates that a
 * signature is internal (i.e. not part of the public API contract).
 */
export class ModifierTagSet {
  private readonly _nodes: DocBlockTag[] = [];

  // NOTE: To implement case insensitivity, the keys in this set are always upper-case.
  // This convention makes the normalization more obvious (and as a general practice handles
  // the Turkish "i" character correctly).
  private readonly _names: Set<string> = new Set<string>();

  /**
   * The original block tag nodes that defined the modifiers in this set.
   */
  public get nodes(): ReadonlyArray<DocBlockTag> {
    return this._nodes;
  }

  /**
   * Returns true if a DocBlockTag with the specified tag name was added to this set.
   * Note that synonyms are not considered.  The comparison is case-insensitive.
   * @param tagName - The name of the tag, including the `@` prefix  For example, `@internal`
   */
  public hasModifierTag(modifierTag: string): boolean {
    return this._names.has(modifierTag.toUpperCase());
  }

  /**
   * Returns true if a DocBlockTag with the specified tag name was added to this set.
   * Note that synonyms are not considered.  The comparison is case-insensitive.
   * @param tagName - The name of the tag, including the `@` prefix  For example, `@internal`
   */
  public hasModifierTagWithUpperCase(alreadyUpperCaseModifierTag: string): boolean {
    return this._names.has(alreadyUpperCaseModifierTag);
  }

  /**
   * Returns true if a DocBlockTag with the specified modifier tag was added to this set.
   * Note that synonyms are not considered.  The comparison is case-insensitive.
   * The TSDocTagDefinition must be a modifier tag.
   * @param tagName - The name of the tag, including the `@` prefix  For example, `@internal`
   */
  public hasModifier(modifier: TSDocTagDefinition): boolean {
    if (modifier.syntaxKind !== TSDocTagSyntaxKind.ModifierTag) {
      throw new Error('The tag definition is not a modifier tag');
    }
    return this._names.has(modifier.tagNameWithUpperCase);
  }

  /**
   * Adds a new modifier tag to the set.  If a tag already exists with the same name,
   * then no change is made, and the return value is false.
   */
  public addModifierTag(blockTag: DocBlockTag): boolean {
    if (this._names.has(blockTag.tagNameWithUpperCase)) {
      return false;
    }

    this._names.add(blockTag.tagNameWithUpperCase);
    this._nodes.push(blockTag);

    return true;
  }
}
