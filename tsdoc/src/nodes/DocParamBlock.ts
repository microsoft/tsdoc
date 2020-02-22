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

  unsupportedJsdocTypeBeforeParameterNameExcerpt?: TokenSequence;
  unsupportedJsdocOptionalNameOpenBracketExcerpt?: TokenSequence;

  parameterNameExcerpt: TokenSequence;
  parameterName: string;

  unsupportedJsdocOptionalNameRestExcerpt?: TokenSequence;

  spacingAfterParameterNameExcerpt?: TokenSequence;

  unsupportedJsdocTypeAfterParameterNameExcerpt?: TokenSequence;

  hyphenExcerpt?: TokenSequence;

  spacingAfterHyphenExcerpt?: TokenSequence;

  unsupportedJsdocTypeAfterHyphenExcerpt?: TokenSequence;
}

/**
 * Represents a parsed `@param` or `@typeParam` block, which provides a description for a
 * function parameter.
 */
export class DocParamBlock extends DocBlock {
  private readonly _spacingBeforeParameterNameExcerpt: DocExcerpt | undefined;

  private readonly _unsupportedJsdocTypeBeforeParameterNameExcerpt: DocExcerpt | undefined;
  private readonly _unsupportedJsdocOptionalNameOpenBracketExcerpt: DocExcerpt | undefined;

  private readonly _parameterName: string;
  private readonly _parameterNameExcerpt: DocExcerpt | undefined;

  private readonly _unsupportedJsdocOptionalNameRestExcerpt: DocExcerpt | undefined;

  private readonly _spacingAfterParameterNameExcerpt: DocExcerpt | undefined;

  private readonly _unsupportedJsdocTypeAfterParameterNameExcerpt: DocExcerpt | undefined;

  private readonly _hyphenExcerpt: DocExcerpt | undefined;
  private readonly _spacingAfterHyphenExcerpt: DocExcerpt | undefined;

  private readonly _unsupportedJsdocTypeAfterHyphenExcerpt: DocExcerpt | undefined;

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
          configuration: this.configuration,
          excerptKind: ExcerptKind.Spacing,
          content: parameters.spacingBeforeParameterNameExcerpt
        });
      }

      if (parameters.unsupportedJsdocTypeBeforeParameterNameExcerpt) {
        this._unsupportedJsdocTypeBeforeParameterNameExcerpt = new DocExcerpt({
          configuration: this.configuration,
          excerptKind: ExcerptKind.NonstandardText,
          content: parameters.unsupportedJsdocTypeBeforeParameterNameExcerpt
        });
      }

      if (parameters.unsupportedJsdocOptionalNameOpenBracketExcerpt) {
        this._unsupportedJsdocOptionalNameOpenBracketExcerpt = new DocExcerpt({
          configuration: this.configuration,
          excerptKind: ExcerptKind.NonstandardText,
          content: parameters.unsupportedJsdocOptionalNameOpenBracketExcerpt
        });
      }

      this._parameterNameExcerpt = new DocExcerpt({
        configuration: this.configuration,
        excerptKind: ExcerptKind.ParamBlock_ParameterName,
        content: parameters.parameterNameExcerpt
      });

      if (parameters.unsupportedJsdocOptionalNameRestExcerpt) {
        this._unsupportedJsdocOptionalNameRestExcerpt = new DocExcerpt({
          configuration: this.configuration,
          excerptKind: ExcerptKind.NonstandardText,
          content: parameters.unsupportedJsdocOptionalNameRestExcerpt
        });
      }

      if (parameters.spacingAfterParameterNameExcerpt) {
        this._spacingAfterParameterNameExcerpt = new DocExcerpt({
          configuration: this.configuration,
          excerptKind: ExcerptKind.Spacing,
          content: parameters.spacingAfterParameterNameExcerpt
        });
      }

      if (parameters.unsupportedJsdocTypeAfterParameterNameExcerpt) {
        this._unsupportedJsdocTypeAfterParameterNameExcerpt = new DocExcerpt({
          configuration: this.configuration,
          excerptKind: ExcerptKind.NonstandardText,
          content: parameters.unsupportedJsdocTypeAfterParameterNameExcerpt
        });
      }

      if (parameters.hyphenExcerpt) {
        this._hyphenExcerpt = new DocExcerpt({
          configuration: this.configuration,
          excerptKind: ExcerptKind.ParamBlock_Hyphen,
          content: parameters.hyphenExcerpt
        });
      }

      if (parameters.spacingAfterHyphenExcerpt) {
        this._spacingAfterHyphenExcerpt = new DocExcerpt({
          configuration: this.configuration,
          excerptKind: ExcerptKind.Spacing,
          content: parameters.spacingAfterHyphenExcerpt
        });
      }

      if (parameters.unsupportedJsdocTypeAfterHyphenExcerpt) {
        this._unsupportedJsdocTypeAfterHyphenExcerpt = new DocExcerpt({
          configuration: this.configuration,
          excerptKind: ExcerptKind.NonstandardText,
          content: parameters.unsupportedJsdocTypeAfterHyphenExcerpt
        });
      }

    }
  }

  /** @override */
  public get kind(): DocNodeKind | string {
    return DocNodeKind.ParamBlock;
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
      this._unsupportedJsdocTypeBeforeParameterNameExcerpt,
      this._unsupportedJsdocOptionalNameOpenBracketExcerpt,
      this._parameterNameExcerpt,
      this._unsupportedJsdocOptionalNameRestExcerpt,
      this._spacingAfterParameterNameExcerpt,
      this._unsupportedJsdocTypeAfterParameterNameExcerpt,
      this._hyphenExcerpt,
      this._spacingAfterHyphenExcerpt,
      this._unsupportedJsdocTypeAfterHyphenExcerpt,
      this.content
    ];
  }
}
