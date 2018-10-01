import { DocNodeKind } from './DocNode';
import { DocNodeLeaf, IDocNodeLeafParameters } from './DocNodeLeaf';
import { StringChecks } from '../parser/StringChecks';

/**
 * Constructor parameters for {@link DocBlockTag}.
 */
export interface IDocBlockTagParameters extends IDocNodeLeafParameters {
  tagName: string;
}

/**
 * Represents a TSDoc block tag such as `@param` or `@public`.
 */
export class DocBlockTag extends DocNodeLeaf {
  /** {@inheritDoc} */
  public readonly kind: DocNodeKind = DocNodeKind.BlockTag;

  private _tagName: string | undefined;              // never undefined after updateParameters()
  private _tagNameWithUpperCase: string | undefined; // never undefined after updateParameters()

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocBlockTagParameters) {
    super(parameters);
  }

  /**
   * The TSDoc tag name.  TSDoc tag names start with an at-sign ("@") followed
   * by ASCII letters using "camelCase" capitalization.
   */
  public get tagName(): string {
    return this._tagName!;
  }

  /**
   * The TSDoc tag name in all capitals, which is used for performing
   * case-insensitive comparisons or lookups.
   */
  public get tagNameWithUpperCase(): string {
    return this._tagNameWithUpperCase!;
  }

  /** @override */
  public updateParameters(parameters: IDocBlockTagParameters): void {
    StringChecks.validateTSDocTagName(parameters.tagName);

    super.updateParameters(parameters);

    this._tagName = parameters.tagName;
    this._tagNameWithUpperCase = this.tagName.toUpperCase();
  }
}
