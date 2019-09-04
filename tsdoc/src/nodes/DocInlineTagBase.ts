import { IDocNodeParameters, DocNode, IDocNodeParsedParameters } from './DocNode';
import { StringChecks } from '../parser/StringChecks';
import { TokenSequence } from '../parser/TokenSequence';
import { DocExcerpt, ExcerptKind } from './DocExcerpt';

/**
 * Constructor parameters for {@link DocInlineTagBase}.
 */
export interface IDocInlineTagBaseParameters extends IDocNodeParameters {
  tagName: string;
}

/**
 * Constructor parameters for {@link DocInlineTagBase}.
 */
export interface IDocInlineTagBaseParsedParameters extends IDocNodeParsedParameters {
  openingDelimiterExcerpt: TokenSequence;

  tagNameExcerpt: TokenSequence;
  tagName: string;
  spacingAfterTagNameExcerpt?: TokenSequence;

  closingDelimiterExcerpt: TokenSequence;
}

/**
 * The abstract base class for {@link DocInlineTag}, {@link DocLink}, and {@link DocInheritDoc}.
 */
export abstract class DocInlineTagBase extends DocNode {
  private readonly _openingDelimiterExcerpt: DocExcerpt | undefined;

  private readonly _tagName: string;
  private readonly _tagNameWithUpperCase: string;
  private readonly _tagNameExcerpt: DocExcerpt | undefined;
  private readonly _spacingAfterTagNameExcerpt: DocExcerpt | undefined;

  private readonly _closingDelimiterExcerpt: DocExcerpt | undefined;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocInlineTagBaseParameters | IDocInlineTagBaseParsedParameters) {
    super(parameters);

    StringChecks.validateTSDocTagName(parameters.tagName);

    if (DocNode.isParsedParameters(parameters)) {
      this._openingDelimiterExcerpt = new DocExcerpt({
        configuration: this.configuration,
        excerptKind: ExcerptKind.InlineTag_OpeningDelimiter,
        content: parameters.openingDelimiterExcerpt
      });

      this._tagNameExcerpt = new DocExcerpt({
        configuration: this.configuration,
        excerptKind: ExcerptKind.InlineTag_TagName,
        content: parameters.tagNameExcerpt
      });

      if (parameters.spacingAfterTagNameExcerpt) {
        this._spacingAfterTagNameExcerpt = new DocExcerpt({
          configuration: this.configuration,
          excerptKind: ExcerptKind.Spacing,
          content: parameters.spacingAfterTagNameExcerpt
        });
      }

      this._closingDelimiterExcerpt = new DocExcerpt({
        configuration: this.configuration,
        excerptKind: ExcerptKind.InlineTag_ClosingDelimiter,
        content: parameters.closingDelimiterExcerpt
      });
    }

    this._tagName = parameters.tagName;
    this._tagNameWithUpperCase = parameters.tagName.toUpperCase();
  }

  /**
   * The TSDoc tag name.  TSDoc tag names start with an at-sign ("@") followed
   * by ASCII letters using "camelCase" capitalization.
   *
   * @remarks
   * For example, if the inline tag is `{@link Guid.toString | the toString() method}`
   * then the tag name would be `@link`.
   */
  public get tagName(): string {
    return this._tagName;
  }

  /**
   * The TSDoc tag name in all capitals, which is used for performing
   * case-insensitive comparisons or lookups.
   */
  public get tagNameWithUpperCase(): string {
    return this._tagNameWithUpperCase;
  }

  /** @override @sealed */
  protected onGetChildNodes(): ReadonlyArray<DocNode | undefined> {
    return [
      this._openingDelimiterExcerpt,
      this._tagNameExcerpt,
      this._spacingAfterTagNameExcerpt,
      ...this.getChildNodesForContent(),
      this._closingDelimiterExcerpt
    ];
  }

  /**
   * Allows child classes to replace the tagContentParticle with a more detailed
   * set of nodes.
   * @virtual
   */
  protected abstract getChildNodesForContent(): ReadonlyArray<DocNode | undefined>;
}
