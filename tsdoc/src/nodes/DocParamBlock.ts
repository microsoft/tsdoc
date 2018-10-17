import { DocNodeKind, DocNode } from './DocNode';
import { DocBlock, IDocBlockParameters, IDocBlockParsedParameters } from './DocBlock';
import { TokenSequence } from '../parser/TokenSequence';
import { DocExcerpt, ExcerptKind } from './DocExcerpt';

/**
 * Constructor parameters for {@link DocParamBlock}.
 */
export interface IDocParamBlockParameters extends IDocBlockParameters {
  parameterName: string;
}

/**
 * Constructor parameters for {@link DocParamBlock}.
 */
export interface IDocParamBlockParsedParameters extends IDocBlockParsedParameters {
  spacingBeforeParameterNameExcerpt?: TokenSequence;

  parameterNameExcerpt: TokenSequence;
  parameterName: string;

  spacingAfterParameterNameExcerpt?: TokenSequence;

  hyphenExcerpt: TokenSequence;
  spacingAfterHyphenExcerpt?: TokenSequence;
}

/**
 * Represents a parsed `@param` or `@typeParam` block, which provides a description for a
 * function parameter.
 */
export class DocParamBlock extends DocBlock {
  /** {@inheritDoc} */
  public readonly kind: DocNodeKind = DocNodeKind.ParamBlock;

  private readonly _spacingBeforeParameterNameExcerpt: DocExcerpt | undefined;

  private readonly _parameterName: string;
  private readonly _parameterNameExcerpt: DocExcerpt | undefined;

  private readonly _spacingAfterParameterNameExcerpt: DocExcerpt | undefined;

  private readonly _hyphenExcerpt: DocExcerpt | undefined;

  private readonly _spacingAfterHyphenExcerpt: DocExcerpt | undefined;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocParamBlockParameters | IDocParamBlockParsedParameters) {
    super(parameters);

    this._parameterName = parameters.parameterName;

    if (DocNode.isParsedParameters(parameters)) {
      if (parameters.spacingBeforeParameterNameExcerpt) {
        this._spacingBeforeParameterNameExcerpt = new DocExcerpt({
          excerptKind: ExcerptKind.Spacing,
          content: parameters.spacingBeforeParameterNameExcerpt
        });
      }

      this._parameterNameExcerpt = new DocExcerpt({
        excerptKind: ExcerptKind.ParamBlock_ParameterName,
        content: parameters.parameterNameExcerpt
      });

      if (parameters.spacingAfterParameterNameExcerpt) {
        this._spacingAfterParameterNameExcerpt = new DocExcerpt({
          excerptKind: ExcerptKind.Spacing,
          content: parameters.spacingAfterParameterNameExcerpt
        });
      }

      this._hyphenExcerpt = new DocExcerpt({
        excerptKind: ExcerptKind.ParamBlock_Hyphen,
        content: parameters.hyphenExcerpt
      });

      if (parameters.spacingAfterHyphenExcerpt) {
        this._spacingAfterHyphenExcerpt = new DocExcerpt({
          excerptKind: ExcerptKind.Spacing,
          content: parameters.spacingAfterHyphenExcerpt
        });
      }
    }
  }

  /**
   * The name of the parameter that is being documented.
   * For example "width" in `@param width - the width of the object`.
   */
  public get parameterName(): string {
    return this._parameterName;
  }

  /** @override */
  protected onGetChildNodes(): ReadonlyArray<DocNode | undefined> {
    return [
      this.blockTag,
      this._spacingBeforeParameterNameExcerpt,
      this._parameterNameExcerpt,
      this._spacingAfterParameterNameExcerpt,
      this._hyphenExcerpt,
      this._spacingAfterHyphenExcerpt,
      this.content
    ];
  }
}
