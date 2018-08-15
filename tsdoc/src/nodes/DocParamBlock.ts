import { DocNodeKind } from './DocNode';
import { DocSection, IDocSectionParameters } from './DocSection';

/**
 * Constructor parameters for {@link DocParamBlock}.
 */
export interface IDocParamBlockParameters extends IDocSectionParameters {
  parameterName: string;
}

/**
 * Represents a parsed `@param` block, which provides a description for a
 * function parameter.
 */
export class DocParamBlock extends DocSection {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.ParamBlock;

  /**
   * The name of the parameter that is being documented.
   * For example "width" in `@param width - the width of the object`.
   */
  public readonly parameterName: string;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocParamBlockParameters) {
    super(parameters);
    this.parameterName = parameters.parameterName;
  }
}
