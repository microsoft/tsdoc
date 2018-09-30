import { DocNodeKind, DocNode } from './DocNode';
import { DocNodeLeaf, IDocNodeLeafParameters } from './DocNodeLeaf';
import { Excerpt } from '../parser/Excerpt';
import { DocParticle } from './DocParticle';
import { StringChecks } from '../parser/StringChecks';

/**
 * Constructor parameters for {@link DocMemberSelector}.
 */
export interface IDocMemberSelectorParameters extends IDocNodeLeafParameters {
  labelExcerpt?: Excerpt;
  label: string;
}

/**
 * Kinds of TSDoc selectors.
 */
export const enum SelectorKind {
  /**
   * Used in cases where the parser encounters a string that is incorrect but
   * valid enough that a DocMemberSelector node was created.
   */
  Error = 'error',

  /**
   * System selectors are always all lower-case and belong to a set of predefined label names.
   */
  System = 'system',

  /**
   * Index selectors are integer numbers.  They provide an alternative way of referencing
   * overloaded functions, based on the order in which the declarations appear in
   * a source file.
   *
   * @remarks
   * Warning:  Index selectors are not recommended; they are intended to provide a temporary
   * workaround for situations where an external library neglected to declare a `{@label}` tag
   * and cannot be easily fixed.
   */
  Index = 'index',

  /**
   * Custom selectors refer to labels created using the `{@label}` TSDoc tag.
   * The labels are always comprised of upper-case letters or numbers separated by underscores,
   * and the first character cannot be a number.
   */
  Custom = 'custom'
}

/**
 */
export class DocMemberSelector extends DocNodeLeaf {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.MemberSelector;

  private _labelParticle: DocParticle | undefined;  // never undefined after updateParameters()

  private _selectorKind: SelectorKind | undefined;  // never undefined after updateParameters()

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocMemberSelectorParameters) {
    super(parameters);
  }

  /**
   * Indicates the kind of selector.
   */
  public get selectorKind(): SelectorKind {
    return this._selectorKind!;
  }

  /** @override */
  public updateParameters(parameters: IDocMemberSelectorParameters): void {
    super.updateParameters(parameters);

    this._labelParticle = new DocParticle({
      particleId: 'label',
      excerpt: parameters.labelExcerpt,
      content: parameters.label
    });

    this._selectorKind = SelectorKind.Error;

    if (StringChecks.explainIfInvalidSystemSelectorLabel(parameters.label)) {
      this._selectorKind = SelectorKind.System;
    } else if (StringChecks.explainIfInvalidCustomSelectorLabel(parameters.label)) {
      this._selectorKind = SelectorKind.Custom;
    } else if (StringChecks.isPositiveInteger(parameters.label)) {
      this._selectorKind = SelectorKind.Index;
    }
  }

  /**
   * {@inheritdoc}
   * @override
   */
  public getChildNodes(): ReadonlyArray<DocNode> {
    return [
      this._labelParticle!
    ];
  }
}
