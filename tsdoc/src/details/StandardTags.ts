import { TSDocTagDefinition, TSDocTagSyntaxKind } from '../parser/TSDocParserConfiguration';

/**
 * Tags whose meaning is defined by the TSDoc standard.
 */
export class StandardTags {
  public static readonly alpha: TSDocTagDefinition = new TSDocTagDefinition({
    tagName: '@alpha',
    syntaxKind: TSDocTagSyntaxKind.ModifierTag
  });

  public static readonly beta: TSDocTagDefinition = new TSDocTagDefinition({
    tagName: '@beta',
    syntaxKind: TSDocTagSyntaxKind.ModifierTag
  });

  public static readonly experimental: TSDocTagDefinition = new TSDocTagDefinition({
    tagName: '@experimental',
    syntaxKind: TSDocTagSyntaxKind.ModifierTag
  });

  public static readonly internal: TSDocTagDefinition = new TSDocTagDefinition({
    tagName: '@internal',
    syntaxKind: TSDocTagSyntaxKind.ModifierTag
  });

  public static readonly param: TSDocTagDefinition = new TSDocTagDefinition({
    tagName: '@param',
    syntaxKind: TSDocTagSyntaxKind.BlockTag
  });

  public static readonly readonly: TSDocTagDefinition = new TSDocTagDefinition({
    tagName: '@readonly',
    syntaxKind: TSDocTagSyntaxKind.ModifierTag
  });

  public static readonly remarks: TSDocTagDefinition = new TSDocTagDefinition({
    tagName: '@remarks',
    syntaxKind: TSDocTagSyntaxKind.BlockTag,
    singleton: true
  });

  public static readonly returns: TSDocTagDefinition = new TSDocTagDefinition({
    tagName: '@returns',
    syntaxKind: TSDocTagSyntaxKind.BlockTag,
    singleton: true
  });

  /**
   * Returns the full list of all core tags.
   */
  public static allDefinitions: ReadonlyArray<TSDocTagDefinition> = [
    StandardTags.alpha,
    StandardTags.beta,
    StandardTags.experimental,
    StandardTags.internal,
    StandardTags.param,
    StandardTags.readonly,
    StandardTags.remarks,
    StandardTags.returns
  ];
}
