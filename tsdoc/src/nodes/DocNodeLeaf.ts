import { Excerpt } from '../parser/Excerpt';
import { DocNode, IDocNodeParameters } from './DocNode';

/**
 * Constructor parameters for {@link DocNodeLeaf}.
 */
export interface IDocNodeLeafParameters extends IDocNodeParameters {
  excerpt?: Excerpt;
}

/**
 * Abstract base class for `DocNode` subclasses that correspond to input text,
 * i.e. can have an associated Excerpt object.
 */
export abstract class DocNodeLeaf extends DocNode {
  private _excerpt: Excerpt | undefined;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocNodeLeafParameters) {
    super(parameters);
  }

  /**
   * If this DocNode was created by parsing an input, the `DocNode.excerpt`
   * property can be used to track the associated input text.  This can be useful
   * for highlighting matches during refactoring or highlighting error locations.
   */
  public get excerpt(): Excerpt | undefined {
    return this._excerpt;
  }

  /** @override */
  public updateParameters(parameters: IDocNodeLeafParameters): void {
    super.updateParameters(parameters);

    this._excerpt = parameters.excerpt;
  }

  /**
   * Allows the DocNodeLeaf.excerpt to be updated after the object was constructed.
   */
  public updateExcerpt(excerpt: Excerpt | undefined): void {
    this._excerpt = excerpt;
  }
}
